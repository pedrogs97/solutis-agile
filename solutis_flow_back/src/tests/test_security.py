def test_unauthenticated_request_without_gateway_headers_returns_401(client):
    # Request without x-authenticated-user-id header MUST return 401 Unauthorized
    response = client.get("/api/v1/demands")
    assert response.status_code == 401
    assert "Header de autenticação do Gateway ausente" in response.json()["detail"]
