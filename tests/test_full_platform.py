import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
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
    # Registrar usuário de teste
    res = client.post("/api/v1/auth/register", json={
        "name": "Agricultor João da Silva",
        "email": "joao.silva@agriculturafamiliar.org",
        "password": "SenhaSegura123!",
        "role": "agricultor"
    })
    assert res.status_code in [201, 400]
    
    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "joao.silva@agriculturafamiliar.org",
        "password": "SenhaSegura123!"
    })
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_root_and_sources():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    # Listar fontes científicas
    sources_res = client.get("/api/v1/sources")
    assert sources_res.status_code == 200
    sources = sources_res.json()
    assert len(sources) >= 5
    assert any("NASA" in s["name"] for s in sources)
    assert any("Embrapa" in s["name"] for s in sources)

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

def test_farmer_profile_and_priorities(auth_headers):
    # Obter perfil
    res = client.get("/api/v1/users/farmer-profile", headers=auth_headers)
    assert res.status_code == 200
    
    # Atualizar prioridades multicritério
    prio_res = client.put("/api/v1/priorities", headers=auth_headers, json={
        "weight_environmental": 45.0,
        "weight_social": 30.0,
        "weight_economic": 25.0,
        "priority_water_conservation": 5,
        "priority_soil_recovery": 5
    })
    assert prio_res.status_code == 200
    data = prio_res.json()
    assert data["weight_environmental"] == 45.0
    assert data["weight_social"] == 30.0
    assert data["weight_economic"] == 25.0

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
    assert len(recs) == 3
    strat_types = [r["strategy_type"] for r in recs]
    assert "current" in strat_types
    assert "sustainable" in strat_types
    assert "resilient" in strat_types

    # Cada recomendação possui pontuações transparentes
    for r in recs:
        assert 0 <= r["score_environmental"] <= 100
        assert 0 <= r["score_social"] <= 100
        assert 0 <= r["score_economic"] <= 100
        assert 0 <= r["score_overall"] <= 100
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

    # 7. Conversar com o Assistente de IA
    chat_res = client.post("/api/v1/assistant/chat", headers=auth_headers, json={
        "property_id": prop_id,
        "message": "Por que a rotação com sorgo e crotalária foi recomendada para a minha terra?"
    })
    assert chat_res.status_code == 200
    assert "reply" in chat_res.json()
    assert len(chat_res.json()["reply"]) > 50

    # 8. Dashboard Integrado
    dash_res = client.get(f"/api/v1/dashboard/summary/{prop_id}", headers=auth_headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["property"]["name"] == "Sítio Terra Prometida"
    assert len(dash["plots"]) == 1
    assert "environmental_kpis" in dash
