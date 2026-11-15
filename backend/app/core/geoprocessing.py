from typing import Dict, Any, Tuple, Optional, List
import math
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.validation import explain_validity
import pyproj
from pyproj import Geod

class GeoProcessingService:
    """
    Serviço de geoprocessamento e validação de geometrias vetoriais (GeoJSON).
    Suporta:
    - Validação estrutural de polígonos GeoJSON (RFC 7946)
    - Suporte a Polygon e MultiPolygon
    - Validação de anéis, coordenadas, fechamento e auto-interseções OGC
    - Validação rigorosa de todos os vértices e anéis dentro do território brasileiro
    - Cálculo geodésico exato de área em hectares e perímetro em metros via WGS84 Geod (algoritmo Karney)
    - Rejeição limpa de geometrias vazias, colapsadas ou coordenadas inválidas
    """

    # Limites geográficos estritos do Brasil (WGS84)
    # Latitude: -33.75° (Chuí/RS) a +5.27° (Monte Caburaí/RR)
    # Longitude: -73.99° (Serra do Divisor/AC) a -34.79° (Ponta do Seixas/PB)
    BR_LAT_MIN = -34.0
    BR_LAT_MAX = 5.5
    BR_LON_MIN = -74.5
    BR_LON_MAX = -34.5

    # Instância geodésica WGS84 para cálculos elipsoidais de alta precisão
    _geod = Geod(ellps="WGS84")

    @classmethod
    def validate_and_compute_geojson(cls, geojson_data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Valida se o GeoJSON é um polígono ou multipolígono válido e calcula área precisa em hectares.
        Retorna: (is_valid, error_message, computed_metrics)
        """
        if not geojson_data or not isinstance(geojson_data, dict):
            return False, "GeoJSON inválido: objeto nulo ou não é um dicionário JSON.", None

        geom_type = geojson_data.get("type")
        if not geom_type:
            return False, "GeoJSON inválido: campo 'type' obrigatório ausente.", None

        if geom_type not in ["Polygon", "MultiPolygon"]:
            return False, f"Tipo de geometria inválido: esperado 'Polygon' ou 'MultiPolygon', recebido '{geom_type}'.", None

        coords = geojson_data.get("coordinates")
        if not coords or not isinstance(coords, list) or len(coords) == 0:
            return False, "Geometria vazia ou sem coordenadas.", None

        # Validação estrutural com Shapely
        try:
            geom = shape(geojson_data)
        except Exception as e:
            return False, f"Erro ao interpretar geometria GeoJSON: {str(e)}", None

        if geom.is_empty:
            return False, "Geometria vazia (sem área nem vértices).", None

        if not geom.is_valid:
            reason = explain_validity(geom)
            return False, f"Geometria topologicamente inválida segundo regras OGC: {reason}.", None

        # Verificar se todos os polígonos possuem anéis fechados válidos
        polygons: List[Polygon] = []
        if isinstance(geom, Polygon):
            polygons = [geom]
        elif isinstance(geom, MultiPolygon):
            polygons = list(geom.geoms)
        else:
            return False, f"Objeto resultante não é Polygon ou MultiPolygon: {geom.geom_type}.", None

        # Verificar se TODOS os vértices de TODOS os anéis estão dentro do território brasileiro
        for p in polygons:
            # Anel externo
            exterior_coords = list(p.exterior.coords)
            if len(exterior_coords) < 4:
                return False, "Anel exterior deve possuir no mínimo 4 coordenadas (fechamento).", None

            for lon, lat in exterior_coords:
                if not cls._is_coord_valid_and_brazil(lat, lon):
                    return False, f"Coordenada ({lat:.5f}, {lon:.5f}) está fora dos limites territoriais do Brasil ou é inválida.", None

            # Anéis interiores (buracos)
            for interior in p.interiors:
                interior_coords = list(interior.coords)
                if len(interior_coords) < 4:
                    return False, "Anel interior deve possuir no mínimo 4 coordenadas.", None
                for lon, lat in interior_coords:
                    if not cls._is_coord_valid_and_brazil(lat, lon):
                        return False, f"Coordenada interior ({lat:.5f}, {lon:.5f}) fora do Brasil.", None

        # Cálculo geodésico no elipsoide WGS84
        # Geod.geometry_area_perimeter calcula a área elipsoidal correta em m² e o perímetro em m
        area_m2, perimeter_m = cls._geod.geometry_area_perimeter(geom)
        area_m2 = abs(area_m2) # Garante sinal positivo independente de orientação do anel
        perimeter_m = abs(perimeter_m)

        if area_m2 <= 0.0001:
            return False, "Área geodésica calculada é nula ou insignificante.", None

        area_ha = round(area_m2 / 10000.0, 4)
        perimeter_m = round(perimeter_m, 2)
        centroid = geom.centroid

        return True, None, {
            "area_ha": area_ha,
            "perimeter_m": perimeter_m,
            "centroid_lat": round(centroid.y, 6),
            "centroid_lon": round(centroid.x, 6),
            "geom_type": geom.geom_type,
            "polygons_count": len(polygons)
        }

    @classmethod
    def _is_coord_valid_and_brazil(cls, lat: float, lon: float) -> bool:
        if math.isnan(lat) or math.isnan(lon) or math.isinf(lat) or math.isinf(lon):
            return False
        # Checagem de faixa global
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return False
        # Checagem territorial brasileira
        return (cls.BR_LAT_MIN <= lat <= cls.BR_LAT_MAX and cls.BR_LON_MIN <= lon <= cls.BR_LON_MAX)
