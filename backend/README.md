# TerraViva Backend

Plataforma de Inteligência Socioambiental e Agrícola que integra dados de observação da Terra (NASA, INMET, MapBiomas), indicadores socioeconômicos (IBGE, AtlasBrasil) e conhecimento agronômico (Embrapa) para recomendações inteligentes de rotação de culturas.


http://127.0.0.1:8000/api/v1/docs com esse link voce consegue acessar a documentação com todas as rotas da api

python -m ensurepip --upgrade

python -m pip install --upgrade pip

 python -m pip install -e .

 python -m pytest -v

 uvicorn app.main:app --reload