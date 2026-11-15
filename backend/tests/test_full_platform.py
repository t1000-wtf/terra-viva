import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.models.all_models import *
from app.seeds.seed_data import seed_database

# Banco de testes em memória persistente na mesma conexão usando StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

# Criar tabelas
Base.metadata.create_all(bind=engine_test)

# Povoar banco de teste
with TestingSessionLocal() as s:
    seed_database(s)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="session")
def auth_headers():
    return {}

def test_root_and_sources():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"
    assert client.get("/health").json() == {"status": "healthy"}
    openapi = client.get("/api/v1/openapi.json")
    assert openapi.status_code == 200
    expected_routes = {
        "/api/v1/properties",
        "/api/v1/properties/{property_id}/plots",
        "/api/v1/plots/{plot_id}/history",
        "/api/v1/environmental/sync/{property_id}",
        "/api/v1/social/diagnostics/{property_id}",
        "/api/v1/economic/estimate",
        "/api/v1/recommendations/generate/{plot_id}",
        "/api/v1/diagnostics/property/{property_id}",
        "/api/v1/assistant/chat",
        "/api/v1/assistant/history",
        "/api/v1/dashboard/summary/{property_id}"
    }
    assert expected_routes.issubset(openapi.json()["paths"])
    assert not any("security" in operation for path in openapi.json()["paths"].values() for operation in path.values())
    assert "/api/v1/auth/login" not in openapi.json()["paths"]

    # Listar fontes científicas
    sources_res = client.get("/api/v1/sources")
    assert sources_res.status_code == 200
    sources = sources_res.json()
    assert len(sources) >= 5
    assert any("NASA" in s["name"] for s in sources)
    assert any("Embrapa" in s["name"] for s in sources)

def test_test_database_connection_and_seeded_catalog():
    with TestingSessionLocal() as db:
        assert db.execute(text("SELECT 1")).scalar_one() == 1
        assert db.query(CropCatalog).count() >= 8

def test_authentication_routes_are_disabled():
    assert client.post("/api/v1/auth/register", json={}).status_code == 404
    assert client.post("/api/v1/auth/login", json={}).status_code == 404
    assert client.get("/api/v1/auth/me").status_code == 404
    assert client.get("/api/v1/users/profile").status_code == 404


def test_crop_catalog():
    res = client.get("/api/v1/crops")
    assert res.status_code == 200
    crops = res.json()
    assert len(crops) >= 8
    names = [c["common_name"] for c in crops]
    assert "Soja" in names
    assert "Milho" in names
    assert "Sorgo" in names
    assert "Crotalária" in names


