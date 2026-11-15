from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.all_models import CropCatalog, SocialIndicatorRecord

def seed_database(db: Session):
    # 1. Catálogo Agronômico de Culturas (Embrapa / MAPA)
    # Com especificação de família botânica para quebra de ciclo de pragas
    crops_data = [
        {
            "common_name": "Milho",
            "scientific_name": "Zea mays",
            "category": "Grãos / Cereais",
            "botanical_family": "Poaceae",
            "cycle_days": 130,
            "water_requirement_mm": 550.0,
            "drought_tolerance": "Media",
            "heat_tolerance": "Media",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 100.0,
            "erosion_protection": "Media",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Outubro", "Novembro", "Dezembro", "Fevereiro"],
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 32.0,
            "ideal_ph_min": 5.5,
            "ideal_ph_max": 6.8,
            "estimated_cost_per_ha_brl": 3800.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Milho e Sorgo"
        },
        {
            "common_name": "Soja",
            "scientific_name": "Glycine max",
            "category": "Leguminosas / Oleaginosas",
            "botanical_family": "Fabaceae",
            "cycle_days": 115,
            "water_requirement_mm": 500.0,
            "drought_tolerance": "Media",
            "heat_tolerance": "Media",
            "nitrogen_fixation_potential": True,
            "nitrogen_fixation_kg_ha": 180.0,
            "rooting_depth_cm": 90.0,
            "erosion_protection": "Media",
            "organic_matter_contribution": "Media",
            "forage_potential": False,
            "planting_seasons": ["Outubro", "Novembro", "Dezembro"],
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 32.0,
            "ideal_ph_min": 5.8,
            "ideal_ph_max": 6.8,
            "estimated_cost_per_ha_brl": 4200.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Soja"
        },
        {
            "common_name": "Feijão",
            "scientific_name": "Phaseolus vulgaris",
            "category": "Leguminosas / Alimentação Básica",
            "botanical_family": "Fabaceae",
            "cycle_days": 85,
            "water_requirement_mm": 350.0,
            "drought_tolerance": "Baixa",
            "heat_tolerance": "Media",
            "nitrogen_fixation_potential": True,
            "nitrogen_fixation_kg_ha": 40.0,
            "rooting_depth_cm": 60.0,
            "erosion_protection": "Baixa",
            "organic_matter_contribution": "Baixa",
            "forage_potential": False,
            "planting_seasons": ["Outubro", "Fevereiro", "Maio"],
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 28.0,
            "ideal_ph_min": 5.5,
            "ideal_ph_max": 6.5,
            "estimated_cost_per_ha_brl": 2900.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Arroz e Feijão"
        },
        {
            "common_name": "Sorgo",
            "scientific_name": "Sorghum bicolor",
            "category": "Grãos / Forrageiras Resistentes",
            "botanical_family": "Poaceae",
            "cycle_days": 110,
            "water_requirement_mm": 380.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 120.0,
            "erosion_protection": "Media",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março", "Abril"],
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 35.0,
            "ideal_ph_min": 5.0,
            "ideal_ph_max": 7.0,
            "estimated_cost_per_ha_brl": 2400.0,
            "market_liquidity": "Media",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Milho e Sorgo"
        },
        {
            "common_name": "Crotalária",
            "scientific_name": "Crotalaria spectabilis",
            "category": "Adubos Verdes / Controle Nematológico",
            "botanical_family": "Fabaceae",
            "cycle_days": 90,
            "water_requirement_mm": 300.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": True,
            "nitrogen_fixation_kg_ha": 150.0,
            "rooting_depth_cm": 140.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": False,
            "planting_seasons": ["Outubro", "Novembro", "Fevereiro"],
            "ideal_temp_min_c": 20.0,
            "ideal_temp_max_c": 35.0,
            "ideal_ph_min": 5.0,
            "ideal_ph_max": 7.0,
            "estimated_cost_per_ha_brl": 1600.0,
            "market_liquidity": "Baixa",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Soja / Agência de Informação Embrapa"
        },
        {
            "common_name": "Braquiária",
            "scientific_name": "Urochloa ruziziensis",
            "category": "Forrageiras / Cobertura de Solo",
            "botanical_family": "Poaceae",
            "cycle_days": 180,
            "water_requirement_mm": 400.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 180.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Outubro", "Novembro", "Fevereiro", "Março"],
            "ideal_temp_min_c": 18.0,
            "ideal_temp_max_c": 35.0,
            "ideal_ph_min": 4.8,
            "ideal_ph_max": 7.0,
            "estimated_cost_per_ha_brl": 1400.0,
            "market_liquidity": "Media",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Gado de Corte"
        },
        {
            "common_name": "Girassol",
            "scientific_name": "Helianthus annuus",
            "category": "Oleaginosas / Safrinha",
            "botanical_family": "Asteraceae",
            "cycle_days": 110,
            "water_requirement_mm": 420.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Media",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 150.0,
            "erosion_protection": "Media",
            "organic_matter_contribution": "Media",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março"],
            "ideal_temp_min_c": 16.0,
            "ideal_temp_max_c": 30.0,
            "ideal_ph_min": 5.5,
            "ideal_ph_max": 7.2,
            "estimated_cost_per_ha_brl": 2700.0,
            "market_liquidity": "Media",
            "management_complexity": "Media",
            "technical_source": "Embrapa Soja"
        },
        {
            "common_name": "Milheto",
            "scientific_name": "Pennisetum glaucum",
            "category": "Grãos / Biomassa Resiliente",
            "botanical_family": "Poaceae",
            "cycle_days": 90,
            "water_requirement_mm": 250.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 140.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março", "Abril"],
            "ideal_temp_min_c": 22.0,
            "ideal_temp_max_c": 38.0,
            "ideal_ph_min": 4.8,
            "ideal_ph_max": 7.0,
            "estimated_cost_per_ha_brl": 1500.0,
            "market_liquidity": "Media",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Milho e Sorgo"
        }
    ]

    for item in crops_data:
        existing = db.query(CropCatalog).filter(CropCatalog.common_name == item["common_name"]).first()
        if not existing:
            c = CropCatalog(**item)
            db.add(c)
        else:
            for k, v in item.items():
                setattr(existing, k, v)

    # 2. Dados Socioeconômicos Municipais de Referência (IBGE / Atlas Brasil)
    social_data = [
        {
            "municipality_ibge_code": "3143302",
            "municipality_name": "Montes Claros",
            "state": "MG",
            "reference_year": 2022,
            "population_total": 414240,
            "population_rural_pct": 8.5,
            "idhm": 0.770,
            "idhm_education": 0.720,
            "idhm_income": 0.730,
            "idhm_longevity": 0.865,
            "poverty_rate_pct": 18.4,
            "agricultural_gdp_dependency_pct": 4.8,
            "family_farms_count": 4200,
            "commercial_farms_count": 850,
            "rural_piped_water_access_pct": 62.0,
            "rural_internet_access_pct": 58.0,
            "source_name": "IBGE Censo 2022 / Atlas Brasil",
            "methodology": "Pesquisa Censitária Oficial"
        },
        {
            "municipality_ibge_code": "5107909",
            "municipality_name": "Sinop",
            "state": "MT",
            "reference_year": 2022,
            "population_total": 196095,
            "population_rural_pct": 6.2,
            "idhm": 0.754,
            "idhm_education": 0.690,
            "idhm_income": 0.780,
            "idhm_longevity": 0.810,
            "poverty_rate_pct": 9.2,
            "agricultural_gdp_dependency_pct": 28.5,
            "family_farms_count": 1200,
            "commercial_farms_count": 3100,
            "rural_piped_water_access_pct": 74.0,
            "rural_internet_access_pct": 82.0,
            "source_name": "IBGE Censo 2022 / Atlas Brasil",
            "methodology": "Pesquisa Censitária Oficial"
        },
        {
            "municipality_ibge_code": "2903201",
            "municipality_name": "Barreiras",
            "state": "BA",
            "reference_year": 2022,
            "population_total": 159743,
            "population_rural_pct": 12.8,
            "idhm": 0.721,
            "idhm_education": 0.640,
            "idhm_income": 0.730,
            "idhm_longevity": 0.810,
            "poverty_rate_pct": 21.0,
            "agricultural_gdp_dependency_pct": 18.0,
            "family_farms_count": 3800,
            "commercial_farms_count": 1400,
            "rural_piped_water_access_pct": 58.0,
            "rural_internet_access_pct": 52.0,
            "source_name": "IBGE Censo 2022 / Atlas Brasil",
            "methodology": "Pesquisa Censitária Oficial"
        },
        {
            "municipality_ibge_code": "3543403",
            "municipality_name": "Ribeirão Preto",
            "state": "SP",
            "reference_year": 2022,
            "population_total": 698259,
            "population_rural_pct": 0.5,
            "idhm": 0.800,
            "idhm_education": 0.755,
            "idhm_income": 0.820,
            "idhm_longevity": 0.840,
            "poverty_rate_pct": 6.8,
            "agricultural_gdp_dependency_pct": 1.5,
            "family_farms_count": 450,
            "commercial_farms_count": 1200,
            "rural_piped_water_access_pct": 92.0,
            "rural_internet_access_pct": 90.0,
            "source_name": "IBGE Censo 2022 / Atlas Brasil",
            "methodology": "Pesquisa Censitária Oficial"
        }
    ]

    for item in social_data:
        existing = db.query(SocialIndicatorRecord).filter(
            SocialIndicatorRecord.municipality_ibge_code == item["municipality_ibge_code"]
        ).first()
        if not existing:
            s = SocialIndicatorRecord(**item)
            db.add(s)
        else:
            for k, v in item.items():
                setattr(existing, k, v)

    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
        print("Banco de dados populado com sucesso com dados da Embrapa e IBGE.")
    finally:
        db.close()
