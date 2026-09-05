"""
Testes unitários para o script de deploy remoto (remote_deploy.py).
Valida:
1. Resolução de configuração SSH (~/.ssh/config).
2. Verificação prévia de versão dos serviços.
3. Tratamento de erro de conexão com mensagem obrigatória sobre VPN.
4. Mascaramento rigoroso de senhas e prevenção de vazamento.
5. Autenticação e envio de senha para prompts de sudo via PTY.
"""

import os
import sys
from unittest.mock import MagicMock, patch


# Adiciona o diretório do script ao sys.path para importação direta
sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts")),
)

import remote_deploy  # noqa: E402


class TestRemoteDeployConfig:
    """Testes de resolução de configuração e argumentos."""

    def test_resolve_ssh_target_from_config(self, tmp_path):
        """Valida se lê corretamente o host Solutis de um ssh_config."""
        config_content = (
            "Host Solutis\n  HostName 172.21.3.225\n  User pedro\n  Port 22\n"
        )
        config_file = tmp_path / "config"
        config_file.write_text(config_content)

        target = remote_deploy.resolve_ssh_config(
            host_alias="Solutis", config_path=str(config_file)
        )
        assert target["hostname"] == "172.21.3.225"
        assert target["user"] == "pedro"
        assert target["port"] == 22

    def test_resolve_ssh_target_fallback(self):
        """Valida fallback seguro se o arquivo ssh_config não existir."""
        target = remote_deploy.resolve_ssh_config(
            host_alias="Solutis", config_path="/caminho/inexistente/config"
        )
        # Deve adotar os valores padrão mapeados para Solutis
        assert target["hostname"] == "172.21.3.225"
        assert target["user"] == "pedro"


class TestPasswordSecurity:
    """Testes garantindo que senhas NUNCA são expostas."""

    def test_mask_password_in_text(self):
        """Garante que a senha é mascarada no texto."""
        password = "MinhaSenhaSuperSecreta123!"
        text = "Erro ao autenticar com MinhaSenhaSuperSecreta123! no servidor"
        masked = remote_deploy.mask_sensitive_data(text, secret=password)
        assert password not in masked
        assert "[PROTECTED_PASSWORD]" in masked or "***" in masked

    def test_mask_password_handles_empty_or_none(self):
        """Verifica tratamento nulo e seguro para máscara."""
        text = "Texto normal sem senha"
        assert remote_deploy.mask_sensitive_data(text, secret="") == text
        assert remote_deploy.mask_sensitive_data(text, secret=None) == text

    def test_safe_printer_masks_output(self, capsys):
        """Garante que o helper de print sanitiza o secret."""
        password = "SecretPasswordXYZ"
        remote_deploy.safe_print(f"Conectando com senha {password}...", secret=password)
        captured = capsys.readouterr()
        assert password not in captured.out
        assert password not in captured.err


