import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from app.models.all_models import (
    Plot, FarmerProfile, UserPriority, CropCatalog, DataStatus,
    EnvironmentalRecord
)
from app.adapters.nasa_power import NasaPowerAdapter
from app.adapters.ibge_adapter import IbgeAdapter
from app.adapters.remote_sensing import RemoteSensingAdapter
from app.core.database import _normalize_database_url
from app.core.geoprocessing import GeoProcessingService
from app.core.security import get_password_hash, verify_password
from app.engine.environmental_engine import EnvironmentalAnalysisEngine
from app.engine.economic_engine import EconomicAnalysisEngine
from app.engine.recommendation_engine import RecommendationEngine
from fastapi import HTTPException

# -------------------------------------------------------------
# 1. NASA POWER: Erros, Timeouts e Sem Dados Artificiais
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_nasa_power_unavailable_when_api_fails():
    """Garante que a NASA POWER retorne UNAVAILABLE e NUNCA dados artificiais quando a API falhar."""
    start = datetime(2025, 1, 1)
    end = datetime(2025, 1, 3)

    # Simular falha de conexão HTTP
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
        records = await NasaPowerAdapter.fetch_climate_data(
            latitude=-16.7,
            longitude=-43.8,
            start_date=start,
            end_date=end,
            max_retries=1
        )
        assert len(records) == 3
        for r in records:
            assert r["data_status"] == "UNAVAILABLE"
            assert r["temperature_mean_c"] is None
            assert r["precipitation_mm"] is None
            assert "Connection refused" in r["processing_method"]

@pytest.mark.asyncio
async def test_nasa_power_handles_invalid_payload_without_synthesizing():
    """Valida se payload HTTP 200 porém sem parâmetros é tratado como UNAVAILABLE."""
    start = datetime(2025, 1, 1)
    end = datetime(2025, 1, 1)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"properties": {"parameter": {}}} # Vazio

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        records = await NasaPowerAdapter.fetch_climate_data(
            latitude=-16.7,
            longitude=-43.8,
            start_date=start,
            end_date=end,
            max_retries=1
        )
        assert len(records) == 1
        assert records[0]["data_status"] == "UNAVAILABLE"
        assert records[0]["temperature_mean_c"] is None

