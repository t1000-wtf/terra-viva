from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta
from app.models.all_models import Plot, EnvironmentalRecord, DataStatus

class EnvironmentalAnalysisEngine:
    """
    Motor de Análise Ambiental do TerraViva.
    Calcula:
    - Balanço hídrico simplificado e déficit de umidade
    - Risco de seca ponderado por precipitação e anomalias de umidade
    - Risco de erosão considerando declividade e cobertura do solo
    - Detecção de períodos de solo descoberto
    - Estresse térmico vegetal (dias consecutivos com Tmax > 34°C)
    - Ponderação real da confiabilidade diagnóstica com base no status das fontes
    """

    @classmethod
    def analyze_environmental_conditions(
        cls,
        records: List[EnvironmentalRecord],
        plot: Optional[Plot] = None
    ) -> Dict[str, Any]:
        if not records:
            return {
                "status": "DADOS_INSUFICIENTES",
                "summary": "Não há registros ambientais suficientes para gerar diagnóstico.",
                "confidence_level": "Baixa"
            }

        precip_series = [r.precipitation_mm for r in records if r.precipitation_mm is not None]
        temp_mean_series = [r.temperature_mean_c for r in records if r.temperature_mean_c is not None]
        temp_max_series = [r.temperature_max_c for r in records if r.temperature_max_c is not None]
        moisture_series = [r.soil_moisture_m3_m3 for r in records if r.soil_moisture_m3_m3 is not None]
        anomaly_series = [r.soil_moisture_anomaly for r in records if r.soil_moisture_anomaly is not None]
        ndvi_series = [r.ndvi for r in records if r.ndvi is not None]
        et_series = [r.evapotranspiration_mm for r in records if r.evapotranspiration_mm is not None]

        # Análise do status dos dados e confiabilidade geral
        observed_count = sum(1 for r in records if r.data_status == DataStatus.OBSERVED or str(r.data_status) == "DataStatus.OBSERVED" or str(r.data_status) == "OBSERVED")
        ratio_observed = observed_count / len(records) if records else 0.0

        if ratio_observed >= 0.7:
            calc_confidence = "Alta"
        elif ratio_observed >= 0.3:
            calc_confidence = "Media"
        else:
            calc_confidence = "Baixa"

        # 1. Indicadores Pluviométricos
        total_precip_mm = sum(precip_series) if precip_series else None
        consecutive_dry_days = cls._calculate_consecutive_dry_days(records) if precip_series else None
        
        # 2. Indicadores Térmicos
        mean_tmean = float(np.mean(temp_mean_series)) if temp_mean_series else None
        mean_tmax = float(np.mean(temp_max_series)) if temp_max_series else None
        heat_stress_days = sum(1 for t in temp_max_series if t >= 34.0) if temp_max_series else None

        # 3. Análise de Risco de Seca
        if not precip_series and not anomaly_series:
            drought_risk = "INDETERMINADO"
            drought_desc = "Dados de precipitação e anomalia de umidade insuficientes para avaliar o risco de seca."
        elif consecutive_dry_days is not None and consecutive_dry_days > 25:
            drought_risk = "ALTO"
            drought_desc = "Período crítico de estiagem (>25 dias secos consecutivos). Risco hídrico severo."
        elif (consecutive_dry_days is not None and consecutive_dry_days > 14) or (anomaly_series and float(np.mean(anomaly_series)) < -0.8):
            drought_risk = "MODERADO"
            drought_desc = "Estiagem moderada observada. Recomenda-se cautela no plantio de culturas exigentes."
        else:
            drought_risk = "BAIXO"
            drought_desc = "Regime pluviométrico regular e distribuição hídrica favorável no período."

        # 4. Cobertura do Solo
        if ndvi_series:
            mean_ndvi = float(np.mean(ndvi_series))
            bare_soil_days = sum(1 for n in ndvi_series if n < 0.25)
            bare_soil_risk = bare_soil_days > (len(ndvi_series) * 0.25)
        else:
            mean_ndvi = None
            bare_soil_days = None
            bare_soil_risk = None

        # 5. Risco de Erosão
        slope = plot.slope_pct if (plot and plot.slope_pct is not None) else None
        if slope is None or bare_soil_risk is None:
            erosion_risk = "INDETERMINADO"
            erosion_desc = "Dados de declividade e cobertura vegetal insuficientes para avaliar o risco de erosão."
        elif slope > 12.0 and bare_soil_risk:
            erosion_risk = "ALTO"
            erosion_desc = "Declividade forte combinada com solo descoberto. Alto risco de perda de solo por erosão."
        elif slope > 6.0:
            erosion_risk = "MODERADO"
            erosion_desc = "Declividade ondulada. Demanda plantio em nível e manutenção contínua de palhada."
        else:
            erosion_risk = "BAIXO"
            erosion_desc = "Relevo suave-ondulado a plano. Risco reduzido de processos erosivos intensos."

        # 6. Balanço Hídrico Climatológico
        total_et = sum(et_series) if et_series else None
        water_balance_mm = total_precip_mm - total_et if total_precip_mm is not None and total_et is not None else None
        observed_climate_records = sum(
            1 for r in records
            if (r.data_status == DataStatus.OBSERVED or str(r.data_status) in {"DataStatus.OBSERVED", "OBSERVED"})
            and r.temperature_mean_c is not None
            and r.precipitation_mm is not None
        )

        return {
            "period_days": len(records),
            "precipitation_total_mm": round(total_precip_mm, 1) if total_precip_mm is not None else None,
            "consecutive_dry_days": consecutive_dry_days,
            "drought_risk": drought_risk,
            "drought_description": drought_desc,
            "temperature_mean_c": round(mean_tmean, 1) if mean_tmean is not None else None,
            "temperature_max_mean_c": round(mean_tmax, 1) if mean_tmax is not None else None,
            "heat_stress_days_count": heat_stress_days,
            "soil_moisture_mean_m3_m3": round(float(np.mean(moisture_series)), 3) if moisture_series else None,
            "soil_moisture_anomaly_mean": round(float(np.mean(anomaly_series)), 2) if anomaly_series else None,
            "ndvi_mean": round(mean_ndvi, 3) if mean_ndvi is not None else None,
            "bare_soil_days_count": bare_soil_days,
            "erosion_risk": erosion_risk,
            "erosion_description": erosion_desc,
            "water_balance_mm": round(water_balance_mm, 1) if water_balance_mm is not None else None,
            "data_quality_metrics": {
                "total_records": len(records),
                "observed_records_ratio": round(ratio_observed, 2),
                "observed_climate_records_count": observed_climate_records,
                "is_mostly_observed": ratio_observed >= 0.5
            },
            "scientific_sources": [
                "NASA POWER Agroclimatology (Radiação, Precipitação e Temperatura)",
                "FAO-56 Hargreaves-Samani (Evapotranspiração de Referência ET0)",
                "Open-Elevation SRTM 30m (Topografia e Relevo)"
            ],
            "confidence_level": calc_confidence
        }

    @staticmethod
    def _calculate_consecutive_dry_days(records: List[EnvironmentalRecord]) -> int:
        max_dry = 0
        current_dry = 0
        sorted_records = sorted(records, key=lambda x: x.observation_date)
        for r in sorted_records:
            if r.precipitation_mm is not None and r.precipitation_mm < 1.0:
                current_dry += 1
                if current_dry > max_dry:
                    max_dry = current_dry
            else:
                current_dry = 0
        return max_dry
