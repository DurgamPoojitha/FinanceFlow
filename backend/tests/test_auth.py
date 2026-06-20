"""
Tests – Authentication Endpoints.

Covers: register, login, token validation, RBAC enforcement.
"""

import pytest


class TestRegister:
    def test_register_new_user(self, client):
        """POST /api/auth/register creates a new viewer account."""
        resp = client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "password": "password123",
            "role": "viewer",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@test.com"
        assert data["role"] == "viewer"
        assert "id" in data

    def test_register_duplicate_email_returns_409(self, client):
        """Registering with an existing email returns 409 Conflict."""
        resp = client.post("/api/auth/register", json={
            "email": "admin@test.com",  # Already seeded in conftest
            "password": "password123",
            "role": "viewer",
        })
        assert resp.status_code == 409

    def test_register_invalid_role_returns_400(self, client):
        """Registering with an invalid role returns 400."""
        resp = client.post("/api/auth/register", json={
            "email": "bad@test.com",
            "password": "password123",
            "role": "superadmin",
        })
        assert resp.status_code == 400


class TestLogin:
    def test_login_admin_returns_token(self, client):
        """POST /api/auth/login with valid credentials returns a JWT."""
        resp = client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == "admin"
        assert data["email"] == "admin@test.com"

    def test_login_wrong_password_returns_401(self, client):
        """Wrong password returns 401 (not 404 — prevents user enumeration)."""
        resp = client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_unknown_email_returns_401(self, client):
        """Unknown email returns 401 (deliberately vague)."""
        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "password123",
        })
        assert resp.status_code == 401

    def test_login_viewer_returns_viewer_role(self, client, viewer_token):
        """Viewer login returns role='viewer' in token response."""
        resp = client.post("/api/auth/login", json={
            "email": "viewer@test.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"


class TestGetMe:
    def test_get_me_with_valid_token(self, client, admin_token):
        """GET /api/auth/me returns the current user's profile."""
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "admin"

    def test_get_me_without_token_returns_401(self, client):
        """GET /api/auth/me without token returns 401."""
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_get_me_with_invalid_token_returns_401(self, client):
        """GET /api/auth/me with a garbage token returns 401."""
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.valid.jwt"})
        assert resp.status_code == 401
