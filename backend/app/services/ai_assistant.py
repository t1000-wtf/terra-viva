from typing import List, Dict, Any, Optional
from datetime import datetime

class AIAssistantService:
    """
    Assistente determinístico especializado em agricultura brasileira.
    
    Diretrizes éticas:
    - Nunca inventar medições ou dados da NASA.
    - Jamais prometer lucros milagrosos ou produtividade irreal.
    - Reconhecer incertezas e ressaltar que a ferramenta apoia a decisão, não substituindo agrônomo de campo.
    """

    @classmethod
    async def generate_response(
        cls,
        user_message: str,
        chat_history: List[Dict[str, str]],
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        sources = ["Motor de Recomendação TerraViva", "Embrapa", "NASA Earth Science Data", "IBGE"]

        reply = cls._generate_knowledge_response(user_message, context_data)
        return {
            "reply": reply,
            "context_sources": sources,
            "timestamp": datetime.utcnow()
        }

    @classmethod
    def _generate_knowledge_response(cls, message: str, context: Optional[Dict[str, Any]]) -> str:
        msg = message.lower()
        
        if "por que" in msg or "recomendada" in msg or "estratégia" in msg:
            return (
                "As estratégias de rotação do TerraViva são elaboradas cruzando três dimensões vitais: "
                "1) Ambiental (dados de chuva e umidade da NASA e tipo de solo); "
                "2) Social (sua disponibilidade de mão de obra e maquinário); e "
                "3) Econômica (custo por hectare e facilidade de venda da safra).\n\n"
                "A **Estratégia Sustentável** recupera o solo com fixação biológica de nitrogênio e palhada protetora. "
                "Já a **Estratégia Resiliente** protege sua colheita caso ocorra estiagem, priorizando espécies de raízes profundas como o sorgo e o milheto."
            )
        elif "chuva" in msg or "seca" in msg or "umidade" in msg:
            return (
                "Para avaliar a água na sua terra, monitoramos a precipitação diária e a umidade superficial do solo com satélites da NASA (GPM e SMAP). "
                "Quando os satélites detectam mais de 15 a 20 dias consecutivos sem chuva ou umidade do solo abaixo do padrão histórico, "
                "o sistema eleva o nível de alerta de seca e recomenda culturas com menor exigência hídrica e tolerância a veranicos."
            )
        elif "recuperação" in msg or "solo" in msg or "matéria orgânica" in msg:
            return (
                "Para recuperar a fertilidade e a vida biológica do solo, a Embrapa recomenda o uso de leguminosas (como Crotalária e Feijão) "
                "que possuem bactérias capazes de capturar o nitrogênio do ar e incorporá-lo na terra, reduzindo o gasto com adubo químico. "
                "Além disso, consórcios com gramíneas (como a Braquiária) produzem palhada espessa que preserva a umidade e bloqueia o surgimento de plantas daninhas."
            )
        elif "custo" in msg or "investimento" in msg or "renda" in msg:
            return (
                "A dimensão econômica do TerraViva avalia o investimento inicial necessário por hectare com base nos dados de custos médios da CONAB. "
                "Se o agricultor não possui acesso a crédito rural, o sistema prioriza culturas com menor custo de sementes e insumos externos, "
                "evitando comprometer a renda familiar com dívidas agrícolas arriscadas."
            )
        else:
            return (
                f"Olá! Estou acompanhando as condições da sua propriedade. Com base nos dados socioambientais e agrícolas analisados, "
                f"podemos explorar as melhores épocas de plantio, a escolha de culturas de cobertura para nutrir o solo ou formas de proteger sua lavoura contra a escassez de chuvas. "
                f"Como posso ajudar a apoiar suas decisões na próxima safra?"
            )
