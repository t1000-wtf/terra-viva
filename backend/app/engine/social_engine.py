from typing import Dict, Any, Optional
from app.models.all_models import FarmerProfile, SocialIndicatorRecord

class SocialAnalysisEngine:
    """
    Motor de Análise Social do TerraViva.
    Avalia a realidade do agricultor (familiar vs empresarial, disponibilidade de mão de obra,
    acesso a equipamentos, crédito e assistência técnica) cruzando com o contexto socioeconômico regional.
    Princípio ético fundamental: Jamais discriminar ou classificar agricultores como melhores ou piores;
    apenas identificar barreiras, potencialidades e suporte necessário.
    """

    @classmethod
    def analyze_social_context(
        cls,
        farmer_profile: Optional[FarmerProfile],
        regional_social: Optional[SocialIndicatorRecord]
    ) -> Dict[str, Any]:
        # 1. Perfil do Agricultor (Dados Declarados Voluntariamente)
        if farmer_profile:
            is_family_farm = farmer_profile.agriculture_type.value == "familiar"
            labor = farmer_profile.labor_availability or "baixa"
            has_tractor = "trator" in (farmer_profile.equipment_access or "").lower()
            has_assist = bool(farmer_profile.technical_assistance)
            has_credit = bool(farmer_profile.rural_credit_access)
            has_irrigation = bool(farmer_profile.has_irrigation)
        else:
            # Padrão conservador (Agricultura familiar de pequena escala)
            is_family_farm = True
            labor = "baixa"
            has_tractor = False
            has_assist = False
            has_credit = False
            has_irrigation = False

        # 2. Diagnóstico de Adequabilidade Social para Práticas Agrícolas
        needs = []
        opportunities = []
        constraints = []

        if is_family_farm:
            opportunities.append("Grande vocação para cultivos diversificados, consórcios e culturas de subsistência e alto valor nutricional.")
            if labor == "baixa":
                constraints.append("Restrição severa de mão de obra disponível. Priorizar culturas rústicas ou de baixo índice de intervenção manual.")
                needs.append("Estratégias agrícolas com baixa exigência de capina manual frequente e colheita escalonada.")
        else:
            opportunities.append("Estrutura operacional adequada para rotações em larga escala e mecanização integral.")

        if not has_assist:
            constraints.append("Falta de assistência técnica agronômica presencial contínua.")
            needs.append("Recomendações com protocolos agronômicos simples, robustos e comprovados pela Embrapa.")

        if not has_credit:
            constraints.append("Acesso limitado a linhas de crédito ou financiamento bancário imediato.")
            needs.append("Estratégias com baixo custo de aquisição de sementes e insumos externos.")

        if not has_irrigation:
            needs.append("Dependência exclusiva do regime pluviométrico (sequeiro). Indispensável sincronizar plantio com janela de chuvas.")

        # 3. Contexto Municipal (Dados Públicos IBGE / Atlas Brasil)
        municipality_summary = {}
        if regional_social:
            municipality_summary = {
                "municipality": regional_social.municipality_name,
                "state": regional_social.state,
                "idhm": regional_social.idhm,
                "rural_population_pct": regional_social.population_rural_pct,
                "agricultural_gdp_dependency_pct": regional_social.agricultural_gdp_dependency_pct,
                "rural_water_access_pct": regional_social.rural_piped_water_access_pct,
                "source": regional_social.source_name
            }

        if regional_social:
            confidence_level = "Alta (Perfil declarado pelo usuário + referência regional disponível)"
        elif farmer_profile:
            confidence_level = "Moderada (Perfil declarado; dados regionais indisponíveis)"
        else:
            confidence_level = "Baixa (Perfil do agricultor e dados regionais indisponíveis)"

        return {
            "agriculture_type": "Familiar" if is_family_farm else "Empresarial/Mista",
            "labor_availability": labor,
            "has_technical_assistance": has_assist,
            "has_rural_credit": has_credit,
            "has_irrigation": has_irrigation,
            "opportunities": opportunities,
            "constraints": constraints,
            "farmer_needs": needs,
            "regional_context": municipality_summary,
            "confidence_level": confidence_level
        }
