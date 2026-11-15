from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.all_models import CropCatalog, SocialIndicatorRecord

def seed_database(db: Session):
    # 1. Catálogo Agronômico de Culturas (Embrapa / MAPA)
    crops_data = [
        {
            "common_name": "Milho",
            "scientific_name": "Zea mays",
            "category": "Grãos / Cereais",
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
            "estimated_cost_per_ha_brl": 3800.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Milho e Sorgo"
        },
        {
            "common_name": "Soja",
            "scientific_name": "Glycine max",
            "category": "Leguminosas / Oleaginosas",
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
            "estimated_cost_per_ha_brl": 4200.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Soja"
        },
        {
            "common_name": "Feijão",
            "scientific_name": "Phaseolus vulgaris",
            "category": "Leguminosas / Alimentação Básica",
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
            "estimated_cost_per_ha_brl": 2900.0,
            "market_liquidity": "Alta",
            "management_complexity": "Media",
            "technical_source": "Embrapa Arroz e Feijão"
        },
        {
            "common_name": "Sorgo",
            "scientific_name": "Sorghum bicolor",
            "category": "Grãos / Forrageiras Resistentes",
            "cycle_days": 110,
            "water_requirement_mm": 380.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 140.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março", "Abril"],
            "estimated_cost_per_ha_brl": 2400.0,
            "market_liquidity": "Media",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Milho e Sorgo"
        },
        {
            "common_name": "Milheto",
            "scientific_name": "Pennisetum glaucum",
            "category": "Cobertura de Solo / Forrageira",
            "cycle_days": 80,
            "water_requirement_mm": 280.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 150.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março"],
            "estimated_cost_per_ha_brl": 1400.0,
            "market_liquidity": "Baixa",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Cerrados"
        },
        {
            "common_name": "Crotalária",
            "scientific_name": "Crotalaria spectabilis",
            "category": "Adubação Verde / Controle de Nematoide",
            "cycle_days": 100,
            "water_requirement_mm": 320.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": True,
            "nitrogen_fixation_kg_ha": 150.0,
            "rooting_depth_cm": 120.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": False,
            "planting_seasons": ["Fevereiro", "Março", "Novembro"],
            "estimated_cost_per_ha_brl": 1600.0,
            "market_liquidity": "Baixa",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Agrobiologia"
        },
        {
            "common_name": "Braquiária",
            "scientific_name": "Urochloa ruziziensis",
            "category": "Forrageira / Palhada para Plantio Direto",
            "cycle_days": 120,
            "water_requirement_mm": 400.0,
            "drought_tolerance": "Alta",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 180.0,
            "erosion_protection": "Alta",
            "organic_matter_contribution": "Alta",
            "forage_potential": True,
            "planting_seasons": ["Outubro", "Fevereiro", "Março"],
            "estimated_cost_per_ha_brl": 1200.0,
            "market_liquidity": "Media",
            "management_complexity": "Baixa",
            "technical_source": "Embrapa Gado de Corte"
        },
        {
            "common_name": "Girassol",
            "scientific_name": "Helianthus annuus",
            "category": "Oleaginosas / Safrinha",
            "cycle_days": 105,
            "water_requirement_mm": 420.0,
            "drought_tolerance": "Media",
            "heat_tolerance": "Alta",
            "nitrogen_fixation_potential": False,
            "nitrogen_fixation_kg_ha": 0.0,
            "rooting_depth_cm": 160.0,
            "erosion_protection": "Media",
            "organic_matter_contribution": "Media",
            "forage_potential": True,
            "planting_seasons": ["Fevereiro", "Março"],
            "estimated_cost_per_ha_brl": 2700.0,
            "market_liquidity": "Media",
            "management_complexity": "Media",
            "technical_source": "Embrapa Soja"
        }
    ]

    for c in crops_data:
        exists = db.query(CropCatalog).filter(CropCatalog.common_name == c["common_name"]).first()
        if not exists:
            crop = CropCatalog(**c)
            db.add(crop)

    # 2. Indicadores Sociais Municipais Referenciais (IBGE / Atlas Brasil)
    social_data = [
        {
            "municipality_ibge_code": "3550308",
            "municipality_name": "São Paulo",
            "state": "SP",
            "reference_year": 2022,
            "population_total": 11451245,
            "population_rural_pct": 1.2,
            "idhm": 0.805,
            "idhm_education": 0.725,
            "idhm_income": 0.843,
            "idhm_longevity": 0.855,
            "poverty_rate_pct": 12.5,
            "agricultural_gdp_dependency_pct": 0.1,
            "family_farms_count": 420,
            "commercial_farms_count": 80,
            "rural_piped_water_access_pct": 88.0,
            "rural_internet_access_pct": 92.0,
            "source_name": "IBGE Censo / Atlas Brasil 2022",
            "methodology": "Censo Demográfico e Contas Regionais"
        },
        {
            "municipality_ibge_code": "3143302",
            "municipality_name": "Montes Claros",
            "state": "MG",
            "reference_year": 2022,
            "population_total": 414249,
            "population_rural_pct": 8.5,
            "idhm": 0.770,
            "idhm_education": 0.710,
            "idhm_income": 0.740,
            "idhm_longevity": 0.865,
            "poverty_rate_pct": 24.2,
            "agricultural_gdp_dependency_pct": 3.8,
            "family_farms_count": 3100,
            "commercial_farms_count": 420,
            "rural_piped_water_access_pct": 52.0,
            "rural_internet_access_pct": 65.0,
            "source_name": "IBGE Censo Agro / Atlas Brasil",
            "methodology": "Censo Demográfico"
        },
        {
            "municipality_ibge_code": "2910800",
            "municipality_name": "Feira de Santana",
            "state": "BA",
            "reference_year": 2022,
            "population_total": 616272,
            "population_rural_pct": 7.8,
            "idhm": 0.712,
            "idhm_education": 0.635,
            "idhm_income": 0.698,
            "idhm_longevity": 0.815,
            "poverty_rate_pct": 31.0,
            "agricultural_gdp_dependency_pct": 2.1,
            "family_farms_count": 2850,
            "commercial_farms_count": 310,
            "rural_piped_water_access_pct": 48.0,
            "rural_internet_access_pct": 58.0,
            "source_name": "IBGE Censo Agro",
            "methodology": "Censo Demográfico"
        },
        {
            "municipality_ibge_code": "5107909",
            "municipality_name": "Sinop",
            "state": "MT",
            "reference_year": 2022,
            "population_total": 196095,
            "population_rural_pct": 4.1,
            "idhm": 0.754,
            "idhm_education": 0.680,
            "idhm_income": 0.795,
            "idhm_longevity": 0.820,
            "poverty_rate_pct": 14.5,
            "agricultural_gdp_dependency_pct": 18.5,
            "family_farms_count": 890,
            "commercial_farms_count": 1250,
            "rural_piped_water_access_pct": 74.0,
            "rural_internet_access_pct": 82.0,
            "source_name": "IBGE / Atlas Brasil",
            "methodology": "Censo Agropecuário"
        }
    ]

    for s in social_data:
        exists = db.query(SocialIndicatorRecord).filter(
            SocialIndicatorRecord.municipality_ibge_code == s["municipality_ibge_code"]
        ).first()
        if not exists:
            soc = SocialIndicatorRecord(**s)
            db.add(soc)

    db.commit()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_database(session)
    session.close()
    print("Banco de dados inicializado e povoado com sucesso com dados agronômicos e sociais oficiais!")
