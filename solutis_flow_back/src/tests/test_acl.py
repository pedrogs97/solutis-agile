def test_acl_assign_get_and_revoke_role(client):
    admin_headers = {
        "x-authenticated-user-id": "100",
        "x-authenticated-user-email": "admin@solutis.com.br",
        "x-authenticated-user-full-name": "Admin Flow",
        "x-authenticated-user-group": "admin",
    }

    # Assign GESTOR role to user 25
    payload = {
        "user_id": 25,
        "role": "GESTOR",
        "area_id": 1,
    }

    assign_resp = client.post("/api/v1/acl/roles", json=payload, headers=admin_headers)
    assert assign_resp.status_code == 201
    data = assign_resp.json()
    assert data["user_id"] == 25
    assert data["role"] == "GESTOR"
    mapping_id = data["id"]

    # Get roles for user 25
    get_resp = client.get("/api/v1/acl/roles/user/25", headers=admin_headers)
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1
    assert get_resp.json()[0]["role"] == "GESTOR"

    # Revoke role
    del_resp = client.delete(f"/api/v1/acl/roles/{mapping_id}", headers=admin_headers)
    assert del_resp.status_code == 204
