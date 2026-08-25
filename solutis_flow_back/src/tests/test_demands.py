def test_create_and_get_demand(client):
    headers = {
        "x-authenticated-user-id": "10",
        "x-authenticated-user-email": "gestor@solutis.com.br",
        "x-authenticated-user-full-name": "Gestor Teste",
        "x-authenticated-user-group": "gestor",
    }

    payload = {
        "type": "COMPRAS",
        "title": "Aquisição de Notebooks",
        "description": "Compra de 5 laptops para equipe",
        "assignee_user_id": 12,
        "manager_user_id": 10,
        "observer_user_ids": [15, 20],
        "priority": "ALTA",
        "sla_limit_hours": 48,
        "time_estimated_hours": 4.0,
    }

    response = client.post("/api/v1/demands", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Aquisição de Notebooks"
    assert data["status"] == "PENDENTE"
    assert data["solicitor_user_id"] == 10
    assert 15 in data["observer_user_ids"]
    demand_id = data["id"]

    # Test list demands
    list_resp = client.get("/api/v1/demands", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # Test get demand
    get_resp = client.get(f"/api/v1/demands/{demand_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == demand_id


def test_strict_conclusao_evidence_validation(client):
    headers = {
        "x-authenticated-user-id": "10",
        "x-authenticated-user-email": "gestor@solutis.com.br",
        "x-authenticated-user-full-name": "Gestor Teste",
        "x-authenticated-user-group": "gestor",
    }

    payload = {
        "type": "REEMBOLSO",
        "title": "Reembolso Almoço",
        "manager_user_id": 10,
    }

    create_resp = client.post("/api/v1/demands", json=payload, headers=headers)
    demand_id = create_resp.json()["id"]

    # 1. Update to EM_ANDAMENTO (Should succeed without evidence)
    patch_em_andamento = client.patch(
        f"/api/v1/demands/{demand_id}/status",
        json={"status": "EM_ANDAMENTO"},
        headers=headers,
    )
    assert patch_em_andamento.status_code == 200
    assert patch_em_andamento.json()["status"] == "EM_ANDAMENTO"

    # 2. Update to CONCLUIDO WITHOUT evidence (MUST FAIL with 400 Bad Request)
    patch_concluido_fail = client.patch(
        f"/api/v1/demands/{demand_id}/status",
        json={"status": "CONCLUIDO"},
        headers=headers,
    )
    assert patch_concluido_fail.status_code == 400
    assert "exige obrigatoriamente uma descrição de evidência" in patch_concluido_fail.json()["detail"]

    # 3. Update to CONCLUIDO WITH evidence (MUST SUCCEED with 200 OK)
    patch_concluido_success = client.patch(
        f"/api/v1/demands/{demand_id}/status",
        json={
            "status": "CONCLUIDO",
            "evidence_description": "Nota fiscal anexa em PDF e foto do comprovante",
        },
        headers=headers,
    )
    assert patch_concluido_success.status_code == 200
    assert patch_concluido_success.json()["status"] == "CONCLUIDO"
    assert patch_concluido_success.json()["evidence_description"] == "Nota fiscal anexa em PDF e foto do comprovante"


def test_transfer_and_feedback(client):
    headers = {
        "x-authenticated-user-id": "10",
        "x-authenticated-user-email": "gestor@solutis.com.br",
        "x-authenticated-user-full-name": "Gestor Teste",
        "x-authenticated-user-group": "gestor",
    }

    payload = {"type": "ESG", "title": "Relatório Anual ESG", "manager_user_id": 10}
    create_resp = client.post("/api/v1/demands", json=payload, headers=headers)
    demand_id = create_resp.json()["id"]

    # Transfer request
    transfer_resp = client.post(
        f"/api/v1/demands/{demand_id}/transfer",
        json={"target_assignee_user_id": 99, "justification": "Transferência devido a licença médica"},
        headers=headers,
    )
    assert transfer_resp.status_code == 201

    # Feedback submission
    fb_resp = client.post(
        f"/api/v1/demands/{demand_id}/feedback",
        json={"rating": 5, "comment": "Excelente execução!", "is_negative": False},
        headers=headers,
    )
    assert fb_resp.status_code == 201
