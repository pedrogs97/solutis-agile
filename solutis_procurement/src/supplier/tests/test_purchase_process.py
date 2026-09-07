"""
Tests for Purchase Process (FO-AD-01) model and API endpoints.
"""

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from src.supplier.models.purchase_process import PurchaseProcess


def _auth_client() -> APIClient:
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION="Bearer test-token",
        HTTP_X_AUTHENTICATED_USER_ID="1",
        HTTP_X_AUTHENTICATED_USER_EMAIL="compras@solutis.com.br",
        HTTP_X_AUTHENTICATED_USER_FULL_NAME="Comprador Solutis",
        HTTP_X_AUTHENTICATED_USER_GROUP="Compras",
    )
    return client


@pytest.fixture
def sample_purchase_process_data():
    return {
        "schemaVersion": 1,
        "identificacao": {
            "data": "2026-09-06",
            "categoria": "Normal",
            "modalidade": "Produto",
            "centroCusto": "1000 - TI",
            "objeto": "Aquisição de Notebooks para Desenvolvimento",
            "tipoContratacao": "Compra nova",
            "risco": "Baixo",
            "solicitante": "TI Infraestrutura",
            "compradorResponsavel": "Ana Ribeiro",
        },
        "fornecedores": [
            {
                "id": "f_1",
                "nome": "Fornecedor Alfa",
                "cnpj": "12345678000199",
                "desconto": 200.0,
                "impostos": 80.0,
                "frete": 50.0,
                "outros": 0.0,
                "valorBrutoManual": None,
                "orcado": 5000.0,
                "condPagamento": "30 dias",
                "prazoEntrega": "5 dias",
                "validadeProposta": "15 dias",
                "garantia": "12 meses",
                "obs": "Proposta padrão",
            },
            {
                "id": "f_2",
                "nome": "Fornecedor Beta",
                "cnpj": "98765432000188",
                "desconto": 0.0,
                "impostos": 100.0,
                "frete": 80.0,
                "outros": 20.0,
                "valorBrutoManual": None,
                "orcado": 5200.0,
                "condPagamento": "30/60 dias",
                "prazoEntrega": "10 dias",
                "validadeProposta": "15 dias",
                "garantia": "12 meses",
                "obs": "Proposta alternativa",
            },
        ],
        "itens": [
            {
                "id": "it_1",
                "descricao": "Notebook i7 16GB",
                "qtd": 2,
                "unidade": "UN",
                "precos": {"f_1": 2000.0, "f_2": 2200.0},
            },
            {
                "id": "it_2",
                "descricao": "Monitor 27 pol",
                "qtd": 2,
                "unidade": "UN",
                "precos": {"f_1": 500.0, "f_2": 600.0},
            },
        ],
        "decisao": {
            "fornecedorRecomendadoId": "f_1",
            "minimoAtingido": "sim",
            "motivoKey": "",
            "justificativa": "",
            "recomendacao": "Recomendado Fornecedor Alfa por menor CTA.",
            "observacoes": "Tudo conforme.",
        },
        "aprovacao": {
            "status": "Pendente",
            "aprovadoPor": "",
            "dataDecisao": "",
            "comentario": "",
        },
        "avaliacao": {
            "preenchida": True,
            "razaoSocial": "Fornecedor Alfa",
            "cnpj": "12345678000199",
            "descritivoCompra": "Aquisição de Notebooks",
            "nfNumero": "12345",
            "dataCompra": "2026-09-06",
            "criterios": {
                "qualidade": {"status": "Sim", "nivel": "Muito Satisfeito"},
                "prazo": {"status": "Sim", "nivel": "Muito Satisfeito"},
                "pagamento": {"status": "Sim", "nivel": "Satisfeito"},
                "custo": {"status": "Sim", "nivel": "Satisfeito"},
                "atendimento": {"status": "Sim", "nivel": "Muito Satisfeito"},
                "logistica": {"status": "Sim", "nivel": "Satisfeito"},
            },
            "avaliador": "Ana Ribeiro",
            "dataAvaliacao": "2026-09-06",
        },
    }


