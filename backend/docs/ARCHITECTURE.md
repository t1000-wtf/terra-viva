# TerraViva — Arquitetura do Sistema e Decisões Técnicas

## 1. Visão Geral
O **TerraViva** é uma plataforma inovadora de inteligência socioambiental e agrícola concebida para transformar dados científicos complexos de observação da Terra (NASA, INMET, MapBiomas), indicadores socioeconômicos (IBGE, Atlas Brasil) e normas agroecológicas (Embrapa, CONAB) em recomendações práticas, individualizadas e acessíveis de rotação de culturas para agricultores brasileiros.

---

## 2. Decisões Técnicas e Justificativas

### 2.1 Linguagem: Python 3.11+
- **Justificativa**: Python oferece suporte ao ecossistema científico e de dados geoespaciais. Bibliotecas como `shapely`, `numpy` e conectores com APIs da NASA integram-se de forma nativa e de alta performance.

### 2.2 Framework Web: FastAPI (Asíncrono)
- **Justificativa**: 
  - Alto desempenho em I/O assíncrono para chamadas paralelas às APIs externas da NASA (POWER, SMAP) e IBGE.
  - Geração nativa e automática de documentação interativa OpenAPI/Swagger e schemas JSON (`/api/v1/docs`).
  - Validação estrita e tipagem estática com Pydantic v2.

### 2.3 Banco de Dados: SQLite / PostgreSQL com Suporte Espacial (GeoJSON & PostGIS Ready)
- **Justificativa**:
  - Para desenvolvimento local e testes imediatos: SQLite leve com StaticPool.
  - O modelo suporta delimitações poligonais GeoJSON nativas e campos de coordenadas padronizados (EPSG:4326 - WGS84).
  - SQLAlchemy 2.0 ORM permite transição transparente para PostgreSQL + PostGIS em ambiente de produção na nuvem sem alteração de código de domínio.

### 2.4 Arquitetura: Monólito Modular Limpo (Clean Modular Monolith)
- **Camadas**:
  - `core/`: Banco de dados e configurações. As rotas da plataforma são públicas; vínculos opcionais de usuário são mantidos para compatibilidade com dados legados.
  - `models/`: Entidades relacionais de domínio (Propriedades, Talhões, Culturas, Registros Ambientais, Indicadores Sociais, etc).
  - `schemas/`: DTOs de entrada e saída validados por Pydantic.
  - `adapters/`: Conectores isolados para serviços externos (NASA POWER, SMAP, Landsat/MODIS, ECOSTRESS, SRTM, IBGE, INMET).
  - `engine/`: Motores de cálculo científico puro (Ambiental, Social, Econômico, Multicritério e Explicabilidade).
  - `services/`: Serviços orquestradores, incluindo o assistente agronômico determinístico.
  - `api/v1/`: Controladores REST desacoplados por recurso.

---

## 3. As Três Dimensões e o Algoritmo Multicritério

Nenhuma dimensão é analisada de forma isolada:
$$\text{Pontuação Final} = \frac{(\text{Score}_{\text{Ambiental}} \times W_{\text{amb}}) + (\text{Score}_{\text{Social}} \times W_{\text{soc}}) + (\text{Score}_{\text{Econômico}} \times W_{\text{econ}})}{100}$$

Onde $W_{\text{amb}} + W_{\text{soc}} + W_{\text{econ}} = 100\%$ (configurável pelo próprio agricultor).

### Estratégias Comparadas:
1. **Estratégia A (Atual / Linha de Base)**: Registra o manejo histórico para mensurar os ganhos da transição ecológica.
2. **Estratégia B (Sustentável / Solo Vivo)**: Prioriza leguminosas com Fixação Biológica de Nitrogênio (FBN), descompactação do solo por raízes profundas e formação de palhada protetora contra insolação tropical.
3. **Estratégia C (Resiliente ao Clima / Segurança Hídrica)**: Prioriza culturas rústicas de alta tolerância à seca (Sorgo, Milheto, Girassol), assegurando safra em caso de veranicos e escassez de chuva.

---

## 4. Integração com Satélites da NASA e Fontes Oficiais

| Satélite / Fonte | Produto Utilizado | Finalidade no TerraViva |
|---|---|---|
| **NASA POWER** | Daily Point Agroclimatology (T2M, Tmax, Precip, Radiação) | Séries agrometeorológicas diárias e histórico térmico |
| **NASA SMAP** | L3 Radiometer Soil Moisture (SPL3SMP) | Umidade superficial do solo (0-5cm) e detecção de anomalias |
| **NASA Landsat 8/9 & MODIS** | Surface Reflectance / NDVI | Acompanhamento do vigor da biomassa e detecção de períodos de solo exposto |
| **NASA ECOSTRESS** | PT-JPL Evapotranspiration (ISS) | Taxa diária de evapotranspiração e estresse hídrico |
| **NASA SRTM** | V3 1 Arc-Second (30m) Global | Topografia, elevação e declividade para cálculo de risco de erosão |
| **IBGE** | API de Localidades & Censo Agropecuário | Cruzamento com realidade demográfica, rural e econômica municipal |
| **Embrapa** | Guias Técnicos Nacionais de Rotação | Parâmetros agronômicos oficiais (FBN, profundidade de raiz, época) |
| **CONAB** | Matrizes de Custos Agropecuários | Estimativas referenciais de custo por hectare e liquidez de mercado |

---

## 5. Assistente Agronômico e Explicabilidade
O assistente utiliza respostas determinísticas baseadas em regras de conhecimento agronômico integradas ao backend. Não depende de um serviço externo de IA; diagnósticos e recomendações continuam sendo calculados por seus próprios módulos.
