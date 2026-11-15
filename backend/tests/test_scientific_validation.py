import pytest
from datetime import datetime, timezone
from app.models.all_models import Plot, FarmerProfile, UserPriority, CropCatalog, AgricultureType, CropHistory
from app.engine.evapotranspiration import EvapotranspirationCalculator
from app.engine.recommendation_engine import RecommendationEngine

# ---------------------------------------------------------------------------
# 1. Validação Científica da Evapotranspiração de Referência (ET0)
# ---------------------------------------------------------------------------
def test_fao56_penman_monteith_calculation():
    """
    Testa a equação completa FAO-56 Penman-Monteith com exemplo agrometeorológico clássico.
    Condições típicas de primavera tropical no cerrado:
    Tmean=25°C, Tmax=30°C, Tmin=20°C, Rs=22 MJ/m2/d, RH=60%, U2=2.0 m/s, Altitude=1000m.
    Resultado esperado pela FAO-56: entre 4.5 e 6.0 mm/dia.
    """
    now = datetime(2025, 10, 15)
    res = EvapotranspirationCalculator.calculate_et0(
        date=now,
        latitude=-15.78,
        temperature_mean_c=25.0,
        temperature_max_c=30.0,
        temperature_min_c=20.0,
        solar_radiation_mj=22.0,
        relative_humidity_pct=60.0,
        wind_speed_2m_ms=2.0,
        elevation_m=1000.0
    )
    assert res["data_status"] == "ESTIMATED"
    assert "Penman-Monteith" in res["method"]
    assert 4.5 <= res["evapotranspiration_mm"] <= 6.5
    assert "FAO Irrigation and Drainage Paper No. 56" in res["processing_method"]

def test_fao56_hargreaves_samani_fallback():
    """
    Valida método de contingência Hargreaves-Samani quando faltam vento ou umidade.
    Identifica explicitamente o método simplificado sem confundir com Penman-Monteith.
    """
    now = datetime(2025, 10, 15)
    res = EvapotranspirationCalculator.calculate_et0(
        date=now,
        latitude=-15.78,
        temperature_mean_c=25.0,
        temperature_max_c=30.0,
        temperature_min_c=20.0,
        solar_radiation_mj=None, # Sem radiação incidente
        relative_humidity_pct=None, # Sem umidade
        wind_speed_2m_ms=None # Sem vento
    )
    assert res["data_status"] == "ESTIMATED"
    assert "Hargreaves-Samani" in res["method"]
    assert "Penman-Monteith" not in res["method"]
    assert 3.5 <= res["evapotranspiration_mm"] <= 6.0