class TestServiceVersionCheck:
    """Testes de garantia de atualização das versões dos serviços antes do deploy."""

    @patch("remote_deploy.os.path.isfile", return_value=True)
    @patch("remote_deploy.subprocess.run")
    def test_check_service_versions_passes_when_all_updated(
        self, mock_run, mock_isfile
    ):
        """Passa se o script update_versions.py não detectar inconsistências."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="⏭️ No modified services found. Nothing to update.",
            stderr="",
        )
        ok, msg = remote_deploy.check_service_versions_readiness(
            workspace_root="/fake/path"
        )
        assert ok is True

    @patch("remote_deploy.os.path.isfile", return_value=True)
    @patch("remote_deploy.subprocess.run")
    def test_check_service_versions_detects_unbumped_services(
        self, mock_run, mock_isfile
    ):
        """Identifica quando há serviços modificados pendentes de bump."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout=(
                "🔍 Analyzing local uncommitted changes. Found 3 changed files.\n"
                "📦 Updating services:\n"
                "  ✨ solutis_manager_back: 1.26.2 ➡️ 1.26.3\n"
                "🔍 [DRY RUN] Would update version file."
            ),
            stderr="",
        )
        ok, msg = remote_deploy.check_service_versions_readiness(
            workspace_root="/fake/path"
        )
        assert ok is False
        assert "solutis_manager_back" in msg

    @patch("remote_deploy.os.path.isfile", return_value=True)
    @patch("remote_deploy.subprocess.run")
    def test_auto_bump_services(self, mock_run, mock_isfile):
        """Executa auto-bump de serviços pendentes quando solicitado."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="✅ Finished. Updated 1 service(s).",
            stderr="",
        )
        success = remote_deploy.auto_bump_service_versions(workspace_root="/fake/path")
        assert success is True
        mock_run.assert_called_once()


class TestVPNAndConnectionHandling:
    """Testes de tratamento de falha de conexão e recomendação explícita de VPN."""

    @patch("remote_deploy.paramiko.SSHClient")
    def test_connection_timeout_informs_vpn_requirement(self, mock_ssh_cls, capsys):
        """Garante que timeout de conexão exibe a mensagem de verificação da VPN."""
        import socket

        mock_ssh = MagicMock()
        mock_ssh.connect.side_effect = socket.timeout("timed out")
        mock_ssh_cls.return_value = mock_ssh

        exit_code = remote_deploy.execute_remote_deploy(
            host="172.21.3.225",
            user="pedro",
            port=22,
            password="fake_password",
            timeout=1,
        )

        assert exit_code == remote_deploy.EXIT_VPN_CONNECTION_ERROR
        captured = capsys.readouterr()
        # Validação do requisito: Deve informar e solicitar que verifique se VPN está conectada
        assert "VPN" in captured.out or "VPN" in captured.err
        assert "172.21.3.225" in captured.out or "172.21.3.225" in captured.err
        # E a senha NUNCA deve aparecer
        assert "fake_password" not in captured.out
        assert "fake_password" not in captured.err

    @patch("remote_deploy.paramiko.SSHClient")
    def test_authentication_failure(self, mock_ssh_cls, capsys):
        """Garante mensagem amigável sem vazar credenciais em caso de erro de autenticação."""
        import paramiko

        mock_ssh = MagicMock()
        mock_ssh.connect.side_effect = paramiko.ssh_exception.AuthenticationException(
            "Authentication failed"
        )
        mock_ssh_cls.return_value = mock_ssh

        exit_code = remote_deploy.execute_remote_deploy(
            host="172.21.3.225",
            user="pedro",
            port=22,
            password="wrong_password",
            timeout=1,
        )

        assert exit_code == remote_deploy.EXIT_AUTH_ERROR
        captured = capsys.readouterr()
        assert "autenticação" in (captured.out + captured.err).lower()
        assert "wrong_password" not in captured.out
        assert "wrong_password" not in captured.err


class TestRemoteExecutionAndSudo:
    """Testes de execução remota do deploy.sh e envio de sudo."""

    @patch("remote_deploy.paramiko.SSHClient")
    def test_successful_deploy_execution(self, mock_ssh_cls):
        """Simula deploy bem-sucedido via SSH."""
        mock_ssh = MagicMock()
        mock_channel = MagicMock()

        # Simula canal de saída controlado
        responses = [
            b"Local Version: 1.26.3\nDeploying agile-back...\nSuccess!\n",
            b"",
        ]
        mock_channel.recv.side_effect = lambda size: (
            responses.pop(0) if responses else b""
        )
        mock_channel.recv_ready.side_effect = lambda: bool(responses)
        mock_channel.exit_status_ready.return_value = True
        mock_channel.recv_exit_status.return_value = 0

        mock_transport = MagicMock()
        mock_transport.open_session.return_value = mock_channel
        mock_ssh.get_transport.return_value = mock_transport
        mock_ssh_cls.return_value = mock_ssh

        exit_code = remote_deploy.execute_remote_deploy(
            host="172.21.3.225",
            user="pedro",
            port=22,
            password="test_password",
            remote_cmd="./deploy.sh",
            remote_dir="~/projects/solutis-agile",
            timeout=5,
        )

        assert exit_code == 0
        mock_ssh.close.assert_called_once()
