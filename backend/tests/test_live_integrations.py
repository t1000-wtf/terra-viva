import pytest
import os
import httpx
from datetime import datetime, timezone
from app.adapters.nasa_power import NasaPowerAdapter
from app.adapters.remote_sensing import RemoteSensingAdapter
from app.adapters.ibge_adapter import IbgeAdapter

# Marcador pytest para testes ao vivo de integração
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_LIVE_API_TESTS", "true").lower() != "true",
    reason="Testes de integração real habilitados via RUN_LIVE_API_TESTS=true"
)

@pytest.mark.asyncio
async def test_live_nasa_power_point_api():
    """
    Teste de integração real com a API oficial NASA POWER.
    Consulta coordenadas reais em Brasília/DF para 3 dias de janeiro de 2025.
    Valida: HTTP 200, extração de T2M e PRECTOTCORR reais, unidades e status OBSERVED.
    """
    start = datetime(2025, 1, 1)
    end = datetime(2025, 1, 3)
    lat, lon = -15.7801, -47.9292

    records = await NasaPowerAdapter.fetch_climate_data(
        latitude=lat,
        longitude=lon,
        start_date=start,
        end_date=end,
        timeout=15.0
    )

    assert len(records) == 3
    for r in records:
        assert r["data_status"] == "OBSERVED"
        assert r["source_name"] == "NASA POWER"
        assert r["temperature_mean_c"] is not None
        assert 10.0 <= r["temperature_mean_c"] <= 45.0
        assert r["precipitation_mm"] is not None
        assert r["precipitation_mm"] >= 0.0

@pytest.mark.asyncio
async def test_live_open_elevation_srtm_grid():
    """
    Teste de integração real com Open-Elevation (SRTM 30m).
    Consulta elevação e declividade por grade 3x3 na região do Planalto Central.
    """
    lat, lon = -15.7801, -47.9292
    topo = await RemoteSensingAdapter.get_srtm_topography(lat, lon)

    assert topo["data_status"] == "OBSERVED"
    assert topo["source_name"] == "NASA SRTM via Open-Elevation API"
    assert topo["elevation_m"] is not None
    # Brasília possui elevação entre 1000m e 1200m
    assert 900.0 <= topo["elevation_m"] <= 1300.0
    # Declividade calculada pela fórmula de Horn
    if topo["slope_deg"] is not None:
        assert 0.0 <= topo["slope_deg"] <= 60.0

@pytest.mark.asyncio
async def test_live_ibge_localidades_api():
    """
    Teste de integração real com a API de Localidades do IBGE.
    Valida resolução oficial do município de Montes Claros/MG e código IBGE de 7 dígitos.
    """
    info = await IbgeAdapter.get_municipality_info("Montes Claros", "MG")
    assert info is not None
    assert info["ibge_code"] == "3143302"
    assert info["name"] == "Montes Claros"
    assert info["uf"] == "MG"
