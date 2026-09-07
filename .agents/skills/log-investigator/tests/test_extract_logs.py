"""
Testes unitários automatizados para o script de investigação de logs (extract_logs.py).

Valida:
1. Parsing de logs em múltiplos formatos (Loguru, Uvicorn, ISO/Brackets).
2. Agrupamento de blocos de Traceback multilinhas sem truncamento.
3. Filtragem por severidade, erros e busca textual (regex/grep).
4. Agrupamento e cálculo do resumo analítico de erros.
5. Mascaramento estrito de senhas sensíveis.
6. Resolução de SSH config e diagnóstico de VPN no ambiente remoto.
7. Extração de containers locais com mock de subprocess.
8. Extração remota via SSH com mock de paramiko.
"""

import json
import os
from pathlib import Path
import socket
import sys
from unittest.mock import MagicMock, patch

# Adiciona o diretório de scripts ao path para importação
sys.path.insert(
    0,
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scripts")),
)

try:
    import extract_logs  # type: ignore # noqa: E402
except ImportError:
    from ..scripts import extract_logs  # type: ignore # noqa: E402


class TestLogParsing:
    """Testes de análise e parsing de linhas e blocos de logs."""

    def test_parse_loguru_format(self):
        """Valida parse de linha padrão do Loguru."""
        line = "2026-07-29 18:30:19 | WARNING | src.auth.service:create_permissions:708 | Could not create permissions."
        parsed = extract_logs.parse_log_line(line)
        assert parsed["timestamp"] == "2026-07-29 18:30:19"
        assert parsed["level"] == "WARNING"
        assert parsed["severity"] == 30
        assert parsed["source"] == "src.auth.service:create_permissions:708"
        assert "Could not create permissions." in parsed["message"]

    def test_parse_uvicorn_format(self):
        """Valida parse de logs de acesso/servidor Uvicorn."""
        line = 'INFO:     127.0.0.1:45322 - "GET /api/v1/auth/login/ HTTP/1.1" 200 OK'
        parsed = extract_logs.parse_log_line(line)
        assert parsed["level"] == "INFO"
        assert parsed["severity"] == 20
        assert "GET /api/v1/auth/login/" in parsed["message"]

    def test_parse_bracket_iso_format(self):
        """Valida parse de logs no formato ISO com colchetes."""
        line = "[2026-09-07 12:00:00] [ERROR] Falha de conexao com banco"
        parsed = extract_logs.parse_log_line(line)
        assert parsed["timestamp"] == "2026-09-07 12:00:00"
        assert parsed["level"] == "ERROR"
        assert parsed["severity"] == 40
        assert "Falha de conexao" in parsed["message"]

    def test_parse_unstructured_fallback(self):
        """Valida detecção de nível mesmo sem padrão rígido."""
        line = "Unexpected critical failure while processing transaction"
        parsed = extract_logs.parse_log_line(line)
        assert parsed["level"] == "CRITICAL"
        assert parsed["severity"] == 50

    def test_multiline_traceback_grouping(self):
        """Valida que blocos de Traceback não são fragmentados em múltiplos eventos."""
        lines = [
            "2026-09-07 10:00:00 | ERROR | src.main:app:50 | Internal server error",
            "Traceback (most recent call last):",
            '  File "src/main.py", line 45, in test',
            "    raise ValueError('Valor invalido')",
            "ValueError: Valor invalido",
            "2026-09-07 10:00:05 | INFO | src.main:app:60 | Server running",
        ]

        entries = extract_logs.parse_log_entries(lines)
        assert len(entries) == 2

        error_entry = entries[0]
        assert error_entry["level"] == "ERROR"
        assert len(error_entry["traceback"]) >= 4
        assert "ValueError: Valor invalido" in error_entry["raw"]

        info_entry = entries[1]
        assert info_entry["level"] == "INFO"
        assert len(info_entry["traceback"]) == 0


class TestLogFiltering:
    """Testes de filtros de eventos de log."""

    def test_filter_errors_only(self):
        """Valida exclusão de logs informativos no modo errors_only."""
        entries = [
            {"level": "INFO", "severity": 20, "raw": "Tudo ok", "traceback": []},
            {"level": "WARNING", "severity": 30, "raw": "Atencao", "traceback": []},
            {"level": "ERROR", "severity": 40, "raw": "Falha geral", "traceback": []},
            {"level": "CRITICAL", "severity": 50, "raw": "Parada total", "traceback": []},
        ]
        filtered = extract_logs.filter_entries(entries, errors_only=True)
        assert len(filtered) == 2
        assert filtered[0]["level"] == "ERROR"
        assert filtered[1]["level"] == "CRITICAL"

    def test_filter_by_search_query(self):
        """Valida busca textual insensível a maiúsculas/minúsculas."""
        entries = [
            {"level": "ERROR", "severity": 40, "raw": "Connection timeout in MySQL", "traceback": []},
            {"level": "ERROR", "severity": 40, "raw": "Invalid credentials in Azure SSO", "traceback": []},
        ]
        filtered = extract_logs.filter_entries(entries, search_query="mysql")
        assert len(filtered) == 1
        assert "MySQL" in filtered[0]["raw"]

    def test_filter_by_tail(self):
        """Valida limite máximo de linhas/eventos."""
        entries = [{"level": "INFO", "severity": 20, "raw": f"Linha {i}", "traceback": []} for i in range(20)]
        filtered = extract_logs.filter_entries(entries, tail=5)
        assert len(filtered) == 5
        assert filtered[-1]["raw"] == "Linha 19"


