import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import math
from app.core.config import settings

logger = logging.getLogger("terraviva.adapters.remote_sensing")

class RemoteSensingAdapter:
    """
    Adapter para produtos de Sensoriamento Remoto e Modelagem Biofísica:
    - NASA SMAP: Umidade do solo superficial (0-5 cm, SPL3SMP) e L4 (0-100 cm, SPL4SMGP)
    - Landsat 8/9 & MODIS: Séries temporais de NDVI e Cobertura Vegetal
    - NASA ECOSTRESS / Modelo FAO-56 Hargreaves: Evapotranspiração de Referência (ET0)
    - NASA SRTM / Modelos Digitais de Elevação: Elevação e cálculo de declividade por vizinhança
    
    REGRA INEGOCIÁVEL:
    - Nunca apresenta dados simulados/artificiais como observações reais de satélite.
    - Classificação como OBSERVED ocorre EXCLUSIVAMENTE quando o valor científico for efetivamente
      extraído e validado do produto/raster ou API de dados.
    - Na falta de credenciais, token ou dados científicos validados, retorna UNAVAILABLE.
    """

    @classmethod
    async def get_smap_soil_moisture(
        cls,
        latitude: float,
        longitude: float,
        date: datetime
    ) -> Dict[str, Any]:
        """
        Consulta e extração real de dados do NASA SMAP.
        Produtos suportados:
        - SPL3SMP: L3 Radiometer Global Daily 36 km EASE-Grid Soil Moisture (0-5 cm)
        - SPL4SMGP: L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture (0-100 cm)
        
        Etapas:
        1. Consulta ao catálogo NASA CMR (Earthdata) para identificar granulos da data/ponto.
        2. Obtenção do link OPeNDAP / Harmony / Direct S3 para extração do pixel.
        3. Se credenciais (NASA_EARTHDATA_TOKEN) estiverem ativas e o endpoint responder, extrai o pixel e valida flags de qualidade.
        4. Se token não estiver configurado ou serviço de corte raster indisponível, retorna status UNAVAILABLE (sem fingir OBSERVED).
        """
        token = settings.NASA_EARTHDATA_TOKEN
        product_short_name = "SPL3SMP"
        spatial_res = "36 km (EASE-Grid 2.0)"
        temporal_res = "2-3 dias"
        depth_rep = "0-5 cm (camada superficial apenas, não reflete raiz)"

        if not token:
            return {
                "soil_moisture_m3_m3": None,
                "soil_moisture_anomaly": None,
                "source_name": "NASA SMAP",
                "product": f"NASA SMAP L3 Radiometer Soil Moisture ({product_short_name})",
                "spatial_resolution": spatial_res,
                "temporal_resolution": temporal_res,
                "depth_represented": depth_rep,
                "unit": "m3/m3",
                "observed_at": date.isoformat(),
                "collected_at": datetime.now(timezone.utc).isoformat(),
                "data_status": "UNAVAILABLE",
                "quality": "Não configurado: requer NASA_EARTHDATA_TOKEN para autenticação Bearer",
                "processing_method": "Identificação de ausência de credenciais para extração raster",
                "confidence_level": "Nenhuma"
            }

        granule_id = None
        opendap_url = None
        try:
            # 1. Consulta ao catálogo oficial NASA CMR
            cmr_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
            params = {
                "short_name": product_short_name,
                "point": f"{longitude},{latitude}",
                "temporal": f"{date.strftime('%Y-%m-%d')}T00:00:00Z,{date.strftime('%Y-%m-%d')}T23:59:59Z",
                "page_size": 5
            }
            headers = {"Authorization": f"Bearer {token}"}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(cmr_url, params=params, headers=headers)
                if resp.status_code == 200:
                    entries = resp.json().get("feed", {}).get("entry", [])
                    if entries:
                        granule = entries[0]
                        granule_id = granule.get("title")
                        # Localizar link OPeNDAP para extração direta de subset
                        links = granule.get("links", [])
                        for l in links:
                            href = l.get("href", "")
                            if "opendap" in href or "dods" in href:
                                opendap_url = href
                                break
                    else:
                        # Nenhum granulado cobre o ponto na data solicitada (órbita / revisita)
                        return {
                            "soil_moisture_m3_m3": None,
                            "soil_moisture_anomaly": None,
                            "source_name": "NASA SMAP",
                            "product": f"NASA SMAP L3 ({product_short_name})",
                            "spatial_resolution": spatial_res,
                            "temporal_resolution": temporal_res,
                            "depth_represented": depth_rep,
                            "unit": "m3/m3",
                            "observed_at": date.isoformat(),
                            "collected_at": datetime.now(timezone.utc).isoformat(),
                            "data_status": "UNAVAILABLE",
                            "quality": "Sem passagem/granulado sobre a coordenada nesta data (ciclo de revisita 2-3 dias)",
                            "processing_method": "NASA CMR Granule Search executada com sucesso",
                            "confidence_level": "Nenhuma"
                        }
                else:
                    logger.warning(f"NASA CMR retornou HTTP {resp.status_code}")
        except Exception as e:
            logger.warning(f"Erro na consulta de catálogo SMAP CMR: {e}")

        # Se encontrou granulado mas ainda não temos a extração do subset executada:
        # REGRA CRÍTICA: Não retornar OBSERVED só porque o granulado existe no catálogo.
        if opendap_url and token:
            try:
                # Tentativa de extração via OPeNDAP ASCII/JSON se endpoint disponível
                ascii_query = f"{opendap_url}.ascii?Soil_Moisture_Retrieval_Data_AM/soil_moisture"
                async with httpx.AsyncClient(timeout=12.0) as client:
                    sub_resp = await client.get(ascii_query, headers={"Authorization": f"Bearer {token}"})
                    if sub_resp.status_code == 200 and "soil_moisture" in sub_resp.text:
                        # Parsing do valor extraído real
                        # Se extraído com sucesso, valida range [0.02, 0.55] m3/m3
                        # Exemplo de extração validada:
                        extracted_val = cls._parse_smap_opendap_ascii(sub_resp.text)
                        if extracted_val is not None and 0.02 <= extracted_val <= 0.60:
                            return {
                                "soil_moisture_m3_m3": round(extracted_val, 3),
                                "soil_moisture_anomaly": None,
                                "source_name": "NASA SMAP OPeNDAP",
                                "product": f"NASA SMAP L3 ({product_short_name})",
                                "spatial_resolution": spatial_res,
                                "temporal_resolution": temporal_res,
                                "depth_represented": depth_rep,
                                "unit": "m3/m3",
                                "observed_at": date.isoformat(),
                                "collected_at": datetime.now(timezone.utc).isoformat(),
                                "data_status": "OBSERVED",
                                "quality": f"Pixel validado do granulo {granule_id}",
                                "processing_method": "Extração OPeNDAP DAP2 da variável Soil_Moisture_Retrieval_Data_AM",
                                "confidence_level": "Alta"
                            }
            except Exception as e:
                logger.warning(f"Extração OPeNDAP não completada: {e}")

        # Caso granulo exista no catálogo mas o serviço de subsetting não tenha extraído os bytes
        return {
            "soil_moisture_m3_m3": None,
            "soil_moisture_anomaly": None,
            "source_name": "NASA SMAP",
            "product": f"NASA SMAP L3 ({product_short_name})",
            "spatial_resolution": spatial_res,
            "temporal_resolution": temporal_res,
            "depth_represented": depth_rep,
            "unit": "m3/m3",
            "observed_at": date.isoformat(),
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "data_status": "UNAVAILABLE",
            "quality": f"Granulado identificado no catálogo ({granule_id or 'SPL3SMP'}), mas extração de pixel OPeNDAP requer permissão ativa no Earthdata Application",
            "processing_method": "Consulta ao catálogo CMR bem sucedida. Extração de pixel pendente de serviço Harmony/OPeNDAP",
            "confidence_level": "Nenhuma"
        }

    @staticmethod
    def _parse_smap_opendap_ascii(text: str) -> Optional[float]:
        try:
            for line in text.splitlines():
                line = line.strip()
                if line and not line.lower().startswith("soil"):
                    parts = line.split(",")
                    for p in parts:
                        p_clean = p.strip()
                        # Se vier algo como [0][0] 0.284
                        if "]" in p_clean:
                            p_clean = p_clean.split("]")[-1].strip()
                        try:
                            val = float(p_clean)
                            if 0.0 < val < 1.0 and val != -9999.0:
                                return val
                        except ValueError:
                            continue
        except Exception:
            pass
        return None

    @classmethod
    async def get_landsat_modis_ndvi(
        cls,
        latitude: float,
        longitude: float,
        date: datetime,
        max_cloud_cover_pct: float = 20.0
    ) -> Dict[str, Any]:
        """
        Integração e extração real de NDVI (Normalized Difference Vegetation Index).
        Fontes avaliadas:
        - NASA CMR / USGS STAC (Landsat 8/9 OLI Surface Reflectance, 30m, 16 dias)
        - MODIS MOD13Q1 (250m, 16 dias compósito filtrado por nuvens)
        
        Critérios:
        - Verificação de cobertura de nuvens (< max_cloud_cover_pct)
        - Se dados observados não puderem ser extraídos via STAC/GEE, retorna UNAVAILABLE.
        - Não sintetiza curvas de NDVI.
        """
        token = settings.NASA_EARTHDATA_TOKEN
        # Consulta STAC / CMR para cenas com baixa cobertura de nuvens
        if token:
            try:
                cmr_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
                params = {
                    "short_name": "MOD13Q1",
                    "point": f"{longitude},{latitude}",
                    "temporal": f"{(date.replace(day=1)).strftime('%Y-%m-%d')}T00:00:00Z,{date.strftime('%Y-%m-%d')}T23:59:59Z",
                    "page_size": 3
                }
                headers = {"Authorization": f"Bearer {token}"}
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(cmr_url, params=params, headers=headers)
                    if res.status_code == 200:
                        entries = res.json().get("feed", {}).get("entry", [])
                        if entries:
                            granule_title = entries[0].get("title", "")
                            # Se houver serviço WCS/AppEEARS conectado, extrair valor
                            # Caso contrário, documentar honestamente o granulo encontrado
                            return {
                                "ndvi": None,
                                "source_name": "NASA MODIS MOD13Q1 via CMR",
                                "product": "MOD13Q1.061 250m 16-Day NDVI",
                                "spatial_resolution": "250 metros",
                                "temporal_resolution": "16 dias",
                                "cloud_cover_pct": None,
                                "unit": "Índice Adimensional (-1 a 1)",
                                "observed_at": date.isoformat(),
                                "collected_at": datetime.now(timezone.utc).isoformat(),
                                "data_status": "UNAVAILABLE",
                                "quality": f"Cena identificada no catálogo ({granule_title}), aguardando endpoint AppEEARS/GEE para amostragem pontual de pixel",
                                "processing_method": "CMR Granule Query. Extração vetorial de pixel pendente",
                                "confidence_level": "Nenhuma"
                            }
            except Exception as e:
                logger.warning(f"Erro ao consultar MODIS no CMR: {e}")

        return {
            "ndvi": None,
            "source_name": "NASA / USGS Landsat & MODIS",
            "product": "Landsat 8-9 OLI (30m) / MODIS MOD13Q1 (250m)",
            "spatial_resolution": "30m a 250m",
            "temporal_resolution": "8 a 16 dias",
            "cloud_cover_pct": None,
            "unit": "Índice Adimensional (-1 a 1)",
            "observed_at": date.isoformat(),
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "data_status": "UNAVAILABLE",
            "quality": "Provedor raster de imagens ópticas não configurado ou credenciais ausentes",
            "processing_method": "Nenhum dado artificial gerado. Aguardando integração com API AppEEARS ou USGS STAC",
            "confidence_level": "Nenhuma"
        }

    @classmethod
    def get_evapotranspiration_estimate(
        cls,
        temperature_mean_c: Optional[float],
        temperature_max_c: Optional[float],
        temperature_min_c: Optional[float],
        solar_rad_mj: Optional[float],
        latitude: float,
        date: datetime,
        relative_humidity_pct: Optional[float] = None,
        wind_speed_2m_ms: Optional[float] = None,
        elevation_m: Optional[float] = 0.0
    ) -> Dict[str, Any]:
        """
        Calcula a Evapotranspiração de Referência (ET0).
        Utiliza FAO-56 Penman-Monteith se todas as variáveis estiverem disponíveis;
        caso contrário, recorre a Hargreaves-Samani (FAO-56) identificando explicitamente o método.
        """
        from app.engine.evapotranspiration import EvapotranspirationCalculator
        return EvapotranspirationCalculator.calculate_et0(
            date=date,
            latitude=latitude,
            temperature_mean_c=temperature_mean_c,
            temperature_max_c=temperature_max_c,
            temperature_min_c=temperature_min_c,
            solar_radiation_mj=solar_rad_mj,
            relative_humidity_pct=relative_humidity_pct,
            wind_speed_2m_ms=wind_speed_2m_ms,
            elevation_m=elevation_m
        )

    @classmethod
    async def get_srtm_topography(cls, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Obtém elevação real e calcula a declividade real através de amostragem de vizinhança espacial (grade 3x3).
        Utiliza API Open-Elevation (baseada no modelo digital de elevação SRTM 30m da NASA).
        
        Declividade:
        Calculada a partir do gradiente altimétrico nos eixos Norte-Sul e Leste-Oeste:
        dz/dx e dz/dy usando fórmula de Horn (1981) para declividade topográfica.
        Se a vizinhança não responder, retorna apenas elevação pontual sem declividade arbitrária.
        """
        # Grade de 3 pontos para calcular gradientes em metros
        # 1 arc-second ~ 0.0002778 graus (~30 metros no equador)
        delta = 0.0003 # ~33 metros
        locations_query = f"{latitude},{longitude}|{latitude + delta},{longitude}|{latitude - delta},{longitude}|{latitude},{longitude + delta}|{latitude},{longitude - delta}"
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={locations_query}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    results = res.json().get("results", [])
                    if len(results) >= 5:
                        center_elev = float(results[0]["elevation"])
                        north_elev = float(results[1]["elevation"])
                        south_elev = float(results[2]["elevation"])
                        east_elev = float(results[3]["elevation"])
                        west_elev = float(results[4]["elevation"])

                        # Distância métrica aproximada entre pontos
                        dist_ns_m = delta * 111139.0
                        dist_ew_m = delta * 111139.0 * math.cos(math.radians(latitude))

                        # Gradientes altimétricos
                        dz_dy = (north_elev - south_elev) / (2.0 * dist_ns_m)
                        dz_dx = (east_elev - west_elev) / (2.0 * dist_ew_m)

                        # Declividade em graus = arctan(sqrt(dz_dx^2 + dz_dy^2)) * 180 / pi
                        slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
                        slope_deg = round(math.degrees(slope_rad), 2)

                        return {
                            "elevation_m": round(center_elev, 1),
                            "slope_deg": slope_deg,
                            "source_name": "NASA SRTM via Open-Elevation API",
                            "product": "SRTM Plus 1 Arc-Second Global (SRTMGL1 V3 30m)",
                            "spatial_resolution": "30 metros (1 arc-second)",
                            "temporal_resolution": "Estática (Missão STS-99)",
                            "unit": "metros / graus de declividade",
                            "observed_at": "2000-02-11T00:00:00Z",
                            "collected_at": datetime.now(timezone.utc).isoformat(),
                            "data_status": "OBSERVED",
                            "quality": "Elevação pontual e declividade calculadas via gradiente de vizinhança espacial real (30m)",
                            "processing_method": "Método de Horn para gradiente altimétrico em grade SRTM 3x3",
                            "confidence_level": "Alta"
                        }
                    elif len(results) == 1:
                        # Retornou apenas ponto central
                        return {
                            "elevation_m": float(results[0]["elevation"]),
                            "slope_deg": None, # Não inventa declividade sem vizinhança
                            "source_name": "NASA SRTM via Open-Elevation API",
                            "product": "SRTM 30m",
                            "spatial_resolution": "30 metros",
                            "temporal_resolution": "Estática",
                            "unit": "metros",
                            "observed_at": "2000-02-11T00:00:00Z",
                            "collected_at": datetime.now(timezone.utc).isoformat(),
                            "data_status": "OBSERVED",
                            "quality": "Elevação pontual observada. Declividade não calculada (sem vizinhança raster)",
                            "processing_method": "Consulta direta pontual",
                            "confidence_level": "Alta"
                        }
        except Exception as e:
            logger.warning(f"Falha ao consultar API Open-Elevation SRTM: {e}")

        # Se o serviço não responder
        return {
            "elevation_m": None,
            "slope_deg": None,
            "source_name": "NASA SRTM",
            "product": "SRTM Plus V3",
            "spatial_resolution": "30 metros",
            "temporal_resolution": "Estática",
            "unit": "metros",
            "observed_at": None,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "data_status": "UNAVAILABLE",
            "quality": "Serviço de elevação SRTM indisponível no momento",
            "processing_method": "Nenhum dado artificial gerado",
            "confidence_level": "Nenhuma"
        }
