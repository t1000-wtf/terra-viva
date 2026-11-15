# Proveniência Científica e Confiabilidade dos Dados — TerraViva (v1.3.0)

Este documento apresenta a fundamentação científica, o mapeamento de variáveis, as fórmulas agrometeorológicas e a distinção clara entre testes reais de rede e testes unitários com mocks.

---

## 1. Tabela de Status Científico e Validação por Integração

| Fonte / Integração | Status de Validação | Tipo de Validação Realizada | Produto Oficial | Resolução Espacial | Resolução Temporal | Credenciais & Limitações |
|---|---|---|---|---|---|---|
| **NASA POWER (Agroclimatologia)** | **Validada em Produção** | **Chamada Real (HTTP 200)** | API Diária de Agroclimatologia v2.0 (MERRA-2) | 0.5° (~50 km) | Diária | **API Aberta.** Parâmetros: T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M. Valores ausentes (-999) tratados estritamente como `None`. Sem dados artificiais de fallback. |
| **Open-Elevation (SRTM 30m)** | **Validada em Produção** | **Chamada Real (HTTP 200)** | NASA SRTMGL1 V3 (1 arc-second) | 30 metros | Estática (STS-99) | **API Aberta.** Consulta de grade 3x3 para cálculo de declividade real via fórmula de Horn. Caso a vizinhança falhe, mantém apenas elevação pontual sem atribuir declividade arbitrária. |
| **IBGE (Localidades e Agregados)** | **Validada em Produção** | **Chamada Real (HTTP 200)** | API de Localidades v1 / SIDRA v3 | Municipal / Setor Censitário | Censitária / Anual | **API Aberta.** Identificação de códigos oficiais de 7 dígitos e dados de população e IDHM. |
| **Evapotranspiração de Referência (ET0)** | **Validada Cientificamente** | **Cálculo Físico Validado** | FAO-56 Penman-Monteith / Hargreaves-Samani | Pontual (Propriedade) | Diária | Quando todas as variáveis estão disponíveis (temperatura, radiação, umidade e vento a 2m), computa **FAO-56 Penman-Monteith**. Quando faltam anemômetro ou umidade, aplica **FAO-56 Hargreaves-Samani** com cálculo astronômico de radiação extraterrestre ($R_a$). Marcada sempre como `ESTIMATED`. |
| **NASA SMAP (Umidade do Solo)** | **Implementada** | **Validada com Mocks e Catálogo CMR** | SPL3SMP (0-5 cm) / SPL4SMGP (0-100 cm) | 36 km / 9 km | 2-3 dias | **Requer `NASA_EARTHDATA_TOKEN` ativo**. A descoberta de granulo no CMR não gera status `OBSERVED`. Apenas quando a matriz OPeNDAP for extraída com sucesso para o ponto e validada em $[0.02, 0.60]\text{ m}^3/\text{m}^3$ o dado é considerado observado; caso contrário, reporta `UNAVAILABLE`. |
| **Landsat 8-9 & MODIS (NDVI)** | **Implementada (Catálogo)** | **Validada com Mocks e Catálogo CMR** | Landsat Surface Reflectance (30m) / MOD13Q1 (250m) | 30m / 250m | 8-16 dias | **Requer `NASA_EARTHDATA_TOKEN`**. O TerraViva não simula NDVI. Enquanto não houver serviço de corte raster (AppEEARS/GEE) configurado, permanece com status `UNAVAILABLE`. |
| **Geoprocessamento (GeoJSON Vetorial)** | **Validada Cientificamente** | **Algoritmo Geodésico Elipsoidal** | Elipsoide WGS84 Karney | Sub-milimétrica | N/A | Validação topológica OGC de anéis e auto-interseção com Shapely. Validação de **todos os vértices** no território brasileiro. Cálculo elipsoidal de área em hectares e perímetro via `pyproj.Geod(ellps="WGS84")`. |
| **Motor Agronômico Multicritério** | **Validada Cientificamente** | **Casos de Teste Multidimensionais** | Critérios Embrapa / Zoneamento Agrícola | Talhão | Safra / 12 meses | **Exige no mínimo 30 dias de série histórica**. Valida fitossanidade por quebra de famílias botânicas (Poaceae vs Fabaceae), faixas térmicas, pH de solo, disponibilidade hídrica e orçamento/mecanização do agricultor. |

---

## 2. Metodologia de Evapotranspiração (FAO-56)

### 2.1 Método FAO-56 Penman-Monteith (Padrão Ouro)
Utilizado quando a propriedade dispõe de dados completos:
$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$
- $\Delta$: Declividade da curva de pressão de vapor saturado ($\text{kPa }^\circ\text{C}^{-1}$)
- $R_n$: Radiação líquida à superfície ($\text{MJ m}^{-2}\text{ dia}^{-1}$)
- $G$: Fluxo de calor no solo ($\approx 0$ em escala diária)
- $\gamma$: Constante psicrométrica ($\text{kPa }^\circ\text{C}^{-1}$ ajustada pela altitude $z$)
- $u_2$: Velocidade do vento a 2 metros de altura ($\text{m s}^{-1}$)
- $(e_s - e_a)$: Déficit de pressão de saturação de vapor ($\text{kPa}$)

### 2.2 Método FAO-56 Hargreaves-Samani (Alternativa Fisiográfica)
Utilizado em caso de ausência de vento ou radiação solar incidente:
$$ET_0 = 0.0023 \cdot (T_{\text{med}} + 17.8) \cdot \sqrt{T_{\text{max}} - T_{\text{min}}} \cdot (R_a \cdot 0.408)$$
Onde $R_a$ (radiação extraterrestre) é calculado astronomicamente em função da latitude e dia do ano ($J$).

---

## 3. Topografia SRTM e Declividade Espacial por Horn

A declividade topográfica ($\theta$) é computada a partir de 5 nós da malha $3 \times 3$ com espaçamento de $\Delta \approx 33\text{ m}$ ($0.0003^\circ$):
$$\frac{\partial z}{\partial x} = \frac{Z_{\text{Leste}} - Z_{\text{Oeste}}}{2 \cdot d_x}, \quad \frac{\partial z}{\partial y} = \frac{Z_{\text{Norte}} - Z_{\text{Sul}}}{2 \cdot d_y}$$
$$\theta = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right) \times \frac{180}{\pi}$$
Caso a consulta de vizinhança falhe ou retorne apenas 1 ponto, a declividade é retornada como `None` e não arbitrada.

---

## 4. Diferenciação de Testes Realizados

1. **Testes de Integração Real com a Internet (`tests/test_live_integrations.py`):**
   - NASA POWER Point API: Consulta ativa, resposta HTTP 200, parâmetros T2M e PRECTOTCORR validados em tempo real.
   - Open-Elevation SRTM: Consulta de grade ativa, elevação de 1135m para Brasília/DF e declividade calculada.
   - IBGE Localidades: Resolução ativa do município de Montes Claros/MG (código 3143302).
2. **Testes Unitários e de Confiabilidade com Mocks (`tests/test_reliability_and_geo.py` e `test_scientific_validation.py`):**
   - Simulações de indisponibilidade severa de rede, corrupção de payload, falha no OPeNDAP, validação de limites geodésicos no WGS84, validação da equação Penman-Monteith e diferenciação de recomendações entre perfis de agricultores familiares e empresariais.
