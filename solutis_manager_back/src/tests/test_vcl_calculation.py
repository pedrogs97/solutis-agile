"""
Testes unitários e de integração para o cálculo de Valor Contábil Líquido (VCL).
Conforme especificação de Beatriz Cunha (24/09/2026):
Casos 1 a 8 obrigatórios.
"""

from datetime import date
from decimal import Decimal

from src.asset_evaluation.vcl import calcular_vcl


def test_caso_1_notebook_hoje():
    # Caso 1: Notebook R$ 3.970,00, adquirido em 04/04/2019, 60 meses
    # Data de referência: 24/09/2026
    # Esperado: 60 meses, Depreciação acumulada R$ 3.970,00, VCL R$ 0,00
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 60
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("3970.00")
    assert res["vcl"] == Decimal("0.00")


def test_caso_2_mes_da_aquisicao():
    # Caso 2: Mês da aquisição (30/04/2019)
    # Esperado: 1 mês, Depreciação acumulada R$ 66,17, VCL R$ 3.903,83
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2019, 4, 30),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 1
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("66.17")
    assert res["vcl"] == Decimal("3903.83")


def test_caso_3_meio_da_vida_util():
    # Caso 3: Meio da vida útil (31/12/2021)
    # Esperado: 33 meses, Depreciação acumulada R$ 2.183,61, VCL R$ 1.786,39
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2021, 12, 31),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 33
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("2183.61")
    assert res["vcl"] == Decimal("1786.39")


def test_caso_4_penultimo_mes():
    # Caso 4: Penúltimo mês (29/02/2024)
    # Esperado: 59 meses, Depreciação acumulada R$ 3.904,03, VCL R$ 65,97
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2024, 2, 29),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 59
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("3904.03")
    assert res["vcl"] == Decimal("65.97")


def test_caso_5_ultimo_mes_ajuste_centavos():
    # Caso 5: Último mês com ajuste de centavos (31/03/2024)
    # Esperado: 60 meses, Depreciação acumulada R$ 3.970,00, VCL R$ 0,00
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2024, 3, 31),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 60
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("3970.00")
    assert res["vcl"] == Decimal("0.00")


def test_caso_6_baixado_em_15_06_2020():
    # Caso 6: Baixado em 15/06/2020, data ref 24/09/2026
    # Esperado: 15 meses, Depreciação acumulada R$ 992,55, VCL R$ 2.977,45
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2019, 4, 4),
        vida_util_meses=60,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal(0),
        data_baixa=date(2020, 6, 15),
    )
    assert res["meses"] == 15
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("992.55")
    assert res["vcl"] == Decimal("2977.45")


def test_caso_7_movel_com_residual():
    # Caso 7: Móvel de R$ 5.000,00, residual de R$ 500,00, 120 meses, adquirido em 10/01/2025
    # Data de referência: 24/09/2026
    # Esperado: 21 meses, Depreciação acumulada R$ 787,50, VCL R$ 4.212,50
    res = calcular_vcl(
        valor_aquisicao=Decimal("5000.00"),
        data_aquisicao=date(2025, 1, 10),
        vida_util_meses=120,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal("500.00"),
    )
    assert res["meses"] == 21
    assert res["depreciacao_mensal"] == Decimal("37.50")
    assert res["depreciacao_acumulada"] == Decimal("787.50")
    assert res["vcl"] == Decimal("4212.50")


def test_caso_8_aquisicao_apos_referencia():
    # Caso 8: Aquisição depois da data de referência (01/10/2026), ref 24/09/2026
    # Esperado: 0 meses, Depreciação acumulada R$ 0,00, VCL R$ 3.970,00
    res = calcular_vcl(
        valor_aquisicao=Decimal("3970.00"),
        data_aquisicao=date(2026, 10, 1),
        vida_util_meses=60,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 0
    assert res["depreciacao_mensal"] == Decimal("66.17")
    assert res["depreciacao_acumulada"] == Decimal("0.00")
    assert res["vcl"] == Decimal("3970.00")


def test_regra_terrenos_sem_depreciacao():
    # Terrenos: taxa 0, vida útil 0
    res = calcular_vcl(
        valor_aquisicao=Decimal("150000.00"),
        data_aquisicao=date(2015, 1, 1),
        vida_util_meses=0,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal(0),
    )
    assert res["meses"] == 0
    assert res["depreciacao_mensal"] == Decimal("0.00")
    assert res["depreciacao_acumulada"] == Decimal("0.00")
    assert res["vcl"] == Decimal("150000.00")


def test_vcl_nunca_menor_que_residual():
    # VCL nunca fica abaixo do valor residual
    res = calcular_vcl(
        valor_aquisicao=Decimal("1000.00"),
        data_aquisicao=date(2010, 1, 1),
        vida_util_meses=60,
        data_referencia=date(2026, 9, 24),
        valor_residual=Decimal("200.00"),
    )
    assert res["meses"] == 60
    assert res["depreciacao_acumulada"] == Decimal("800.00")
    assert res["vcl"] == Decimal("200.00")