def test_property_and_plots_flow(auth_headers):
    # 1. Cadastrar Propriedade
    prop_res = client.post("/api/v1/properties", headers=auth_headers, json={
        "name": "Sítio Terra Prometida",
        "description": "Propriedade familiar agroecológica",
        "total_area_ha": 25.0,
        "cultivated_area_ha": 18.0,
        "state": "MG",
        "municipality": "Montes Claros",
        "latitude": -16.7282,
        "longitude": -43.8617
    })
    assert prop_res.status_code == 201
    prop = prop_res.json()
    prop_id = prop["id"]

    # 2. Criar Talhão
    plot_res = client.post(f"/api/v1/properties/{prop_id}/plots", headers=auth_headers, json={
        "name": "Talhão Baixada do Riacho",
        "area_ha": 8.5,
        "soil_type": "Latossolo Vermelho",
        "soil_texture": "media",
        "current_crop": "Milho",
        "slope_pct": 5.0
    })
    assert plot_res.status_code == 201
    plot = plot_res.json()
    plot_id = plot["id"]

    # 3. Sincronizar dados ambientais com NASA POWER / SMAP
    sync_res = client.post(f"/api/v1/environmental/sync/{prop_id}?days=30", headers=auth_headers)
    assert sync_res.status_code == 200

    # 4. Obter séries temporais ambientais
    ts_res = client.get(f"/api/v1/environmental/timeseries/{prop_id}?days=30", headers=auth_headers)
    assert ts_res.status_code == 200
    assert len(ts_res.json()["timeline"]) > 0

    # 5. Gerar Recomendações Multicritério (Estratégias A, B e C)
    recs_res = client.post(f"/api/v1/recommendations/generate/{plot_id}", headers=auth_headers)
    assert recs_res.status_code == 200
    recs = recs_res.json()
    strat_types = [r["strategy_type"] for r in recs]
    if len(recs) == 1:
        assert strat_types == ["insufficient_data"]
        assert "Dados Insuficientes" in recs[0]["strategy_title"]
    else:
        assert set(strat_types) == {"current", "sustainable", "resilient"}

    # Cada recomendação possui pontuações transparentes
    for r in recs:
        assert 0 <= r["score_environmental"] <= 100
        assert 0 <= r["score_social"] <= 100
        assert 0 <= r["score_economic"] <= 100
        assert 0 <= r["score_overall"] <= 100
        if r["strategy_type"] != "insufficient_data":
            assert len(r["potential_benefits"]) > 0
        assert len(r["risks"]) > 0
        assert len(r["sources_cited"]) > 0

    # 6. Consultar Diagnóstico Holístico da Propriedade
    diag_res = client.get(f"/api/v1/diagnostics/property/{prop_id}", headers=auth_headers)
    assert diag_res.status_code == 200
    diag = diag_res.json()
    assert "land_needs" in diag
    assert "farmer_needs" in diag
    assert "region_offers" in diag

    # 7. Validar indicadores sociais e econômicos
    social_res = client.get(f"/api/v1/social/diagnostics/{prop_id}", headers=auth_headers)
    assert social_res.status_code == 200
    assert social_res.json()["social_analysis"]

    economic_res = client.get(
        "/api/v1/economic/estimate",
        params={"crop_names": "Milho,Sorgo", "area_ha": 8.5},
        headers=auth_headers
    )
    assert economic_res.status_code == 200
    economics = economic_res.json()
    assert len(economics["crops_breakdown"]) == 2
    assert economics["cost_per_ha_brl"] is not None

    history_res = client.post(
        f"/api/v1/plots/{plot_id}/history",
        headers=auth_headers,
        json={
            "crop_name": "Milho",
            "planting_date": "2024-10-01T00:00:00",
            "harvest_date": "2025-02-01T00:00:00",
            "season_name": "Safra 2024/2025",
            "productivity_kg_ha": 5000.0
        }
    )
    assert history_res.status_code == 201
    saved_history = client.get(f"/api/v1/plots/{plot_id}/history", headers=auth_headers)
    assert saved_history.status_code == 200
    assert len(saved_history.json()) == 1
    assert saved_history.json()[0]["crop_name"] == "Milho"

    # 8. Conversar com o assistente determinístico
    chat_res = client.post("/api/v1/assistant/chat", headers=auth_headers, json={
        "property_id": prop_id,
        "message": "Por que a rotação com sorgo e crotalária foi recomendada para a minha terra?"
    })
    assert chat_res.status_code == 200
    assert "reply" in chat_res.json()
    assert len(chat_res.json()["reply"]) > 50
    assistant_history = client.get(
        "/api/v1/assistant/history",
        headers=auth_headers,
        params={"property_id": prop_id}
    )
    assert assistant_history.status_code == 200
    assert [entry["role"] for entry in assistant_history.json()] == ["user", "assistant"]

    # 9. Dashboard Integrado
    dash_res = client.get(f"/api/v1/dashboard/summary/{prop_id}", headers=auth_headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["property"]["name"] == "Sítio Terra Prometida"
    assert len(dash["plots"]) == 1
    assert "environmental_kpis" in dash

    delete_res = client.delete(f"/api/v1/properties/{prop_id}", headers=auth_headers)
    assert delete_res.status_code == 204
    assert client.get(f"/api/v1/properties/{prop_id}", headers=auth_headers).status_code == 404
    assert client.get(
        "/api/v1/assistant/history",
        headers=auth_headers,
        params={"property_id": prop_id}
    ).json() == []
