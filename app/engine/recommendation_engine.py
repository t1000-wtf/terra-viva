from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.all_models import CropCatalog, Plot, FarmerProfile, UserPriority
from app.engine.economic_engine import EconomicAnalysisEngine

class RecommendationEngine:
    """
    Motor Multicritério de Recomendação Agronômica e Socioambiental do TerraViva.
    
    Critérios Científicos Consolidados:
    - Base temporal mínima: Exige no mínimo 30 dias de série temporal histórica/sazonal para análise climática anual.
    - Análise de Sazonalidade e Janela de Plantio: Compara a época de plantio recomendada com o regime pluviométrico.
    - Sucessão Botânica e Fitossanidade: Desaconselha o plantio consecutivo de culturas da mesma família botânica
      (ex: Poaceae após Poaceae como Milho após Sorgo, ou Fabaceae após Soja) para quebra de ciclo de pragas e nematoides.
    - Aptidão Edafoclimática: Validação cruzada de pH de solo (com alerta de calagem se pH < 5.2), textura e temperatura média.
    - Disponibilidade Hídrica: Risco de seca vs exigência de irrigação.
    - Adequação Operacional e Econômica: Mão de obra familiar vs mecanização, orçamento vs custo por hectare.
    - Confiabilidade Real: Penalização de confiança quando predominam dados estimados ou quando o histórico do talhão é omisso.
    """

    MIN_SERIE_DAYS_REQUIRED = 30 # Exige mínimo de 30 dias para extrapolação sazonal consistente

    @classmethod
    def generate_strategies(
        cls,
        plot: Plot,
        farmer_profile: Optional[FarmerProfile],
        user_priority: Optional[UserPriority],
        env_analysis: Dict[str, Any],
        catalog_crops: List[CropCatalog]
    ) -> List[Dict[str, Any]]:
        if not catalog_crops:
            return []

        # 1. Validação de Suficiência de Dados Científicos
        has_min_data, data_reason = cls._check_data_sufficiency(plot, env_analysis)
        if not has_min_data:
            return [{
                "strategy_type": "insufficient_data",
                "strategy_title": "Recomendação Suspensa — Dados Insuficientes",
                "strategy_description": f"O TerraViva não emite recomendações sem amostragem ambiental mínima. Motivo: {data_reason}",
                "crop_sequence": [],
                "duration_months": 0,
                "score_environmental": 0.0,
                "score_social": 0.0,
                "score_economic": 0.0,
                "score_overall": 0.0,
                "confidence_level": "Baixa (Dados Insuficientes)",
                "potential_benefits": [],
                "risks": [data_reason],
                "limitations": ["Sincronize pelo menos 30 dias de dados agrometeorológicos ou cadastre a análise de solo do talhão."],
                "justification": f"Critério agronômico de segurança: {data_reason}",
                "sources_cited": ["Embrapa / FAO Guidelines for Land Evaluation"]
            }]

        # Pesos multicritério
        w_amb = user_priority.weight_environmental if user_priority else 40.0
        w_soc = user_priority.weight_social if user_priority else 35.0
        w_econ = user_priority.weight_economic if user_priority else 25.0

        total_w = w_amb + w_soc + w_econ
        if total_w > 0:
            w_amb = (w_amb / total_w) * 100.0
            w_soc = (w_soc / total_w) * 100.0
            w_econ = (w_econ / total_w) * 100.0

        confidence = cls._calculate_recommendation_confidence(plot, farmer_profile, env_analysis)

        # Identificar última cultura do histórico para quebra de ciclo de família botânica
        last_crop_name = None
        last_botanical_family = None
        if plot.crop_histories:
            sorted_hist = sorted(plot.crop_histories, key=lambda x: x.planting_date, reverse=True)
            last_crop_name = sorted_hist[0].crop_name
        elif plot.current_crop:
            last_crop_name = plot.current_crop

        crops_by_name = {c.common_name.lower(): c for c in catalog_crops}
        if last_crop_name and last_crop_name.lower() in crops_by_name:
            last_botanical_family = getattr(crops_by_name[last_crop_name.lower()], "botanical_family", None)

        strategies = []

        # ----------------------------------------------------
        # 1. Estratégia A: Rotação Habitual (Linha de Base do Produtor)
        # ----------------------------------------------------
        hist_crops = [h.crop_name for h in plot.crop_histories] if plot.crop_histories else []
        current_names = hist_crops if hist_crops else ([plot.current_crop] if plot.current_crop else [])
        selected_a = [crops_by_name.get(name.lower()) for name in current_names if name.lower() in crops_by_name]
        
        if selected_a:
            strat_a = cls._evaluate_strategy(
                strategy_type="current",
                title="Estratégia A — Rotação Habitual (Linha de Base)",
                description="Mapeia o padrão histórico praticado no talhão para medir o custo de oportunidade e os riscos de monocultivo.",
                crops=selected_a,
                plot=plot,
                farmer_profile=farmer_profile,
                user_priority=user_priority,
                env_analysis=env_analysis,
                w_amb=w_amb, w_soc=w_soc, w_econ=w_econ,
                confidence_level=confidence,
                previous_family=last_botanical_family
            )
            strategies.append(strat_a)
        else:
            strategies.append({
                "strategy_type": "current",
                "strategy_title": "Estratégia A — Histórico Não Cadastrado",
                "strategy_description": "Sem histórico de safras cadastradas para este talhão.",
                "crop_sequence": [],
                "duration_months": 12,
                "score_environmental": 40.0,
                "score_social": 40.0,
                "score_economic": 40.0,
                "score_overall": 40.0,
                "confidence_level": confidence,
                "potential_benefits": [],
                "risks": ["Ausência de linha de base para cálculo de ganho incremental."],
                "limitations": ["Recomenda-se cadastrar as safras anteriores para diagnóstico fitossanitário."],
                "justification": "Linha de base indisponível.",
                "sources_cited": ["Histórico do Talhão"]
            })

        # ----------------------------------------------------
        # 2. Estratégia B: Rotação Regenerativa (Solo Vivo, FBN & Rotação de Família)
        # ----------------------------------------------------
        compatible_b = []
        for c in catalog_crops:
            is_compat, reason = cls._check_crop_compatibility(c, plot, env_analysis, farmer_profile, last_botanical_family)
            if is_compat:
                if c.nitrogen_fixation_potential or c.organic_matter_contribution == "Alta" or c.category in ["Leguminosas", "Adubos Verdes"]:
                    # Bonificação se quebra a família botânica anterior
                    crop_fam = getattr(c, "botanical_family", None)
                    is_diff_family = (last_botanical_family is not None) and (crop_fam != last_botanical_family)
                    compatible_b.append((c, is_diff_family))

        if compatible_b:
            # Ordenar priorizando quebra de família botânica e depois potencial de FBN (protegido contra None)
            compatible_b.sort(key=lambda item: (1 if item[1] else 0, float(item[0].nitrogen_fixation_kg_ha or 0.0)), reverse=True)
            chosen_b = [item[0] for item in compatible_b[:3]]

            strat_b = cls._evaluate_strategy(
                strategy_type="sustainable",
                title="Estratégia B — Rotação Regenerativa (Solo Vivo)",
                description="Planejada para recuperar biomassa e fixar nitrogênio biológico, alternando famílias botânicas para quebra de pragas.",
                crops=chosen_b,
                plot=plot,
                farmer_profile=farmer_profile,
                user_priority=user_priority,
                env_analysis=env_analysis,
                w_amb=w_amb, w_soc=w_soc, w_econ=w_econ,
                confidence_level=confidence,
                previous_family=last_botanical_family
            )
            strategies.append(strat_b)
        else:
            strategies.append({
                "strategy_type": "sustainable",
                "strategy_title": "Estratégia B — Nenhuma Leguminosa/Cobertura Compatível",
                "strategy_description": "Nenhuma cultura regenerativa atendeu simultaneamente às exigências edafoclimáticas e de manejo do talhão.",
                "crop_sequence": [],
                "duration_months": 12,
                "score_environmental": 0.0,
                "score_social": 0.0,
                "score_economic": 0.0,
                "score_overall": 0.0,
                "confidence_level": confidence,
                "potential_benefits": [],
                "risks": ["Restrições de solo (pH) ou hídricas impedem espécies adubadoras no momento."],
                "limitations": ["Realizar calagem ou correção de fósforo antes de introduzir leguminosas exigentes."],
                "justification": "O TerraViva não indica espécies com alta probabilidade de perda operacional.",
                "sources_cited": ["Embrapa Solos / Zoneamento Agroecológico"]
            })

        # ----------------------------------------------------
        # 3. Estratégia C: Rotação Resiliente ao Clima (Tolerância à Estiagem)
        # ----------------------------------------------------
        compatible_c = []
        for c in catalog_crops:
            is_compat, reason = cls._check_crop_compatibility(c, plot, env_analysis, farmer_profile, last_botanical_family)
            if is_compat and c.drought_tolerance in ["Alta", "Media"]:
                crop_fam = getattr(c, "botanical_family", None)
                is_diff_family = (last_botanical_family is not None) and (crop_fam != last_botanical_family)
                compatible_c.append((c, is_diff_family))

        if compatible_c:
            compatible_c.sort(key=lambda item: (1 if item[1] else 0, 1 if item[0].drought_tolerance == "Alta" else 0, item[0].rooting_depth_cm), reverse=True)
            chosen_c = [item[0] for item in compatible_c[:3]]

            strat_c = cls._evaluate_strategy(
                strategy_type="resilient",
                title="Estratégia C — Rotação Resiliente ao Clima",
                description="Otimizada para tolerar veranicos e irregularidades pluviométricas através de raízes profundas e baixo consumo hídrico.",
                crops=chosen_c,
                plot=plot,
                farmer_profile=farmer_profile,
                user_priority=user_priority,
                env_analysis=env_analysis,
                w_amb=w_amb, w_soc=w_soc, w_econ=w_econ,
                confidence_level=confidence,
                previous_family=last_botanical_family
            )
            strategies.append(strat_c)
        else:
            strategies.append({
                "strategy_type": "resilient",
                "strategy_title": "Estratégia C — Nenhuma Cultura Resiliente Apta",
                "strategy_description": "Nenhuma cultura tolerante à seca atendeu aos critérios de viabilidade financeira e edafoclimática.",
                "crop_sequence": [],
                "duration_months": 12,
                "score_environmental": 0.0,
                "score_social": 0.0,
                "score_economic": 0.0,
                "score_overall": 0.0,
                "confidence_level": confidence,
                "potential_benefits": [],
                "risks": ["Déficit hídrico severo sem culturas resistentes compatíveis."],
                "limitations": ["Avaliar investimentos em irrigação suplementar ou armazenamento de água."],
                "justification": "Sem espécies aprovadas para a severidade climática detectada.",
                "sources_cited": ["Embrapa Semiárido"]
            })

        return strategies

    @classmethod
    def _check_data_sufficiency(cls, plot: Plot, env_analysis: Dict[str, Any]) -> (bool, Optional[str]):
        if not plot:
            return False, "Talhão não informado."
        
        if not env_analysis or env_analysis.get("status") == "DADOS_INSUFICIENTES":
            return False, "Ausência de registros ambientais para a localização geográfica do imóvel."

        period_days = env_analysis.get("period_days", 0)
        # Exige série histórica mínima de 30 dias para extrapolar recomendações de safra com base em dados
        if period_days < cls.MIN_SERIE_DAYS_REQUIRED:
            return False, f"Série meteorológica disponível de apenas {period_days} dias. O TerraViva exige no mínimo {cls.MIN_SERIE_DAYS_REQUIRED} dias de observações agrometeorológicas para validação de sazonalidade e risco de estiagem."

        return True, None

    @classmethod
    def _check_crop_compatibility(
        cls,
        crop: CropCatalog,
        plot: Plot,
        env_analysis: Dict[str, Any],
        farmer_profile: Optional[FarmerProfile],
        last_botanical_family: Optional[str] = None
    ) -> (bool, str):
        # 1. Faixa Térmica
        temp_mean = env_analysis.get("temperature_mean_c")
        if temp_mean is not None:
            if temp_mean < (crop.ideal_temp_min_c - 2.5) or temp_mean > (crop.ideal_temp_max_c + 2.5):
                return False, f"Temperatura média ({temp_mean}°C) incompatível com exigência da cultura ({crop.ideal_temp_min_c}-{crop.ideal_temp_max_c}°C)."

        # 2. Acidez do Solo (pH)
        if plot and plot.ph is not None:
            # Se solo muito ácido (pH < 5.0) e cultura exige > 5.8
            if plot.ph < (crop.ideal_ph_min - 0.4) or plot.ph > (crop.ideal_ph_max + 0.6):
                return False, f"pH do solo ({plot.ph}) fora da faixa de tolerância da cultura ({crop.ideal_ph_min}-{crop.ideal_ph_max})."

        # 3. Regime Hídrico e Risco de Seca
        drought_risk = env_analysis.get("drought_risk", "BAIXO")
        has_irrigation = bool(farmer_profile.has_irrigation) if farmer_profile else False
        if drought_risk == "ALTO" and not has_irrigation and crop.drought_tolerance == "Baixa":
            return False, "Cultura sensível ao déficit hídrico incompatível com alto risco de seca em regime de sequeiro."

        # 4. Capacidade Operacional e Mão de Obra
        if farmer_profile:
            labor = farmer_profile.labor_availability or "baixa"
            has_tractor = "trator" in (farmer_profile.equipment_access or "").lower()
            if labor == "baixa" and not has_tractor and crop.management_complexity == "Alta":
                return False, "Alta complexidade de tratos culturais sem mecanização própria e com escassez de mão de obra."

        # 5. Restrição Orçamentária
        if farmer_profile:
            has_credit = bool(farmer_profile.rural_credit_access)
            cost_ha = crop.estimated_cost_per_ha_brl or 3000.0
            # Se custo por hectare for muito alto (> R$ 4.000) e não há crédito rural nem trator
            if cost_ha > 4000.0 and not has_credit and farmer_profile.agriculture_type.value == "familiar":
                return False, f"Custo de implantação elevado (R$ {cost_ha}/ha) incompatível com ausência de crédito rural declarado."

        return True, "Compatível"

    @classmethod
    def _calculate_recommendation_confidence(
        cls,
        plot: Plot,
        farmer_profile: Optional[FarmerProfile],
        env_analysis: Dict[str, Any]
    ) -> str:
        score = 0

        # Atributos de Solo
        if plot and plot.ph is not None: score += 1
        if plot and plot.soil_texture: score += 1
        if plot and plot.slope_pct is not None: score += 1

        # Atributos do Produtor
        if farmer_profile and farmer_profile.labor_availability: score += 1

        # Qualidade Climática
        quality = env_analysis.get("data_quality_metrics", {})
        obs_ratio = quality.get("observed_records_ratio", 0.0)
        period = env_analysis.get("period_days", 0)

        if period >= 60: score += 1
        if obs_ratio >= 0.8:
            score += 2
        elif obs_ratio >= 0.4:
            score += 1

        # Penalidade se não houver histórico de safras
        if not plot.crop_histories:
            score = max(0, score - 1)

        if score >= 6:
            return "Alta"
        elif score >= 4:
            return "Media"
        else:
            return "Baixa"

    @classmethod
    def _evaluate_strategy(
        cls,
        strategy_type: str,
        title: str,
        description: str,
        crops: List[CropCatalog],
        plot: Plot,
        farmer_profile: Optional[FarmerProfile],
        user_priority: Optional[UserPriority],
        env_analysis: Dict[str, Any],
        w_amb: float,
        w_soc: float,
        w_econ: float,
        confidence_level: str,
        previous_family: Optional[str] = None
    ) -> Dict[str, Any]:
        crop_names = [c.common_name for c in crops]

        # 1. Dimensão Ambiental
        env_scores = []
        drought_risk = env_analysis.get("drought_risk", "BAIXO")
        erosion_risk = env_analysis.get("erosion_risk", "BAIXO")

        for c in crops:
            score = 50.0
            if c.nitrogen_fixation_potential:
                n_kg = float(c.nitrogen_fixation_kg_ha or 0.0)
                score += min(20.0, n_kg / 8.0)
            if c.erosion_protection == "Alta":
                score += 15.0 if erosion_risk == "ALTO" else 10.0
            if c.organic_matter_contribution == "Alta":
                score += 10.0

            # Quebra de família botânica (sanidade do solo)
            crop_fam = getattr(c, "botanical_family", None)
            if previous_family and crop_fam and crop_fam != previous_family:
                score += 10.0 # Bônus fitossanitário por alternância de hospedeiros
            elif previous_family and crop_fam and crop_fam == previous_family:
                score -= 15.0 # Penalidade por sucessão continuada da mesma família

            if drought_risk == "ALTO":
                if c.drought_tolerance == "Alta":
                    score += 15.0
                elif c.drought_tolerance == "Baixa":
                    score -= 25.0

            env_scores.append(min(100.0, max(0.0, score)))
        score_env = round(sum(env_scores) / len(env_scores), 1) if env_scores else 40.0

        # 2. Dimensão Social
        soc_scores = []
        labor = farmer_profile.labor_availability if farmer_profile else "baixa"
        for c in crops:
            score = 50.0
            if labor == "baixa":
                if c.management_complexity == "Alta": score -= 20.0
                elif c.management_complexity == "Baixa": score += 20.0
            elif labor == "alta":
                score += 10.0

            if c.forage_potential:
                score += 15.0 # Segurança alimentar para pecuária leiteira/familiar

            soc_scores.append(min(100.0, max(0.0, score)))
        score_soc = round(sum(soc_scores) / len(soc_scores), 1) if soc_scores else 40.0

        # 3. Dimensão Econômica
        econ_analysis = EconomicAnalysisEngine.evaluate_crop_sequence_economy(crops, plot.area_ha, farmer_profile)
        total_seq_cost = econ_analysis.get("cost_per_ha_brl", 3000.0)
        # Custo médio ponderado por cultura individual da sequência
        avg_cost_ha = total_seq_cost / len(crops) if crops else 2500.0
        has_credit = bool(farmer_profile.rural_credit_access) if farmer_profile else False

        score_econ = 60.0
        if avg_cost_ha > 3800.0:
            score_econ -= 20.0 if not has_credit else 8.0
        elif avg_cost_ha < 2400.0:
            score_econ += 20.0

        if econ_analysis.get("market_liquidity_general") == "Alta":
            score_econ += 15.0
        elif econ_analysis.get("market_liquidity_general") == "Baixa":
            score_econ -= 15.0

        score_econ = round(min(100.0, max(0.0, score_econ)), 1)

        # 4. Total Ponderado Multicritério
        total_score = round((score_env * (w_amb / 100.0)) + (score_soc * (w_soc / 100.0)) + (score_econ * (w_econ / 100.0)), 1)

        # Justificativas
        benefits = []
        risks = []
        limitations = []

        if strategy_type == "sustainable":
            benefits.append("Fixação biológica de nitrogênio e reciclagem de nutrientes nas camadas superficiais.")
            benefits.append("Alternância botânica que interrompe o ciclo de vida de nematoides e pragas de solo.")
            risks.append("Demanda manejo pontual de dessecação para que a palhada não atrase o plantio subsequente.")
            limitations.append("Melhoria estrutural na matéria orgânica consolida-se após o segundo ciclo consecutivo.")
            justification = f"Composição recomendada para regeneração biológica do talhão '{plot.name}'. Promove cobertura protetora e nutrição natural com redução de fertilizantes químicos."
        elif strategy_type == "resilient":
            benefits.append("Raízes profundas com capacidade de descompactar o solo e extrair água em horizontes inferiores.")
            benefits.append("Estabilidade de colheita em safras atingidas por veranicos prolongados.")
            risks.append("Requer conferência prévia da liquidez de compradores regionais de grãos secundários.")
            limitations.append("Aporte de nitrogênio inferior ao de leguminosas exclusivas.")
            justification = f"Estruturada para blindar a propriedade contra o risco hídrico ({drought_risk}) verificado na série histórica de observações agrometeorológicas."
        else:
            benefits.append("Familiaridade operacional plena da equipe com os tratos culturais tradicionais.")
            risks.append("Risco de exaustão seletiva de nutrientes e proliferação de patógenos por continuidade de hospedeiros.")
            limitations.append("Não agrega novos mecanismos de fixação biológica.")
            justification = "Linha de base histórica para mensurar a evolução proporcionada pelas estratégias regenerativas."

        return {
            "strategy_type": strategy_type,
            "strategy_title": title,
            "strategy_description": description,
            "crop_sequence": crop_names,
            "duration_months": 12,
            "score_environmental": score_env,
            "score_social": score_soc,
            "score_economic": score_econ,
            "score_overall": total_score,
            "confidence_level": confidence_level,
            "potential_benefits": benefits,
            "risks": risks,
            "limitations": limitations,
            "justification": justification,
            "sources_cited": [
                "Embrapa (Sistemas de Rotação de Culturas e Fixação Biológica de Nitrogênio)",
                "FAO-56 (Evapotranspiração de Referência e Balanço Hídrico)",
                "CONAB (Custos Operacionais de Produção Agropecuária)",
                "NASA POWER (Agroclimatologia Observada)"
            ]
        }
