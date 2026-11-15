FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Instalar dependências de sistema para GDAL/GEOS e bibliotecas matemáticas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv para gerenciar dependências com máxima velocidade
RUN pip install uv

COPY pyproject.toml README.md ./
RUN uv pip install --system -e .

COPY app/ ./app/
COPY seeds/ ./seeds/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
