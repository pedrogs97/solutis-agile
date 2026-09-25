"""
Módulo de Cálculo do Valor Contábil Líquido (VCL).
Conforme especificação contábil (Beatriz Cunha - 24/09/2026).
Método de depreciação linear mensal com ajuste de centavos e limite de valor residual.
"""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, TypedDict


class VCLCalculationResult(TypedDict):
    depreciacao_mensal: Decimal
    meses: int
    depreciacao_acumulada: Decimal
    vcl: Decimal
    base_depreciavel: Decimal
    vida_util_meses: int
    is_out_of_scope: bool


CATEGORIAS_PADRAO_RECEITA_FEDERAL = [
    {
        "name": "Computadores e periféricos",
        "annual_rate": Decimal("20.00"),
        "useful_life_months": 60,
        "description": "Notebooks, desktops, servidores, monitores e periféricos de TI",
    },
    {
        "name": "Veículos",
        "annual_rate": Decimal("20.00"),
        "useful_life_months": 60,
        "description": "Veículos de transporte de carga e passageiros",
    },
    {
        "name": "Máquinas e equipamentos",
        "annual_rate": Decimal("10.00"),
        "useful_life_months": 120,
        "description": "Máquinas e aparelhos industriais e de suporte operacional",
    },
    {
        "name": "Móveis e utensílios",
        "annual_rate": Decimal("10.00"),
        "useful_life_months": 120,
        "description": "Mesas, cadeiras, armários e mobiliário corporativo",
    },
    {
        "name": "Instalações",
        "annual_rate": Decimal("10.00"),
        "useful_life_months": 120,
        "description": "Instalações elétricas, hidráulicas, divisórias e benfeitorias",
    },
    {
        "name": "Edificações",
        "annual_rate": Decimal("4.00"),
        "useful_life_months": 300,
        "description": "Prédios comerciais, galpões e construções",
    },
    {
        "name": "Terrenos",
        "annual_rate": Decimal("0.00"),
        "useful_life_months": 0,
        "description": "Bens imóveis e terrenos que não sofrem depreciação",
    },
]


def calcular_vcl(
    valor_aquisicao: Decimal | float | str,
    data_aquisicao: date,
    vida_util_meses: int,
    data_referencia: date | None = None,
    valor_residual: Decimal | float | str = Decimal(0),
    data_baixa: date | None = None,
) -> dict[str, Any]:
    """
    Calcula o Valor Contábil Líquido (VCL) de acordo com a regra contábil linear:
    - O mês de aquisição conta como mês cheio.
    - Se o bem foi baixado antes da data de referência, a depreciação cessa no mês da baixa.
    - Terrenos ou categorias com vida útil 0 têm depreciação 0.
    - No último mês de depreciação, a acumulada fecha exatamente na base depreciável (ajuste de centavos).
    - O valor contábil líquido nunca fica abaixo do valor residual.
    """
    if data_referencia is None:
        data_referencia = date.today()

    vaq = Decimal(str(valor_aquisicao)).quantize(Decimal("0.01"), ROUND_HALF_UP)
    vres = Decimal(str(valor_residual)).quantize(Decimal("0.01"), ROUND_HALF_UP)
    vres = max(vres, Decimal(0))

    # Bem baixado: deprecia só até o mês da baixa
    if data_baixa and data_baixa < data_referencia:
        data_referencia = data_baixa

    # Terreno ou categoria sem depreciação
    if vida_util_meses <= 0:
        return {
            "depreciacao_mensal": Decimal("0.00"),
            "meses": 0,
            "depreciacao_acumulada": Decimal("0.00"),
            "vcl": vaq,
            "base_depreciavel": Decimal("0.00"),
            "vida_util_meses": 0,
            "is_out_of_scope": False,
        }

    base = max(Decimal(0), vaq - vres)
    mensal = (base / Decimal(str(vida_util_meses))).quantize(
        Decimal("0.01"), ROUND_HALF_UP
    )

    # Meses decorridos: (ano_ref - ano_aq) * 12 + (mes_ref - mes_aq) + 1
    # O mês de aquisição conta como mês cheio. Se aquisição for após referência: meses = 0
    if (data_referencia.year, data_referencia.month) < (
        data_aquisicao.year,
        data_aquisicao.month,
    ):
        meses = 0
    else:
        meses = (
            (data_referencia.year - data_aquisicao.year) * 12
            + (data_referencia.month - data_aquisicao.month)
            + 1
        )

    meses = max(0, min(meses, vida_util_meses))

    # No último mês, fecha exatamente na base depreciável (ajuste de centavos)
    if meses == 0:
        acumulada = Decimal("0.00")
    elif meses == vida_util_meses:
        acumulada = base
    else:
        acumulada = (mensal * Decimal(str(meses))).quantize(
            Decimal("0.01"), ROUND_HALF_UP
        )

    vcl = max(vres, vaq - acumulada)
    is_out_of_scope = meses >= vida_util_meses

    return {
        "depreciacao_mensal": mensal,
        "meses": meses,
        "depreciacao_acumulada": acumulada,
        "vcl": vcl,
        "base_depreciavel": base,
        "vida_util_meses": vida_util_meses,
        "is_out_of_scope": is_out_of_scope,
    }
