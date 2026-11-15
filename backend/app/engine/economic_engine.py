from typing import List, Dict, Any, Optional
from app.models.all_models import CropCatalog, FarmerProfile

class EconomicAnalysisEngine:
    """
    Motor de Análise Econômica do TerraViva.
    Calcula:
    - Custos estimados de implantação e manejo por hectare
    - Análise de liquidez de mercado e facilidade de comercialização
    - Necessidade de investimento inicial vs perfil financeiro
    - Comparativo de margem e retorno entre estratégias de rotação
    Princípio de confiabilidade: Não inventar cotações diárias ou prometer lucros milagrosos;
    apresentar estimativas médias documentadas (CONAB / Embrapa) e faixas de incerteza.
    """

    @classmethod
    def evaluate_crop_sequence_economy(
        cls,
        crops: List[CropCatalog],
        area_ha: float,
        farmer_profile: Optional[FarmerProfile]
    ) -> Dict[str, Any]:
        if not crops:
            return {
                "estimated_total_cost_brl": 0.0,
                "cost_per_ha_brl": 0.0,
                "market_risk": "Desconhecido",
                "notes": "Nenhuma cultura fornecida para análise."
            }

        total_cost_per_ha = 0.0
        crops_analysis = []
        liquidity_scores = []
        missing_cost_crops = []

        for crop in crops:
            cost_ha = crop.estimated_cost_per_ha_brl
            if cost_ha is None:
                missing_cost_crops.append(crop.common_name)
            else:
                total_cost_per_ha += cost_ha
            
            # Liquidez
            liq = crop.market_liquidity
            crops_analysis.append({
                "crop": crop.common_name,
                "cost_per_ha_brl": cost_ha,
                "market_liquidity": liq,
                "management_complexity": crop.management_complexity
            })
            
            if liq == "Alta":
                liquidity_scores.append(3)
            elif liq == "Media":
                liquidity_scores.append(2)
            elif liq == "Baixa":
                liquidity_scores.append(1)

        total_cost = total_cost_per_ha * area_ha
        avg_liquidity = sum(liquidity_scores) / len(liquidity_scores) if liquidity_scores else None

        # Avaliar compatibilidade financeira com o agricultor
        has_credit = bool(farmer_profile.rural_credit_access) if farmer_profile else False
        financial_compatibility = "Indeterminada" if missing_cost_crops else "Alta"
        if missing_cost_crops:
            financial_compatibility += " (custo não cadastrado para: " + ", ".join(missing_cost_crops) + ")"
        elif total_cost_per_ha > 4500.0 and not has_credit:
            financial_compatibility = "Baixa (Exige alto desembolso por hectare sem acesso a crédito rural cadastrado)"
        elif total_cost_per_ha > 3000.0:
            financial_compatibility = "Moderada"

        return {
            "area_ha": area_ha,
            "cost_per_ha_brl": None if missing_cost_crops else round(total_cost_per_ha, 2),
            "estimated_total_investment_brl": None if missing_cost_crops else round(total_cost, 2),
            "financial_compatibility": financial_compatibility,
            "market_liquidity_general": (
                "Indeterminada" if avg_liquidity is None
                else "Alta" if avg_liquidity >= 2.5
                else "Media" if avg_liquidity >= 1.8
                else "Baixa"
            ),
            "crops_breakdown": crops_analysis,
            "sources": ["CONAB (Custos de Produção Agrícola)", "Embrapa Informação Tecnológica"],
            "uncertainty_note": (
                "Custo não estimado: ausência de valores cadastrados para " + ", ".join(missing_cost_crops) + "."
                if missing_cost_crops
                else "Valores médios referenciais. Custos reais oscilam com fretes e preços locais de insumos."
            )
        }
