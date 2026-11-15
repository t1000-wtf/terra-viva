# Documentação Completa da API do TerraViva

A API REST do TerraViva foi desenvolvida com **FastAPI**, **SQLAlchemy** e suporte a **GeoJSON** para processamento geoespacial e científico.

## Sumário de Módulos da API (v1)

### 1. Autenticação (`/api/v1/auth`)
- `POST /register`: Cadastro de usuários (Agricultores, Técnicos Agrícolas e Administradores). Cria automaticamente perfil de produtor e pesos iniciais.
- `POST /login`: Autenticação via JWT (OAuth2 Bearer Token) com verificação segura de senha via `bcrypt`.
- `GET /me`: Retorna dados do usuário autenticado no cabeçalho `Authorization: Bearer <token>`.

### 2. Usuários e Perfil do Produtor (`/api/v1/users`)
- `GET /profile`: Consulta perfil do usuário.
- `PUT /profile`: Atualização de dados cadastrais.
- `GET /farmer-profile`: Recupera indicadores socioagrícolas voluntários do agricultor (familiar vs empresarial, disponibilidade de mão de obra, maquinário, irrigação, crédito, assistência técnica).
- `PUT /farmer-profile`: Atualização dos indicadores voluntários do agricultor.

### 3. Propriedades Agrícolas (`/api/v1/properties`)
- `POST /`: Cadastro de propriedade com latitude, longitude, área total/cultivada, município/UF e delimitação em GeoJSON. Consulta automática da API do IBGE para relacionar código municipal.
- `GET /`: Listagem de propriedades do usuário autenticado.
- `GET /{id}`: Detalhes de uma propriedade específica.
- `PUT /{id}`: Atualização de dados cadastrais e espaciais.
- `DELETE /{id}`: Exclusão com cascata em conformidade com a LGPD.

### 4. Talhões (`/api/v1/properties/{property_id}/plots`)
- `POST /`: Criação de talhão com caracterização de solo (tipo, textura, pH, matéria orgânica, drenagem, declividade SRTM e cultura atual).
- `GET /`: Listagem de talhões da propriedade.
- `GET /{plot_id}`: Detalhes do talhão.
- `PUT /{plot_id}`: Atualização de características do talhão.
- `DELETE /{plot_id}`: Exclusão do talhão.

### 5. Catálogo Agronômico de Culturas (`/api/v1/crops`)
- `GET /`: Listagem e busca de espécies calibradas com base nos manuais da Embrapa (Milho, Soja, Feijão, Sorgo, Milheto, Crotalária, Braquiária, Girassol), com filtros por categoria e tolerância à seca.
- `GET /{id}`: Ficha técnica completa da cultura (ciclo, FBN, necessidade hídrica em mm, profundidade de raiz, custo referencial por hectare e liquidez).

### 6. Histórico Agrícola (`/api/v1/plots/{plot_id}/history`)
- `POST /`: Registro de safra/plantio anterior com produtividade obtida, custos e ocorrência de pragas.
- `GET /`: Linha do tempo histórica de safras do talhão.

### 7. Prioridades e Pesos Multicritério (`/api/v1/priorities`)
- `GET /`: Consulta os pesos definidos pelo agricultor para as 3 dimensões (Ambiental, Social e Econômica).
- `PUT /`: Atualização dos pesos (validação automática de que a soma deve ser exatamente 100%) e sub-prioridades (conservação de água, recuperação de solo, renda, etc).

### 8. Dimensão Ambiental e NASA (`/api/v1/environmental`)
- `POST /sync/{property_id}`: Sincronização em tempo real conectando às APIs da NASA:
  - **NASA POWER**: Temperatura (média, máx, min), radiação solar e precipitação diária.
  - **NASA SMAP**: Umidade volumétrica do solo (m³/m³) e anomalias hídricas.
  - **NASA Landsat/MODIS**: Séries temporais de NDVI e detecção de períodos de solo descoberto.
  - **NASA ECOSTRESS**: Evapotranspiração real/potencial (mm/dia).
  - **NASA SRTM**: Relevo, elevação e declividade para cálculo de risco de erosão.
- `GET /timeseries/{property_id}`: Série temporal histórica dos parâmetros agrometeorológicos.

### 9. Dimensão Social e Regional (`/api/v1/social`)
- `GET /diagnostics/{property_id}`: Cruzamento dos dados do agricultor com os dados oficiais do município (IBGE Censo Agropecuário e Atlas Brasil - IDHM, taxa de pobreza rural, dependência do PIB agropecuário).

### 10. Dimensão Econômica (`/api/v1/economic`)
- `GET /estimate`: Cálculo de investimento inicial, custo operacional estimado por hectare (referência CONAB) e liquidez regional de mercado.

### 11. Recomendações e Rotação de Culturas (`/api/v1/recommendations`)
- `POST /generate/{plot_id}`: Executa o algoritmo multicritério e gera 3 estratégias transparentes:
  - **Estratégia A**: Rotação Atual (Linha de base histórica do agricultor).
  - **Estratégia B**: Rotação Sustentável (FBN, culturas de cobertura, recuperação biológica do solo).
  - **Estratégia C**: Rotação Resiliente ao Clima (Tolerância a veranicos, raízes profundas, segurança hídrica).
  - Apresenta: Nota Ambiental (0-100), Nota Social (0-100), Nota Econômica (0-100), Nota Ponderada Geral (0-100), Riscos, Benefícios Potenciais, Limitações e Fontes Oficiais Citadas.
- `GET /plot/{plot_id}`: Consulta recomendações já salvas do talhão.

### 12. Diagnóstico Socioambiental Holístico (`/api/v1/diagnostics`)
- `GET /property/{property_id}`: Gera relatório integrado respondendo:
  - **O que a terra precisa?** (Conservação hídrica, matéria orgânica, proteção contra erosão).
  - **O que o agricultor precisa?** (Redução de custo inicial, manejo acessível, segurança alimentar).
  - **O que a região oferece?** (Radiação, histórico pluviométrico, mercados e cooperativas).
- `GET /alerts/{property_id}`: Consulta alertas automáticos de estiagem ou estresse vegetal emitidos com base nos satélites.

### 13. Assistente de Inteligência Artificial (`/api/v1/assistant`)
- `POST /chat`: Assistente explicativo contextualizado que traduz os indicadores científicos e recomendações em linguagem acessível ao agricultor brasileiro. Conecta ao Gemini (`gemini-2.5-flash`) ou executa o motor especialista agronômico de contingência integrado.
- `GET /history`: Histórico de interações com o assistente.

### 14. Fontes e Proveniência Científica (`/api/v1/sources`)
- `GET /`: Relação catalogada das instituições e produtos integrados (NASA POWER, SMAP, Landsat/MODIS, ECOSTRESS, SRTM, IBGE, Embrapa, CONAB).

### 15. Dashboard Unificado (`/api/v1/dashboard`)
- `GET /summary/{property_id}`: Endpoint otimizado com DTO compacto para alimentar interfaces Web e aplicativos Mobile com status da propriedade, talhões, KPIs ambientais, alertas e estratégias.