class TestErrorSummary:
    """Testes de geração de sumário analítico e diagnóstico."""

    def test_generate_error_summary(self):
        """Valida contadores, exceções mais frequentes e distribuição por serviço."""
        data = {
            "manager_back": {
                "files": {
                    "2026-09-07.log": [
                        {
                            "level": "ERROR",
                            "message": "DatabaseError: Can't connect to MySQL",
                            "timestamp": "2026-09-07 10:00:00",
                            "traceback": ["DatabaseError: Can't connect to MySQL"],
                        },
                        {
                            "level": "WARNING",
                            "message": "Retry connecting...",
                            "timestamp": "2026-09-07 10:00:05",
                            "traceback": [],
                        },
                    ]
                },
                "containers": {},
            },
            "procurement": {
                "files": {},
                "containers": {
                    "solutis-procurement-prod": [
                        {
                            "level": "ERROR",
                            "message": "OperationalError: Connection refused",
                            "timestamp": "2026-09-07 10:01:00",
                            "traceback": [],
                        }
                    ]
                },
            },
        }

        summary = extract_logs.generate_error_summary(data)
        assert summary["total_errors"] == 2
        assert summary["total_warnings"] == 1
        assert summary["by_service"]["manager_back"]["errors"] == 1
        assert summary["by_service"]["procurement"]["errors"] == 1
        assert "DatabaseError" in summary["top_exceptions"]
        assert "OperationalError" in summary["top_exceptions"]


class TestSecurityAndSSH:
    """Testes de segurança de credenciais e diagnóstico de rede/VPN."""

    def test_mask_password(self):
        """Garante que a senha nunca aparece em saídas."""
        secret = "SenhaSuperSecreta@987"
        text = "Falha ao autenticar com SenhaSuperSecreta@987 no host"
        masked = extract_logs.mask_sensitive_data(text, secret)
        assert secret not in masked
        assert "[PROTECTED_PASSWORD]" in masked

    def test_resolve_ssh_config(self, tmp_path):
        """Valida leitura de host alias no ssh config."""
        config_content = "Host Solutis\n  HostName 172.21.3.225\n  User pedro\n  Port 22\n"
        cfg_file = tmp_path / "config"
        cfg_file.write_text(config_content)

        target = extract_logs.resolve_ssh_config("Solutis", str(cfg_file))
        assert target["hostname"] == "172.21.3.225"
        assert target["user"] == "pedro"
        assert target["port"] == 22

    @patch("extract_logs.paramiko")
    def test_vpn_timeout_diagnosis(self, mock_paramiko):
        """Valida emissão de erro explicativo de VPN em caso de timeout de socket."""
        mock_client = MagicMock()
        mock_client.connect.side_effect = socket.timeout("timed out")
        mock_paramiko.SSHClient.return_value = mock_client

        try:
            extract_logs.extract_remote_logs_via_ssh(
                host="172.21.3.225",
                user="pedro",
                port=22,
                password="xyz",
                service_key="manager_back",
            )
            assert False, "Deveria lançar ConnectionError"
        except ConnectionError as exc:
            assert "VPN" in str(exc)
            assert "172.21.3.225" in str(exc)


class TestLocalExtraction:
    """Testes de leitura local de arquivos e containers."""

    def test_read_local_log_file(self, tmp_path):
        """Valida leitura de linhas de arquivo com tail."""
        log_file = tmp_path / "test.log"
        log_file.write_text("\n".join([f"linha {i}" for i in range(10)]))

        lines = extract_logs.read_file_lines(log_file, tail=3)
        assert len(lines) == 3
        assert lines[-1].strip() == "linha 9"

    @patch("extract_logs.subprocess.run")
    def test_extract_local_container_logs_success(self, mock_run):
        """Valida chamada do comando docker logs."""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout="2026-09-07 10:00:00 | INFO | app:run | Container OK\n",
        )

        lines = extract_logs.extract_local_container_logs("solutis-manager-back-prod", tail=50)
        assert len(lines) == 1
        assert "Container OK" in lines[0]


class TestFormatOutput:
    """Testes de formatação de relatório em texto e JSON."""

    def test_format_text_output(self):
        """Valida geração do relatório textual."""
        data = {
            "manager_back": {
                "files": {
                    "logs/2026-09-07.log": [
                        {
                            "level": "ERROR",
                            "timestamp": "2026-09-07 10:00:00",
                            "message": "Erro no banco",
                            "traceback": ["Erro no banco", "  File main.py"],
                        }
                    ]
                },
                "containers": {},
            }
        }
        summary = extract_logs.generate_error_summary(data)
        out = extract_logs.format_text_output(data, summary)
        assert "SOLUTIS AGILE - RELATÓRIO DE INVESTIGAÇÃO DE LOGS" in out
        assert "Total de Erros / Exceções: 1" in out
        assert "manager_back" in out
