from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/sources", tags=["Proveniência e Fontes Científicas"])

@router.get("", response_model=List[Dict[str, Any]])
def list_scientific_sources():
    """
    Relação transparente de todas as fontes científicas, espaciais e socioeconômicas integradas no TerraViva.
    """
    return [
        {
            "name": "NASA POWER (Prediction of Worldwide Energy Resources)",
            "organization": "NASA Langley Research Center",
            "type": "Meteorologia & Agroclimatologia",
            "parameters": "Temperatura (2m, Max, Min), Chuva, Radiação Solar, Umidade",
            "resolution": "0.5 x 0.5 graus (~50 km)",
            "coverage": "Global",
            "access_url": "https://power.larc.nasa.gov/",
            "status": "Online / API Integrada"
        },
        {
            "name": "NASA SMAP (Soil Moisture Active Passive)",
            "organization": "NASA Jet Propulsion Laboratory (JPL)",
            "type": "Umidade Superficial do Solo (0-5 cm)",
            "parameters": "Umidade volumétrica (m³/m³), Anomalias hídricas",
            "resolution": "9 km (EASE-Grid 2.0)",
            "coverage": "Global (revisita a cada 2-3 dias)",
            "access_url": "https://smap.jpl.nasa.gov/",
            "status": "Parcial / requer NASA_EARTHDATA_TOKEN e extração validada do pixel"
        },
        {
            "name": "Landsat 8/9 & MODIS (Terra/Aqua)",
            "organization": "NASA GSFC / USGS",
            "type": "Sensoriamento Remoto Óptico / Vegetação",
            "parameters": "NDVI (Índice de Vegetação da Diferença Normalizada), Cobertura do Solo",
            "resolution": "30 m (Landsat) / 250 m (MODIS)",
            "coverage": "Global",
            "access_url": "https://landsat.gsfc.nasa.gov/",
            "status": "Catálogo consultável; extração de pixel não configurada"
        },
        {
            "name": "NASA ECOSTRESS",
            "organization": "NASA JPL (ISS)",
            "type": "Evapotranspiração & Estresse Térmico",
            "parameters": "Evapotranspiração (PT-JPL), Temperatura da Superfície",
            "resolution": "70 m x 70 m",
            "coverage": "Global",
            "access_url": "https://ecostress.jpl.nasa.gov/",
            "status": "Não integrada; a ET0 atual é estimada pelo modelo FAO-56"
        },
        {
            "name": "NASA SRTM V3",
            "organization": "NASA / NGA",
            "type": "Topografia & Geomorfologia",
            "parameters": "Elevação (m), Declividade (%) para cálculo de risco de erosão",
            "resolution": "30 metros (1 arc-second)",
            "coverage": "Global",
            "access_url": "https://www2.jpl.nasa.gov/srtm/",
            "status": "Integrado via Open-Elevation; não usa Google Earth Engine"
        },
        {
            "name": "IBGE (Instituto Brasileiro de Geografia e Estatística)",
            "organization": "Ministério do Planejamento - Brasil",
            "type": "Dados Territoriais e Censo Agropecuário",
            "parameters": "População rural, IDHM, estabelecimentos familiares vs comerciais",
            "resolution": "Municipal (5.570 municípios)",
            "coverage": "Brasil",
            "access_url": "https://servicodados.ibge.gov.br/",
            "status": "API de localidades integrada; indicadores regionais usam base local de referência"
        },
        {
            "name": "Embrapa (Empresa Brasileira de Pesquisa Agropecuária)",
            "organization": "Ministério da Agricultura e Pecuária - Brasil",
            "type": "Conhecimento Agronômico & Sistemas de Rotação",
            "parameters": "Fixação Biológica de Nitrogênio, Manejo de Palhada, Tolerância à Seca",
            "resolution": "Normas e Guias Técnicos Nacionais",
            "coverage": "Biomas Brasileiros (Cerrado, Caatinga, Mata Atlântica, Pampas)",
            "access_url": "https://www.embrapa.br/",
            "status": "Ativo / Base Normativa"
        },
        {
            "name": "CONAB (Companhia Nacional de Abastecimento)",
            "organization": "Ministério do Desenvolvimento Agrário - Brasil",
            "type": "Economia e Custos Agrícolas",
            "parameters": "Matrizes de custo de produção por hectare e liquidez de grãos",
            "resolution": "Regional e Estadual",
            "coverage": "Brasil",
            "access_url": "https://www.conab.gov.br/",
            "status": "Ativo / Referência de Custos"
        }
    ]