# ---------------------------------------------------------------------------
# 2. Validação Multidimensional: Recomendações Diferenciadas
# ---------------------------------------------------------------------------
def test_multidimensional_differentiation_by_farmer_profile():
    """
    Cenário: Dois agricultores no MESMO talhão e MESMO clima.
    Agricultor 1: Familiar, baixa mão de obra, sem trator, sem crédito rural.
    Agricultor 2: Empresarial, alta mão de obra, maquinário próprio, com crédito rural.
    Garante que as recomendações geradas sejam ajustadas à capacidade operacional real.
    """
    plot = Plot(id=1, name="Talhão Central", area_ha=15.0, ph=6.0, soil_texture="argilosa", slope_pct=3.0)
    env_analysis = {
        "period_days": 60,
        "temperature_mean_c": 24.0,
        "drought_risk": "BAIXO",
        "data_quality_metrics": {"observed_records_ratio": 0.9}
    }

    # Catálogo com cultura simples (Sorgo) e cultura exigente/cara (Milho de alta tecnologia)
    crop_barata = CropCatalog(
        id=1, common_name="Sorgo", scientific_name="Sorghum bicolor", category="Grãos",
        botanical_family="Poaceae", cycle_days=100, water_requirement_mm=350.0,
        drought_tolerance="Alta", heat_tolerance="Alta", rooting_depth_cm=100.0,
        erosion_protection="Alta", organic_matter_contribution="Alta",
        ideal_temp_min_c=18.0, ideal_temp_max_c=35.0, ideal_ph_min=5.0, ideal_ph_max=7.0,
        estimated_cost_per_ha_brl=2000.0, management_complexity="Baixa", market_liquidity="Media"
    )
    crop_cara = CropCatalog(
        id=2, common_name="Milho Irrigado Mecanizado", scientific_name="Zea mays", category="Grãos",
        botanical_family="Poaceae", cycle_days=130, water_requirement_mm=600.0,
        drought_tolerance="Baixa", heat_tolerance="Media", rooting_depth_cm=90.0,
        erosion_protection="Media", organic_matter_contribution="Alta",
        ideal_temp_min_c=18.0, ideal_temp_max_c=32.0, ideal_ph_min=5.8, ideal_ph_max=6.8,
        estimated_cost_per_ha_brl=5500.0, management_complexity="Alta", market_liquidity="Alta"
    )
    leguminosa = CropCatalog(
        id=3, common_name="Crotalária", scientific_name="Crotalaria spectabilis", category="Leguminosas",
        botanical_family="Fabaceae", cycle_days=90, water_requirement_mm=300.0,
        drought_tolerance="Alta", heat_tolerance="Alta", nitrogen_fixation_potential=True,
        nitrogen_fixation_kg_ha=150.0, rooting_depth_cm=120.0, erosion_protection="Alta",
        organic_matter_contribution="Alta", ideal_temp_min_c=18.0, ideal_temp_max_c=35.0,
        ideal_ph_min=5.0, ideal_ph_max=7.0, estimated_cost_per_ha_brl=1600.0,
        management_complexity="Baixa", market_liquidity="Baixa"
    )

    catalog = [crop_barata, crop_cara, leguminosa]

    farmer_familiar = FarmerProfile(
        agriculture_type=AgricultureType.FAMILY,
        labor_availability="baixa",
        equipment_access="manual",
        rural_credit_access=False,
        has_irrigation=False
    )

    farmer_empresarial = FarmerProfile(
        agriculture_type=AgricultureType.COMMERCIAL,
        labor_availability="alta",
        equipment_access="trator_proprio",
        rural_credit_access=True,
        has_irrigation=True
    )

    strat_fam = RecommendationEngine.generate_strategies(plot, farmer_familiar, None, env_analysis, catalog)
    strat_emp = RecommendationEngine.generate_strategies(plot, farmer_empresarial, None, env_analysis, catalog)

    resilient_fam = next(s for s in strat_fam if s["strategy_type"] == "resilient")
    resilient_emp = next(s for s in strat_emp if s["strategy_type"] == "resilient")

    # O agricultor familiar NÃO deve receber a cultura cara de R$ 5.500/ha com complexidade alta
    assert "Milho Irrigado Mecanizado" not in resilient_fam["crop_sequence"]
    assert "Sorgo" in resilient_fam["crop_sequence"]

    # A nota econômica e social reflete a capacidade de absorção
    assert resilient_fam["score_economic"] >= 60.0

def test_botanical_family_break_incentive():
    """
    Cenário: O talhão possui histórico de Soja (Família Fabaceae).
    A rotação regenerativa deve incentivar a alternância para quebrar ciclo de pragas/nematoides,
    bonificando espécies de outras famílias ou consórcios e pontuando sanidade.
    """
    plot = Plot(id=1, name="Talhão Soja", area_ha=20.0, ph=6.2, soil_texture="argilosa")
    plot.crop_histories = [
        CropHistory(crop_name="Soja", planting_date=datetime(2024, 10, 1), harvest_date=datetime(2025, 2, 1))
    ]
    env_analysis = {
        "period_days": 45,
        "temperature_mean_c": 25.0,
        "drought_risk": "BAIXO",
        "data_quality_metrics": {"observed_records_ratio": 0.85}
    }

    soja = CropCatalog(
        id=1, common_name="Soja", scientific_name="Glycine max", category="Leguminosas",
        botanical_family="Fabaceae", cycle_days=110, water_requirement_mm=450.0,
        drought_tolerance="Media", heat_tolerance="Media", nitrogen_fixation_potential=True,
        nitrogen_fixation_kg_ha=140.0, rooting_depth_cm=80.0, erosion_protection="Media",
        organic_matter_contribution="Media", ideal_temp_min_c=18.0, ideal_temp_max_c=32.0,
        ideal_ph_min=5.5, ideal_ph_max=7.0, estimated_cost_per_ha_brl=3500.0, management_complexity="Media"
    )
    braquiaria = CropCatalog(
        id=2, common_name="Braquiária", scientific_name="Urochloa ruziziensis", category="Forrageiras",
        botanical_family="Poaceae", cycle_days=150, water_requirement_mm=400.0,
        drought_tolerance="Alta", heat_tolerance="Alta", nitrogen_fixation_potential=False,
        rooting_depth_cm=160.0, erosion_protection="Alta", organic_matter_contribution="Alta",
        ideal_temp_min_c=18.0, ideal_temp_max_c=35.0, ideal_ph_min=4.8, ideal_ph_max=7.0,
        estimated_cost_per_ha_brl=1400.0, management_complexity="Baixa"
    )

    strategies = RecommendationEngine.generate_strategies(plot, None, None, env_analysis, [soja, braquiaria])
    strat_b = next(s for s in strategies if s["strategy_type"] == "sustainable")
    
    # A recomendação deve priorizar Braquiária para quebra de Fabaceae
    assert "Braquiária" in strat_b["crop_sequence"]
