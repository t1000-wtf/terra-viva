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
SECRET_KEY="sua-chave-secreta-jwt-de-producao-com-mais-de-32-caracteres"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL="sqlite:///./terraviva.db"  # Ou postgresql://user:pass@host:5432/terraviva
GEMINI_API_KEY=""  # Opcional: Chave da Google AI para o Assistente Gemini 2.5
```

## 4. Docker e Implantação em Nuvem

Para gerar a imagem Docker para ambientes como Railway, Render ou AWS:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml README.md ./
COPY app/ ./app/
COPY seeds/ ./seeds/

RUN uv pip install --system -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
