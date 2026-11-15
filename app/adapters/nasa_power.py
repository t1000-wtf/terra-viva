import httpx
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger("terraviva.adapters.nasa_power")

class NasaPowerAdapter:
    """
    Adapter para a API oficial NASA POWER (Prediction of Worldwide Energy Resources).
    Fornece parâmetros diários de agroclimatologia baseados em coordenadas geográficas.
    Documentação oficial: https://power.larc.nasa.gov/docs/
    
    REGRA INEGOCIÁVEL:
    - Nunca gera séries meteorológicas artificiais quando a API estiver indisponível.
    - Retorna registros com data_status="UNAVAILABLE" documentando a causa da falha.
    - Diferencia dados ausentes (None) de valores meteorológicos iguais a zero (ex: 0.0 mm de chuva).
    - Preserva proveniência, produto e parâmetros solicitados.
    """
    BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

    @classmethod
    async def fetch_climate_data(
        cls,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime,
        timeout: float = 15.0,
        max_retries: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Recupera dados agrometeorológicos diários da API NASA POWER com retentativas controladas.
        Parâmetros consultados:
        - T2M: Temperatura média a 2m (°C)
        - T2M_MAX: Temperatura máxima a 2m (°C)
        - T2M_MIN: Temperatura mínima a 2m (°C)
        - PRECTOTCORR: Precipitação corrigida (mm/dia)
        - ALLSKY_SFC_SW_DWN: Radiação solar global incidente à superfície (MJ/m²/dia)
        - RH2M: Umidade relativa a 2m (%)
        """
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")

        params = {
            "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M",
            "community": "AG",
            "longitude": f"{longitude:.4f}",
            "latitude": f"{latitude:.4f}",
            "start": start_str,
            "end": end_str,
            "format": "JSON"
        }

        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Consultando NASA POWER (tentativa {attempt}/{max_retries}) para lat={latitude}, lon={longitude}")
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.get(cls.BASE_URL, params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        properties = data.get("properties", {}).get("parameter", {})
                        t2m = properties.get("T2M", {})
                        t2m_max = properties.get("T2M_MAX", {})
                        t2m_min = properties.get("T2M_MIN", {})
                        prec = properties.get("PRECTOTCORR", {})
                        rad = properties.get("ALLSKY_SFC_SW_DWN", {})
                        rh2m = properties.get("RH2M", {})

                        if not t2m:
                            last_error = "Payload retornado pela NASA POWER sem parâmetros em 'properties.parameter'"
                            logger.warning(last_error)
                            continue

                        records = []
                        collected_at = datetime.now(timezone.utc)
                        for date_str, temp in t2m.items():
                            val_temp = temp if (temp is not None and temp != -999 and temp != -999.0) else None
                            
                            val_max_raw = t2m_max.get(date_str)
                            val_max = val_max_raw if (val_max_raw is not None and val_max_raw != -999 and val_max_raw != -999.0) else None
                            
                            val_min_raw = t2m_min.get(date_str)
                            val_min = val_min_raw if (val_min_raw is not None and val_min_raw != -999 and val_min_raw != -999.0) else None
                            
                            # Tratamento rigoroso: Missing (-999) é None; 0.0 mm é dia seco observado real
                            val_prec_raw = prec.get(date_str)
                            if val_prec_raw is not None and val_prec_raw != -999 and val_prec_raw != -999.0:
                                val_prec = max(0.0, float(val_prec_raw))
                            else:
                                val_prec = None
                            
                            val_rad_raw = rad.get(date_str)
                            val_rad = float(val_rad_raw) if (val_rad_raw is not None and val_rad_raw != -999 and val_rad_raw != -999.0) else None
                            
                            val_rh_raw = rh2m.get(date_str)
                            val_rh = float(val_rh_raw) if (val_rh_raw is not None and val_rh_raw != -999 and val_rh_raw != -999.0) else None

                            dt = datetime.strptime(date_str, "%Y%m%d")
                            
                            # Validação física de sanidade científica
                            # Temperatura terrestre plausível: -50°C a +60°C
                            if val_temp is not None and not (-50.0 <= val_temp <= 60.0):
                                val_temp = None
                            if val_max is not None and not (-50.0 <= val_max <= 65.0):
                                val_max = None
                            if val_min is not None and not (-60.0 <= val_min <= 50.0):
                                val_min = None
                            if val_prec is not None and not (0.0 <= val_prec <= 800.0):
                                val_prec = None

                            # Avaliação de qualidade e status real
                            has_core_data = (val_temp is not None) and (val_prec is not None)
                            if has_core_data:
                                status = "OBSERVED"
                                conf = "Alta"
                            elif (val_temp is not None) or (val_prec is not None):
                                status = "OBSERVED"
                                conf = "Media (Parcial)"
                            else:
                                status = "UNAVAILABLE"
                                conf = "Nenhuma"

                            records.append({
                                "date": dt,
                                "temperature_mean_c": val_temp,
                                "temperature_max_c": val_max,
                                "temperature_min_c": val_min,
                                "precipitation_mm": val_prec,
                                "solar_radiation_mj_m2": val_rad,
                                "relative_humidity_pct": val_rh,
                                "source_name": "NASA POWER",
                                "product": "Agroclimatology Daily Point API (MERRA-2 / GEOS-FP assimilado)",
                                "spatial_resolution": "0.5 x 0.5 graus (~50 km)",
                                "temporal_resolution": "Daily",
                                "observed_at": dt.isoformat(),
                                "collected_at": collected_at.isoformat(),
                                "is_measured": False,
                                "data_status": status,
                                "confidence_level": conf,
                                "processing_method": "Assimilação meteorológica oficial NASA POWER v2.0",
                                "raw_payload": None
                            })
                        logger.info(f"NASA POWER retornou {len(records)} registros com sucesso.")
                        return records
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                        logger.warning(f"Resposta inesperada NASA POWER: {last_error}")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Falha de conexão NASA POWER na tentativa {attempt}: {e}")

        # Se todas as tentativas falharem, NUNCA gerar dados artificiais.
        # Retornar registros diários para o período marcado como UNAVAILABLE com log do erro.
        logger.error(f"NASA POWER indisponível após {max_retries} tentativas: {last_error}. Retornando status UNAVAILABLE sem sintetizar dados fictícios.")
        return cls._generate_unavailable_records(latitude, longitude, start_date, end_date, error_reason=str(last_error))

    @classmethod
    def _generate_unavailable_records(
        cls,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime,
        error_reason: str
    ) -> List[Dict[str, Any]]:
        """
        Gera registros explícitos de indisponibilidade (UNAVAILABLE).
        Não inventa temperatura nem precipitação.
        """
        records = []
        cur = start_date
        collected_at = datetime.now(timezone.utc)

        while cur <= end_date:
            records.append({
                "date": cur,
                "temperature_mean_c": None,
                "temperature_max_c": None,
                "temperature_min_c": None,
                "precipitation_mm": None,
                "solar_radiation_mj_m2": None,
                "relative_humidity_pct": None,
                "source_name": "NASA POWER",
                "product": "Agroclimatology Daily Point API",
                "spatial_resolution": "0.5 x 0.5 graus",
                "temporal_resolution": "Daily",
                "observed_at": cur.isoformat(),
                "collected_at": collected_at.isoformat(),
                "is_measured": False,
                "data_status": "UNAVAILABLE",
                "confidence_level": "Nenhuma (Falha de Comunicação)",
                "processing_method": f"Falha na obtenção dos dados oficiais: {error_reason}",
                "raw_payload": {"error": error_reason}
            })
            cur += timedelta(days=1)
        return records
