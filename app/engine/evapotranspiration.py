from typing import Dict, Any, Optional
import math
import logging

logger = logging.getLogger("terraviva.agronomy.evapotranspiration")

class EvapotranspirationCalculator:
    """
    Módulo de Cálculo Científico de Evapotranspiração de Referência (ET0).
    Em conformidade rigorosa com a publicação FAO Irrigation and Drainage Paper No. 56.
    
    Métodos Disponíveis:
    1. FAO-56 Penman-Monteith (Padrão Ouro Internacional):
       Requer: Temperatura (média, máx, mín), Radiação Solar, Umidade Relativa e Velocidade do Vento a 2m.
    2. FAO-56 Hargreaves-Samani (Método de Estimativa para dados meteorológicos limitados):
       Requer: Temperatura (média, máx, mín), Latitude e Data/Dia do ano para cálculo da radiação extraterrestre (Ra).
    """

    # Constante psicrométrica padrão ao nível do mar (kPa/°C)
    PSYCHROMETRIC_CONST = 0.067
    # Calor latente de vaporização (MJ/kg)
    LAMBDA_VAP = 2.45
    # Constante de Stefan-Boltzmann (MJ K^-4 m^-2 dia^-1)
    SIGMA_SB = 4.903e-9

    @classmethod
    def calculate_et0(
        cls,
        date,
        latitude: float,
        temperature_mean_c: Optional[float],
        temperature_max_c: Optional[float],
        temperature_min_c: Optional[float],
        solar_radiation_mj: Optional[float] = None,
        relative_humidity_pct: Optional[float] = None,
        wind_speed_2m_ms: Optional[float] = None,
        elevation_m: Optional[float] = 0.0
    ) -> Dict[str, Any]:
        """
        Calcula a ET0 diária selecionando o método mais rigoroso possível segundo a disponibilidade de variáveis.
        """
        # Verificação se todos os parâmetros para Penman-Monteith estão disponíveis
        has_pm_inputs = (
            temperature_mean_c is not None and
            temperature_max_c is not None and
            temperature_min_c is not None and
            solar_radiation_mj is not None and
            relative_humidity_pct is not None and
            wind_speed_2m_ms is not None
        )

        if has_pm_inputs:
            return cls._calculate_fao56_penman_monteith(
                date=date,
                latitude=latitude,
                t_mean=temperature_mean_c,
                t_max=temperature_max_c,
                t_min=temperature_min_c,
                rs=solar_radiation_mj,
                rh=relative_humidity_pct,
                u2=wind_speed_2m_ms,
                z=elevation_m or 0.0
            )

        # Se faltar vento ou umidade, mas temos temperaturas extremas e latitude -> Hargreaves-Samani
        has_hs_inputs = (
            temperature_mean_c is not None and
            temperature_max_c is not None and
            temperature_min_c is not None
        )

        if has_hs_inputs:
            return cls._calculate_hargreaves_samani(
                date=date,
                latitude=latitude,
                t_mean=temperature_mean_c,
                t_max=temperature_max_c,
                t_min=temperature_min_c
            )

        # Variáveis insuficientes
        missing = []
        if temperature_mean_c is None: missing.append("temperatura_media")
        if temperature_max_c is None: missing.append("temperatura_maxima")
        if temperature_min_c is None: missing.append("temperatura_minima")

        return {
            "evapotranspiration_mm": None,
            "method": "NENHUM (Dados Insuficientes)",
            "product": "Evapotranspiração de Referência ET0",
            "spatial_resolution": "Local",
            "temporal_resolution": "Daily",
            "unit": "mm/dia",
            "observed_at": date.isoformat() if hasattr(date, "isoformat") else str(date),
            "data_status": "UNAVAILABLE",
            "quality": f"Variáveis térmicas ausentes: {', '.join(missing)}",
            "processing_method": "Impossível computar balanço térmico sem temperaturas extremas.",
            "confidence_level": "Nenhuma"
        }

    @classmethod
    def _calculate_fao56_penman_monteith(
        cls,
        date,
        latitude: float,
        t_mean: float,
        t_max: float,
        t_min: float,
        rs: float, # Radiação solar incidente (MJ/m2/dia)
        rh: float, # Umidade relativa (%)
        u2: float, # Vento a 2m (m/s)
        z: float   # Altitude (m)
    ) -> Dict[str, Any]:
        """
        Equação FAO-56 Penman-Monteith completa:
        ET0 = (0.408 * Delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea)) / (Delta + gamma * (1 + 0.34 * u2))
        """
        # 1. Pressão atmosférica (kPa) função da altitude z (m)
        p = 101.3 * math.pow((293.0 - 0.0065 * z) / 293.0, 5.26)
        # Constante psicrométrica gamma (kPa/°C)
        gamma = 0.000665 * p

        # 2. Curva de pressão de vapor de saturação Delta (kPa/°C)
        delta = 4098.0 * (0.6108 * math.exp((17.27 * t_mean) / (t_mean + 237.3))) / math.pow(t_mean + 237.3, 2)

        # 3. Pressão de vapor de saturação média es (kPa)
        e_tmax = 0.6108 * math.exp((17.27 * t_max) / (t_max + 237.3))
        e_tmin = 0.6108 * math.exp((17.27 * t_min) / (t_min + 237.3))
        es = (e_tmax + e_tmin) / 2.0

        # 4. Pressão real de vapor ea (kPa) baseada na umidade relativa
        ea = es * (rh / 100.0)

        # 5. Radiação extraterrestre (Ra) para balanço de onda curta e longa
        day_of_year = date.timetuple().tm_yday if hasattr(date, "timetuple") else 180
        ra = cls._compute_extraterrestrial_radiation(latitude, day_of_year)
        
        # Radiação solar com céu limpo Rso (MJ/m2/dia)
        rso = (0.75 + 2e-5 * z) * ra
        # Radiação líquida de onda curta Rns (MJ/m2/dia), albedo padrão de referência = 0.23
        rns = (1.0 - 0.23) * rs

        # Radiação líquida de onda longa Rnl (MJ/m2/dia)
        t_max_k4 = math.pow(t_max + 273.16, 4)
        t_min_k4 = math.pow(t_min + 273.16, 4)
        rs_rso = min(1.0, max(0.3, rs / rso)) if rso > 0 else 0.7
        rnl = cls.SIGMA_SB * ((t_max_k4 + t_min_k4) / 2.0) * (0.34 - 0.14 * math.sqrt(max(0.0, ea))) * (1.35 * rs_rso - 0.35)

        # Radiação líquida à superfície Rn (MJ/m2/dia)
        rn = rns - rnl
        # Fluxo de calor do solo G (MJ/m2/dia) em escala diária é considerado ~ 0
        g = 0.0

        # Termo de radiação e termo aerodinâmico
        term_rad = 0.408 * delta * (rn - g)
        term_aero = gamma * (900.0 / (t_mean + 273.0)) * u2 * (es - ea)
        denom = delta + gamma * (1.0 + 0.34 * u2)

        et0 = (term_rad + term_aero) / denom
        et0_val = round(max(0.3, min(15.0, et0)), 2)

        return {
            "evapotranspiration_mm": et0_val,
            "method": "FAO-56 Penman-Monteith (Completo)",
            "product": "Evapotranspiração de Referência ET0 (FAO-56 PM)",
            "spatial_resolution": "Local (Propriedade)",
            "temporal_resolution": "Daily",
            "unit": "mm/dia",
            "observed_at": date.isoformat() if hasattr(date, "isoformat") else str(date),
            "data_status": "ESTIMATED",
            "quality": "Método físico padrão ouro da FAO calculado com vento, radiação, umidade e temperatura.",
            "processing_method": "FAO Irrigation and Drainage Paper No. 56, Equação 6.",
            "confidence_level": "Alta (Padrão Físico Completo)"
        }

    @classmethod
    def _calculate_hargreaves_samani(
        cls,
        date,
        latitude: float,
        t_mean: float,
        t_max: float,
        t_min: float
    ) -> Dict[str, Any]:
        """
        Equação FAO-56 Hargreaves-Samani (1985):
        ET0 = 0.0023 * (Tmean + 17.8) * (Tmax - Tmin)^0.5 * Ra
        """
        delta_t = max(0.1, t_max - t_min)
        day_of_year = date.timetuple().tm_yday if hasattr(date, "timetuple") else 180
        ra = cls._compute_extraterrestrial_radiation(latitude, day_of_year)

        # Ra em MJ/m2/dia convertido para equivalente em mm/dia através de 0.408 (1 / 2.45)
        et0 = 0.0023 * (t_mean + 17.8) * math.sqrt(delta_t) * (ra * 0.408)
        et0_val = round(max(0.5, min(14.0, et0)), 2)

        return {
            "evapotranspiration_mm": et0_val,
            "method": "FAO-56 Hargreaves-Samani (Temperatura)",
            "product": "Evapotranspiração de Referência ET0 (Hargreaves-Samani)",
            "spatial_resolution": "Local (Propriedade)",
            "temporal_resolution": "Daily",
            "unit": "mm/dia",
            "observed_at": date.isoformat() if hasattr(date, "isoformat") else str(date),
            "data_status": "ESTIMATED",
            "quality": "Estimativa biofísica para ausência de anemômetro (vento) ou higrômetro local.",
            "processing_method": "Equação de Hargreaves-Samani recomendada pela FAO-56 para variáveis limitadas.",
            "confidence_level": "Media (Modelo Físico Simplificado)"
        }

    @classmethod
    def _compute_extraterrestrial_radiation(cls, latitude: float, day_of_year: int) -> float:
        """Cálculo astronômico da radiação no topo da atmosfera (Ra em MJ/m2/dia)."""
        lat_rad = math.radians(latitude)
        solar_dec = 0.409 * math.sin((2 * math.pi * day_of_year / 365.0) - 1.39)
        ws = math.acos(max(-1.0, min(1.0, -math.tan(lat_rad) * math.tan(solar_dec))))
        dr = 1.0 + 0.033 * math.cos(2 * math.pi * day_of_year / 365.0)
        # Constante solar Gsc = 0.0820 MJ m^-2 min^-1
        ra = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
            ws * math.sin(lat_rad) * math.sin(solar_dec) + 
            math.cos(lat_rad) * math.cos(solar_dec) * math.sin(ws)
        )
        return max(0.1, ra)
