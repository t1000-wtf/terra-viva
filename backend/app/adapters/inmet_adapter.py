import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional

class InmetAdapter:
    """
    Adapter para a API oficial do Instituto Nacional de Meteorologia (INMET).
    API: https://apitempo.inmet.gov.br/
    Obtém medições de estações meteorológicas automáticas terrestres (in-situ).
    """
    BASE_URL = "https://apitempo.inmet.gov.br"

    @classmethod
    async def fetch_station_daily_data(
        cls,
        station_code: str,
        start_date: datetime,
        end_date: datetime,
        timeout: float = 8.0
    ) -> List[Dict[str, Any]]:
        s_str = start_date.strftime("%Y-%m-%d")
        e_str = end_date.strftime("%Y-%m-%d")
        url = f"{cls.BASE_URL}/estacao/diaria/{s_str}/{e_str}/{station_code}"
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    results = []
                    for row in data:
                        # Exemplo de campos INMET: TEMP_MED, CHUVA, UMID_MED
                        results.append({
                            "date": row.get("DT_MEDICAO"),
                            "temperature_mean_c": float(row.get("TEMP_MED")) if row.get("TEMP_MED") else None,
                            "precipitation_mm": float(row.get("CHUVA")) if row.get("CHUVA") else 0.0,
                            "humidity_pct": float(row.get("UMID_MED")) if row.get("UMID_MED") else None,
                            "source": f"INMET Estação {station_code}",
                            "is_measured": True,
                            "spatial_resolution": "Pontual (Estação Física)",
                            "confidence_level": "Muito Alta"
                        })
                    return results
        except Exception:
            pass
        return []