@pytest.mark.asyncio
async def test_nasa_power_requests_configured_daily_parameters_and_parses_observed_values():
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {
        "properties": {
            "parameter": {
                "T2M": {"20250101": 21.5},
                "T2M_MAX": {"20250101": 28.0},
                "T2M_MIN": {"20250101": 17.0},
                "PRECTOTCORR": {"20250101": 0.0},
                "ALLSKY_SFC_SW_DWN": {"20250101": 18.2},
                "RH2M": {"20250101": 65.0}
            }
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = response
        records = await NasaPowerAdapter.fetch_climate_data(
            latitude=-16.7,
            longitude=-43.8,
            start_date=datetime(2025, 1, 1),
            end_date=datetime(2025, 1, 1)
        )

    params = mock_get.await_args.kwargs["params"]
    assert params == {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M",
        "community": "AG",
        "longitude": "-43.8000",
        "latitude": "-16.7000",
        "start": "20250101",
        "end": "20250101",
        "format": "JSON"
    }
    assert len(records) == 1
    assert records[0]["data_status"] == "OBSERVED"
    assert records[0]["temperature_mean_c"] == 21.5
    assert records[0]["precipitation_mm"] == 0.0

@pytest.mark.asyncio
async def test_ibge_empty_and_unavailable_responses_do_not_invent_municipality_data():
    empty_response = MagicMock(status_code=200)
    empty_response.json.return_value = []
    unavailable_response = MagicMock(status_code=503)

    with patch("httpx.AsyncClient.get", side_effect=[empty_response, unavailable_response]):
        assert await IbgeAdapter.get_municipality_info("Cidade inexistente", "MG") is None
        assert await IbgeAdapter.get_municipality_info("Montes Claros", "MG") is None

    sidra_response = MagicMock(status_code=503)
    with patch("httpx.AsyncClient.get", return_value=sidra_response):
        indicators = await IbgeAdapter.fetch_municipal_indicators("1234567")
    assert indicators["ibge_code"] == "1234567"
    assert "estimated_population" not in indicators

def test_postgresql_urls_use_the_declared_psycopg_driver():
    assert _normalize_database_url("postgres://u:p@localhost/db") == "postgresql+psycopg://u:p@localhost/db"
    assert _normalize_database_url("postgresql://u:p@localhost/db") == "postgresql+psycopg://u:p@localhost/db"
    assert _normalize_database_url("sqlite:///./test.db") == "sqlite:///./test.db"

def test_missing_environmental_observations_do_not_create_indicators_or_recommendations():
    records = [
        EnvironmentalRecord(
            property_id=1,
            observation_date=datetime(2025, 1, day),
            source_name="NASA POWER",
            data_status=DataStatus.UNAVAILABLE,
            spatial_resolution="0.5 degrees",
            temporal_resolution="Daily"
        )
        for day in (1, 2, 3)
    ]
    analysis = EnvironmentalAnalysisEngine.analyze_environmental_conditions(records)
    assert analysis["drought_risk"] == "INDETERMINADO"
    assert analysis["precipitation_total_mm"] is None
    assert analysis["temperature_mean_c"] is None
    assert analysis["data_quality_metrics"]["observed_climate_records_count"] == 0

    plot = Plot(id=1, name="Talhão sem observações", area_ha=3.0, current_crop="Milho")
    crop = CropCatalog(
        id=1, common_name="Milho", scientific_name="Zea mays", category="Graos",
        cycle_days=120, water_requirement_mm=500.0, drought_tolerance="Media",
        heat_tolerance="Media", rooting_depth_cm=60.0, erosion_protection="Media",
        organic_matter_contribution="Media", estimated_cost_per_ha_brl=2500.0,
        ideal_temp_min_c=18.0, ideal_temp_max_c=32.0, ideal_ph_min=5.0, ideal_ph_max=7.0
    )
    strategies = RecommendationEngine.generate_strategies(
        plot=plot,
        farmer_profile=None,
        user_priority=None,
        env_analysis=analysis,
        catalog_crops=[crop]
    )
    assert len(strategies) == 1
    assert strategies[0]["strategy_type"] == "insufficient_data"

def test_unknown_crop_cost_and_market_liquidity_remain_indeterminate():
    crop = CropCatalog(
        id=1, common_name="Cultura sem referência", scientific_name="Crop sp.",
        category="Graos", cycle_days=100, water_requirement_mm=400.0,
        drought_tolerance="Media", heat_tolerance="Media", rooting_depth_cm=40.0,
        erosion_protection="Media", organic_matter_contribution="Media",
        estimated_cost_per_ha_brl=None, market_liquidity=None,
        ideal_temp_min_c=18.0, ideal_temp_max_c=32.0,
        ideal_ph_min=5.0, ideal_ph_max=7.0
    )
    economics = EconomicAnalysisEngine.evaluate_crop_sequence_economy(
        crops=[crop], area_ha=2.0, farmer_profile=None
    )
    assert economics["cost_per_ha_brl"] is None
    assert economics["estimated_total_investment_brl"] is None
    assert economics["market_liquidity_general"] == "Indeterminada"

    plot = Plot(id=1, name="Talhão histórico", area_ha=2.0, current_crop=crop.common_name)
    strategies = RecommendationEngine.generate_strategies(
        plot=plot,
        farmer_profile=None,
        user_priority=None,
        env_analysis={
            "period_days": 30,
            "temperature_mean_c": 25.0,
            "drought_risk": "BAIXO",
            "data_quality_metrics": {"observed_records_ratio": 1.0}
        },
        catalog_crops=[crop]
    )
    baseline = next(strategy for strategy in strategies if strategy["strategy_type"] == "current")
    assert baseline["crop_sequence"] == []
    assert "custo de referência cadastrado" in baseline["strategy_description"]

# -------------------------------------------------------------
# 2. NASA SMAP: Extração Real vs Granulado Não Extraído
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_smap_granule_found_but_extraction_unavailable():
    """Se granulado foi encontrado no catálogo CMR mas o serviço OPeNDAP falhou, retorna UNAVAILABLE."""
    date = datetime(2025, 1, 15)
    
    # Mock de resposta CMR com granulo
    cmr_mock = MagicMock()
    cmr_mock.status_code = 200
    cmr_mock.json.return_value = {
        "feed": {
            "entry": [{
                "title": "SMAP_L3_SM_P_20250115_R18290_001.h5",
                "links": [{"href": "https://opendap.earthdata.nasa.gov/smap_sample"}]
            }]
        }
    }

    # Falha no OPeNDAP
    with patch("app.core.config.settings.NASA_EARTHDATA_TOKEN", "valid-fake-token"), \
         patch("httpx.AsyncClient.get") as mock_get:
        # 1ª chamada (CMR): sucesso. 2ª chamada (OPeNDAP): erro 403
        mock_opendap_err = MagicMock()
        mock_opendap_err.status_code = 403
        mock_opendap_err.text = "Forbidden"
        mock_get.side_effect = [cmr_mock, mock_opendap_err]

        result = await RemoteSensingAdapter.get_smap_soil_moisture(-15.0, -47.0, date)
        # REGRA CRÍTICA: Não classificar como OBSERVED se não extraiu o valor
        assert result["data_status"] == "UNAVAILABLE"
        assert result["soil_moisture_m3_m3"] is None
        assert "pendente de serviço" in result["processing_method"] or "identificado" in result["quality"]

@pytest.mark.asyncio
async def test_smap_valid_extraction():
    """Valida retorno OBSERVED quando a extração real de pixel é parseada com sucesso."""
    date = datetime(2025, 1, 15)
    cmr_mock = MagicMock()
    cmr_mock.status_code = 200
    cmr_mock.json.return_value = {
        "feed": {
            "entry": [{
                "title": "SMAP_L3_SM_P_20250115_R18290_001.h5",
                "links": [{"href": "https://opendap.earthdata.nasa.gov/smap_sample"}]
            }]
        }
    }

    opendap_mock = MagicMock()
    opendap_mock.status_code = 200
    opendap_mock.text = "Soil_Moisture_Retrieval_Data_AM.soil_moisture\n[0][0], 0.284\n"

    with patch("app.core.config.settings.NASA_EARTHDATA_TOKEN", "valid-fake-token"), \
         patch("httpx.AsyncClient.get", side_effect=[cmr_mock, opendap_mock]):
        result = await RemoteSensingAdapter.get_smap_soil_moisture(-15.0, -47.0, date)
        assert result["data_status"] == "OBSERVED"
        assert result["soil_moisture_m3_m3"] == 0.284
        assert result["confidence_level"] == "Alta"

# -------------------------------------------------------------
# 3. Landsat/MODIS NDVI: Status Transparente
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_ndvi_status_when_no_token():
    """NDVI deve retornar UNAVAILABLE sem token."""
    with patch("app.core.config.settings.NASA_EARTHDATA_TOKEN", None):
        result = await RemoteSensingAdapter.get_landsat_modis_ndvi(-15.0, -47.0, datetime.now())
        assert result["data_status"] == "UNAVAILABLE"
        assert result["ndvi"] is None

# -------------------------------------------------------------
# 4. SRTM e Declividade Real por Vizinhança
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_srtm_elevation_and_slope_computation():
    """Calcula declividade a partir de grade 3x3 de vizinhança real."""
    # Simula resposta de 5 pontos da vizinhança com desnível
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "results": [
            {"elevation": 600.0}, # Centro
            {"elevation": 605.0}, # Norte
            {"elevation": 595.0}, # Sul
            {"elevation": 602.0}, # Leste
            {"elevation": 598.0}  # Oeste
        ]
    }
    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        topo = await RemoteSensingAdapter.get_srtm_topography(-16.0, -44.0)
        assert topo["data_status"] == "OBSERVED"
        assert topo["elevation_m"] == 600.0
        assert topo["slope_deg"] is not None
        assert topo["slope_deg"] > 0.0

@pytest.mark.asyncio
async def test_srtm_single_point_no_fake_slope():
    """Se a API retornar apenas o ponto central, não inventar declividade fixa."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "results": [{"elevation": 550.0}]
    }
    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        topo = await RemoteSensingAdapter.get_srtm_topography(-16.0, -44.0)
        assert topo["elevation_m"] == 550.0
        assert topo["slope_deg"] is None

# -------------------------------------------------------------
# 5. Geoprocessamento Geodésico Rigoroso (Polygon & MultiPolygon)
# -------------------------------------------------------------
def test_geodesic_polygon_and_multipolygon():
    """Testa cálculo geodésico exato em hectares e suporte a MultiPolygon."""
    # Polígono simples (~100m x 100m = ~1 ha) em Brasília
    poly = {
        "type": "Polygon",
        "coordinates": [
            [
                [-47.9000, -15.7900],
                [-47.8990, -15.7900],
                [-47.8990, -15.7910],
                [-47.9000, -15.7910],
                [-47.9000, -15.7900]
            ]
        ]
    }
    is_valid, err, metrics = GeoProcessingService.validate_and_compute_geojson(poly)
    assert is_valid is True
    assert 0.9 <= metrics["area_ha"] <= 1.5
    assert metrics["geom_type"] == "Polygon"

    # MultiPolygon válido
    multipoly = {
        "type": "MultiPolygon",
        "coordinates": [
            poly["coordinates"],
            [
                [
                    [-47.9100, -15.8000],
                    [-47.9090, -15.8000],
                    [-47.9090, -15.8010],
                    [-47.9100, -15.8010],
                    [-47.9100, -15.8000]
                ]
            ]
        ]
    }
    is_valid_mp, err_mp, metrics_mp = GeoProcessingService.validate_and_compute_geojson(multipoly)
    assert is_valid_mp is True
    assert metrics_mp["geom_type"] == "MultiPolygon"
    assert metrics_mp["polygons_count"] == 2
    assert metrics_mp["area_ha"] > metrics["area_ha"]

def test_geoprocessing_rejects_empty_and_out_of_bounds():
    """Rejeita polígonos com coordenadas fora do Brasil mesmo se apenas 1 vértice estiver fora."""
    # 3 vértices no Brasil e 1 no exterior
    invalid_poly = {
        "type": "Polygon",
        "coordinates": [
            [
                [-47.9000, -15.7900],
                [-47.8990, -15.7900],
                [10.0, 50.0], # Europa!
                [-47.9000, -15.7900]
            ]
        ]
    }
    is_valid, err, _ = GeoProcessingService.validate_and_compute_geojson(invalid_poly)
    assert is_valid is False
    assert "fora dos limites territoriais do Brasil" in err

    # Geometria vazia
    is_valid_empty, err_empty, _ = GeoProcessingService.validate_and_compute_geojson({"type": "Polygon", "coordinates": []})
    assert is_valid_empty is False
    assert "Geometria vazia" in err_empty

# -------------------------------------------------------------
# 6. Motor de Recomendação: Compatibilidade e Dados Insuficientes
# -------------------------------------------------------------
def test_recommendation_suspended_when_insufficient_data():
    """Garante suspensão ética da recomendação quando não há dados ambientais suficientes."""
    plot = Plot(id=1, name="Talhão Teste", area_ha=10.0, ph=6.0, soil_texture="argilosa")
    # Análise vazia / dias insuficientes
    env_insuf = {"status": "DADOS_INSUFICIENTES", "period_days": 2}
    
    crop = CropCatalog(
        id=1, common_name="Milho", scientific_name="Zea mays", category="Graos",
        cycle_days=120, water_requirement_mm=500.0, drought_tolerance="Media",
        heat_tolerance="Media", rooting_depth_cm=60.0, erosion_protection="Media",
        organic_matter_contribution="Media"
    )

    strategies = RecommendationEngine.generate_strategies(
        plot=plot,
        farmer_profile=None,
        user_priority=None,
        env_analysis=env_insuf,
        catalog_crops=[crop]
    )
    assert len(strategies) == 1
    assert strategies[0]["strategy_type"] == "insufficient_data"
    assert "Dados Insuficientes" in strategies[0]["strategy_title"]
    assert strategies[0]["score_overall"] == 0.0

def test_recommendation_rejects_incompatible_crops():
    """Garante que culturas com exigência térmica ou de solo incompatível sejam rejeitadas e não inseridas por fallback."""
    plot = Plot(id=1, name="Talhão Ácido", area_ha=10.0, ph=4.0, soil_texture="arenosa") # pH muito ácido
    env_analysis = {
        "period_days": 30,
        "temperature_mean_c": 38.0, # Muito quente
        "drought_risk": "ALTO",
        "data_quality_metrics": {"observed_records_ratio": 1.0}
    }
    # Cultura que exige frio e solo neutro
    crop_frio = CropCatalog(
        id=1, common_name="Trigo de Inverno", scientific_name="Triticum aestivum", category="Graos",
        cycle_days=130, water_requirement_mm=450.0, drought_tolerance="Baixa",
        heat_tolerance="Baixa", ideal_temp_min_c=10.0, ideal_temp_max_c=22.0,
        ideal_ph_min=6.0, ideal_ph_max=7.0, rooting_depth_cm=50.0,
        erosion_protection="Media", organic_matter_contribution="Media"
    )

    strategies = RecommendationEngine.generate_strategies(
        plot=plot,
        farmer_profile=None,
        user_priority=None,
        env_analysis=env_analysis,
        catalog_crops=[crop_frio]
    )
    # A estratégia regenerativa e resiliente não devem conter Trigo de Inverno
    strat_b = next(s for s in strategies if s["strategy_type"] == "sustainable")
    strat_c = next(s for s in strategies if s["strategy_type"] == "resilient")
    assert "Trigo de Inverno" not in strat_b["crop_sequence"]
    assert "Trigo de Inverno" not in strat_c["crop_sequence"]
    assert "Nenhuma" in strat_b["strategy_title"] or len(strat_b["crop_sequence"]) == 0
