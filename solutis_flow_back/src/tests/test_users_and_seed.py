from sqlmodel import Session
from src.seed import seed_database


def test_seed_and_list_users_and_metrics(client, session: Session):
    # Run seed
    seed_database(session)

    headers = {
        "x-authenticated-user-id": "1",
        "x-authenticated-user-email": "admin@solutis.com.br",
        "x-authenticated-user-full-name": "Admin",
        "x-authenticated-user-group": "admin",
    }

    # 1. Test GET /users
    users_resp = client.get("/api/v1/users", headers=headers)
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 5
    assert any(u["name"] == "Beatriz Mello (Gestor)" for u in users)

    # 2. Test GET /areas
    areas_resp = client.get("/api/v1/areas", headers=headers)
    assert areas_resp.status_code == 200
    assert len(areas_resp.json()) >= 7

    # 3. Test GET /cost-centers
    ccs_resp = client.get("/api/v1/cost-centers", headers=headers)
    assert ccs_resp.status_code == 200
    assert len(ccs_resp.json()) >= 5

    # 4. Test GET /dashboard/metrics
    metrics_resp = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert metrics["total_demands"] >= 6
    assert metrics["completed"] >= 2