@pytest.mark.django_db
def test_purchase_process_domain_calculations(sample_purchase_process_data):
    proc = PurchaseProcess(
        identification=sample_purchase_process_data["identificacao"],
        suppliers=sample_purchase_process_data["fornecedores"],
        items=sample_purchase_process_data["itens"],
        decision=sample_purchase_process_data["decisao"],
        approval=sample_purchase_process_data["aprovacao"],
        evaluation=sample_purchase_process_data["avaliacao"],
    )
    proc.save()

    # Gross calculations:
    # f_1: (2 * 2000) + (2 * 500) = 4000 + 1000 = 5000
    # CTA f_1: 5000 - 200 + 80 + 50 + 0 = 4930
    # f_2: (2 * 2200) + (2 * 600) = 4400 + 1200 = 5600
    # CTA f_2: 5600 - 0 + 100 + 80 + 20 = 5800
    assert proc.get_auto_gross_value("f_1") == 5000.0
    assert proc.get_auto_gross_value("f_2") == 5600.0
    assert proc.calculate_cta(proc.suppliers[0]) == 4930.0
    assert proc.calculate_cta(proc.suppliers[1]) == 5800.0

    # Lowest and highest
    lowest = proc.get_lowest_cta_supplier()
    highest = proc.get_highest_cta_supplier()
    assert lowest["id"] == "f_1"
    assert highest["id"] == "f_2"

    # Savings: 5800 - 4930 = 870
    assert proc.get_estimated_savings() == 870.0
    assert proc.get_process_value() == 4930.0

    # Evaluation calculations:
    # Scores: 1.0, 1.0, 0.9, 0.9, 1.0, 0.9 = 5.7 / 6 = 0.95
    idx = proc.get_evaluation_index()
    assert idx == 0.95
    assert proc.get_performance_classification() == "Excelente"


@pytest.mark.django_db
def test_create_and_list_purchase_process_api(sample_purchase_process_data):
    client = _auth_client()

    # POST create
    res = client.post(
        "/api/v1/purchase-processes/",
        data=sample_purchase_process_data,
        format="json",
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    proc_id = data["id"]
    assert (
        data["identificacao"]["objeto"] == "Aquisição de Notebooks para Desenvolvimento"
    )
    assert data["computed"]["valorProcesso"] == 4930.0
    assert data["computed"]["economiaEstimada"] == 870.0
    assert data["computed"]["classificacaoDesempenho"] == "Excelente"

    # GET list
    list_res = client.get("/api/v1/purchase-processes/")
    assert list_res.status_code == status.HTTP_200_OK
    list_data = list_res.json()
    assert list_data["count"] == 1
    assert list_data["items"][0]["id"] == proc_id
    assert list_data["items"][0]["valorProcesso"] == 4930.0

    # GET detail
    detail_res = client.get(f"/api/v1/purchase-processes/{proc_id}/")
    assert detail_res.status_code == status.HTTP_200_OK
    assert detail_res.json()["id"] == proc_id


@pytest.mark.django_db
def test_decision_and_metrics_api(sample_purchase_process_data):
    client = _auth_client()

    # Create process
    res = client.post(
        "/api/v1/purchase-processes/",
        data=sample_purchase_process_data,
        format="json",
    )
    proc_id = res.json()["id"]

    # Decision approval POST
    dec_res = client.post(
        f"/api/v1/purchase-processes/{proc_id}/decision/",
        data={
            "status": "Aprovado",
            "aprovadoPor": "Diretor Solutis",
            "comentario": "Aprovado conforme menor CTA.",
        },
        format="json",
    )
    assert dec_res.status_code == status.HTTP_200_OK
    assert dec_res.json()["aprovacao"]["status"] == "Aprovado"
    assert dec_res.json()["aprovacao"]["aprovadoPor"] == "Diretor Solutis"

    # Metrics endpoint
    metrics_res = client.get("/api/v1/purchase-processes/metrics/")
    assert metrics_res.status_code == status.HTTP_200_OK
    metrics = metrics_res.json()
    assert metrics["totalProcessos"] == 1
    assert metrics["valorTotalAprovado"] == 4930.0
    assert metrics["economiaIdentificada"] == 870.0
    assert len(metrics["statusDistribution"]) >= 1
    assert len(metrics["supplierEvaluationDistribution"]) >= 1


@pytest.mark.django_db
def test_delete_purchase_process_api(sample_purchase_process_data):
    client = _auth_client()

    res = client.post(
        "/api/v1/purchase-processes/",
        data=sample_purchase_process_data,
        format="json",
    )
    proc_id = res.json()["id"]

    del_res = client.delete(f"/api/v1/purchase-processes/{proc_id}/")
    assert del_res.status_code == status.HTTP_200_OK
    assert del_res.json()["ok"] is True

    get_res = client.get(f"/api/v1/purchase-processes/{proc_id}/")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND
