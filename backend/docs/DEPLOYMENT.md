# TerraViva — Guia de Execução e Implantação

## 1. Requisitos do Sistema
- Python 3.11 ou superior
- Gerenciador de pacotes `uv` (ou `pip` padrão)

## 2. Instalação e Execução Local

```bash
# Navegar até o diretório do backend
cd backend

# Criar e ativar o ambiente virtual (com uv)
uv venv
.\.venv\Scripts\Activate.ps1   # No Windows PowerShell
# source .venv/bin/activate    # No Linux / macOS

# Instalar as dependências do projeto
uv pip install -e .

# Executar a suíte de testes de integração
pytest -v tests/test_full_platform.py

# Iniciar o servidor da API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API estará acessível em:
- **Documentação Swagger UI**: `http://localhost:8000/api/v1/docs`
- **Documentação Redoc**: `http://localhost:8000/api/v1/redoc`
- **Healthcheck**: `http://localhost:8000/health`

## 3. Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do diretório `backend` (ou utilize as variáveis padrão):

```env
PROJECT_NAME="TerraViva Backend"
DATABASE_URL="sqlite:///./terraviva.db"  # Em produção: postgresql+psycopg://user:pass@host:5432/terraviva
BACKEND_CORS_ORIGINS='["https://seu-frontend.example"]'
```

No Render, configure `DATABASE_URL` com a URL PostgreSQL interna e informe as origens reais do frontend em `BACKEND_CORS_ORIGINS`.

## 4. PostgreSQL e migrações

O backend usa `psycopg` e aceita URLs PostgreSQL `postgres://`, `postgresql://` ou `postgresql+psycopg://`. O pool valida conexões antes do uso, limita cada processo a cinco conexões persistentes e até cinco conexões excedentes, e aplica timeout de conexão de 10 segundos.

O schema existente do SQLite local foi inspecionado sem escrita: contém as 13 tabelas esperadas, mas faltam `crop_catalog.botanical_family` e `environmental_records.product`, `environmental_records.data_status` e `environmental_records.processing_method`. Os demais tipos, nulabilidade e relacionamentos inspecionados correspondem aos modelos. Registros existentes de `environmental_records` recebem `NULL` em campos de proveniência ainda não conhecidos; a migração não os classifica artificialmente como observados.

O startup não cria nem altera tabelas. Para um banco novo e vazio, aplique as migrações antes de iniciar a aplicação:

```sh
alembic upgrade head
```

Para um banco legado existente, **não execute estes passos sem autorização, backup verificado e comparação do schema**. Confirme que ele corresponde integralmente à revisão-base `d3023bc0994e`; então registre essa base sem executar DDL e aplique apenas a revisão aditiva:

```sh
alembic stamp d3023bc0994e
alembic upgrade head
```

`alembic stamp` altera a tabela de controle `alembic_version`, mas não migra o schema. `alembic upgrade head` adiciona somente as quatro colunas ausentes e preserva as linhas existentes. Se qualquer tabela, coluna, tipo, índice ou chave estrangeira divergir da base, interrompa e prepare uma revisão específica antes de atualizar. Downgrade das revisões é bloqueado porque pode remover dados. Nenhuma migração foi executada no banco configurado nesta auditoria.

No Render, configure como **Release Command** `alembic upgrade head` somente após revisar e aprovar a migração e confirmar backup; use como **Start Command** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Não coloque a migração no comando de startup. Configure o health check como `/health`.

O teste PostgreSQL, sem escrita, pode ser executado contra um banco de teste já migrado:

```sh
# PowerShell
$env:TEST_POSTGRESQL_URL = $env:DATABASE_URL
pytest -q tests/test_postgresql_integration.py
```

`TEST_POSTGRESQL_URL` deve apontar para um PostgreSQL de teste cuja schema já esteja migrada. O teste nunca aplica migrações. Sem essa variável, o teste é pulado.

## 5. Docker e Implantação em Nuvem

Para gerar a imagem Docker para ambientes como Railway, Render ou AWS:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml README.md ./
COPY alembic.ini ./
COPY alembic/ ./alembic/
COPY app/ ./app/
COPY seeds/ ./seeds/

RUN uv pip install --system -e .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```
