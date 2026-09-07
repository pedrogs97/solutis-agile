#!/usr/bin/env python3
"""
Tool de Extração e Investigação de Logs do Ecossistema Solutis Agile.

Permite extrair, filtrar, analisar e resumir logs de:
1. Pastas de logs locais e remotas de cada microsserviço (solutis_manager_back,
   solutis_procurement, solutis_report, solutis-sync, solutis_flow_back, etc.).
2. Containers Docker locais ou remotos (docker logs).
3. Servidor remoto Solutis (172.21.3.225) via SSH com suporte seguro a credenciais e diagnóstico de VPN.
"""

import argparse
import datetime
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys

try:
    import paramiko
except ImportError:
    paramiko = None


# Mapeamento oficial de serviços, pastas de logs e nomes de containers
SERVICES_MAP = {
    "manager_back": {
        "name": "Backend Manager Core",
        "dir": "solutis_manager_back",
        "log_folder": "solutis_manager_back/logs",
        "containers": ["solutis-manager-back-prod", "agile-back"],
        "default_port": 8080,
    },
    "procurement": {
        "name": "Procurement Service",
        "dir": "solutis_procurement",
        "log_folder": "solutis_procurement/logs",
        "containers": ["solutis-procurement-prod", "solutis-procurement"],
        "default_port": 8001,
    },
    "report": {
        "name": "Report Service v2",
        "dir": "solutis_report",
        "log_folder": "solutis_report/logs",
        "containers": ["solutis-report-prod", "solutis-report"],
        "default_port": 8002,
    },
    "sync": {
        "name": "Sync Service (TOTVS)",
        "dir": "solutis-sync",
        "log_folder": "solutis-sync/logs",
        "containers": ["solutis-sync-prod", "solutis-sync"],
        "default_port": 8003,
    },
    "flow_back": {
        "name": "Solutis Flow Backend",
        "dir": "solutis_flow_back",
        "log_folder": "solutis_flow_back/logs",
        "containers": ["solutis-flow-back", "solutis-flow-worker"],
        "default_port": 8004,
    },
    "frontend_agile": {
        "name": "Frontend Solutis Agile",
        "dir": "solutis-agile-frontend",
        "log_folder": None,
        "containers": ["solutis-agile-frontend-prod", "agile-front"],
        "default_port": 3000,
    },
    "frontend_flow": {
        "name": "Frontend Solutis Flow",
        "dir": "solutis-flow",
        "log_folder": None,
        "containers": ["solutis-flow"],
        "default_port": 3000,
    },
    "redis": {
        "name": "Redis Broker / Cache",
        "dir": None,
        "log_folder": None,
        "containers": ["redis"],
        "default_port": 6379,
    },
}

DEFAULT_SSH_HOST_ALIAS = "Solutis"
DEFAULT_HOST = "172.21.3.225"
DEFAULT_USER = "pedro"
DEFAULT_PORT = 22
DEFAULT_REMOTE_DIR = "~/solutis-agile"

EXIT_SUCCESS = 0
EXIT_GENERAL_ERROR = 1
EXIT_VPN_CONNECTION_ERROR = 2
EXIT_AUTH_ERROR = 3

LEVEL_SEVERITY = {
    "DEBUG": 10,
    "INFO": 20,
    "WARNING": 30,
    "WARN": 30,
    "ERROR": 40,
    "CRITICAL": 50,
    "FATAL": 50,
    "EXCEPTION": 50,
}

LOG_PATTERNS = [
    # Formato Loguru: 2026-07-29 18:30:19 | WARNING | src.auth.service:... | Message
    re.compile(
        r"^(?P<timestamp>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*\|\s*(?P<level>[A-Z]+)\s*\|\s*(?P<source>[^|]+)\s*\|\s*(?P<message>.*)$"
    ),
    # Formato Uvicorn: INFO:     127.0.0.1:45322 - "GET /api/v1/... HTTP/1.1" 200 OK
    re.compile(r"^(?P<level>[A-Z]+):\s+(?P<message>.*)$"),
    # Formato ISO / Bracket: [2026-07-29 18:30:19] [ERROR] message
    re.compile(
        r"^\[(?P<timestamp>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})\]\s*\[(?P<level>[A-Z]+)\]\s*(?P<message>.*)$"
    ),
]

TRACEBACK_START_PATTERNS = [
    re.compile(r"^Traceback \(most recent call last\):", re.IGNORECASE),
    re.compile(r"^[a-zA-Z0-9_.]*(?:Error|Exception|Fault|Warning):", re.IGNORECASE),
]


def mask_sensitive_data(text: str, secret: str | None) -> str:
    """Substitui qualquer ocorrência da senha por máscara de segurança."""
    if not text or not secret:
        return text
    return text.replace(secret, "[PROTECTED_PASSWORD]")


def safe_print(message: str, secret: str | None = None, file=None) -> None:
    """Imprime mensagem com mascaramento de dados sensíveis."""
    dest = file or sys.stdout
    masked_message = mask_sensitive_data(message, secret)
    print(masked_message, file=dest, flush=True)


def resolve_ssh_config(
    host_alias: str = DEFAULT_SSH_HOST_ALIAS,
    config_path: str | None = None,
) -> dict:
    """Lê ~/.ssh/config para obter HostName, User e Port do alias configurado."""
    target = {
        "hostname": DEFAULT_HOST,
        "user": DEFAULT_USER,
        "port": DEFAULT_PORT,
    }

    path = Path(config_path) if config_path else Path.home() / ".ssh" / "config"
    if not path.is_file() or paramiko is None:
        return target

    try:
        ssh_config = paramiko.SSHConfig()
        with open(path, "r", encoding="utf-8") as f:
            ssh_config.parse(f)

        host_entry = ssh_config.lookup(host_alias)
        if host_entry:
            if "hostname" in host_entry:
                target["hostname"] = host_entry["hostname"]
            if "user" in host_entry:
                target["user"] = host_entry["user"]
            if "port" in host_entry:
                try:
                    target["port"] = int(host_entry["port"])
                except ValueError:
                    pass
    except Exception:
        pass

    return target


def parse_log_line(line: str) -> dict:
    """Analisa uma linha de log extraindo metadados básicos."""
    for pattern in LOG_PATTERNS:
        match = pattern.match(line)
        if match:
            data = match.groupdict()
            level = data.get("level", "INFO").upper()
            return {
                "raw": line,
                "timestamp": data.get("timestamp"),
                "level": level,
                "severity": LEVEL_SEVERITY.get(level, 20),
                "source": data.get("source"),
                "message": data.get("message", line),
            }

    # Fallback para linha não estruturada
    line_upper = line.upper()
    detected_level = "INFO"
    if "ERROR" in line_upper or "EXCEPTION" in line_upper:
        detected_level = "ERROR"
    elif "CRITICAL" in line_upper or "FATAL" in line_upper:
        detected_level = "CRITICAL"
    elif "WARN" in line_upper:
        detected_level = "WARNING"
    elif "DEBUG" in line_upper:
        detected_level = "DEBUG"

    return {
        "raw": line,
        "timestamp": None,
        "level": detected_level,
        "severity": LEVEL_SEVERITY.get(detected_level, 20),
        "source": None,
        "message": line,
    }


def parse_log_entries(lines: list[str]) -> list[dict]:
    """
    Agrupa linhas de log mantendo blocos de Traceback multilinhas
    anexados ao evento de erro correspondente.
    """
    entries = []
    current_entry = None

    for line in lines:
        line_stripped = line.rstrip("\r\n")
        if not line_stripped:
            continue

        # Verifica se é o início de um Traceback
        is_traceback_start = any(p.search(line_stripped) for p in TRACEBACK_START_PATTERNS)
        is_indented = line_stripped.startswith(" ") or line_stripped.startswith("\t")

        parsed = parse_log_line(line_stripped)

        # Se for continuação de um erro ou traceback
        if current_entry and (is_traceback_start or is_indented or (current_entry["severity"] >= 40 and not parsed["timestamp"] and parsed["level"] == "INFO")):
            current_entry["traceback"].append(line_stripped)
            current_entry["raw"] += "\n" + line_stripped
            continue

        # Se tem timestamp ou padrão de início de log estruturado
        if current_entry:
            entries.append(current_entry)

        current_entry = {
            "timestamp": parsed["timestamp"],
            "level": parsed["level"],
            "severity": parsed["severity"],
            "source": parsed["source"],
            "message": parsed["message"],
            "raw": line_stripped,
            "traceback": [line_stripped] if is_traceback_start else [],
        }

    if current_entry:
        entries.append(current_entry)

    return entries


def filter_entries(
    entries: list[dict],
    min_level: str | None = None,
    errors_only: bool = False,
    search_query: str | None = None,
    tail: int | None = None,
) -> list[dict]:
    """Filtra eventos por severidade, erros e termo de busca."""
    filtered = entries

    min_severity = 0
    if errors_only:
        min_severity = LEVEL_SEVERITY["ERROR"]
    elif min_level:
        min_severity = LEVEL_SEVERITY.get(min_level.upper(), 0)

    if min_severity > 0:
        filtered = [
            e for e in filtered
            if e["severity"] >= min_severity or any("ERROR" in tb.upper() or "EXCEPTION" in tb.upper() for tb in e.get("traceback", []))
        ]

    if search_query:
        query_pattern = re.compile(re.escape(search_query), re.IGNORECASE)
        filtered = [
            e for e in filtered
            if query_pattern.search(e["raw"]) or any(query_pattern.search(tb) for tb in e.get("traceback", []))
        ]

    if tail and tail > 0:
        filtered = filtered[-tail:]

    return filtered


def get_local_log_files(base_path: Path, service_key: str, date_str: str | None = None) -> list[Path]:
    """Localiza arquivos de log existentes para um serviço específico."""
    service_info = SERVICES_MAP.get(service_key)
    if not service_info or not service_info.get("log_folder"):
        return []

    log_dir = base_path / service_info["log_folder"]
    if not log_dir.is_dir():
        return []

    if date_str:
        target_file = log_dir / f"{date_str}.log"
        if target_file.is_file():
            return [target_file]
        # Tenta match parcial
        return sorted([f for f in log_dir.glob(f"*{date_str}*.log") if f.is_file()])

    # Pega todos os arquivos .log ordenados pela data mais recente
    files = sorted(log_dir.glob("*.log"), key=lambda f: f.stat().st_mtime, reverse=True)
    return files


def read_file_lines(file_path: Path, tail: int | None = None) -> list[str]:
    """Lê linhas de um arquivo de log com suporte a tail."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            if tail and tail > 0:
                return lines[-tail:]
            return lines
    except Exception as e:
        return [f"[ERRO AO LER ARQUIVO {file_path}]: {e}"]


def extract_local_container_logs(container_name: str, tail: int = 100, since: str | None = None) -> list[str]:
    """Extrai logs de um container Docker localmente."""
    cmd = ["docker", "logs", "--tail", str(tail)]
    if since:
        cmd.extend(["--since", since])
    cmd.append(container_name)

    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=False)
        if proc.returncode != 0:
            return [f"[CONTAINER {container_name} NÃO ENCONTRADO OU INATIVO]: {proc.stdout.strip()}"]
        return proc.stdout.splitlines()
    except FileNotFoundError:
        return [f"[DOCKER INDISPONÍVEL LOCALMENTE]: Comando docker não encontrado no PATH."]
    except Exception as e:
        return [f"[ERRO AO EXECUTAR DOCKER LOGS {container_name}]: {e}"]


def extract_remote_logs_via_ssh(
    host: str,
    user: str,
    port: int,
    password: str | None,
    service_key: str | None,
    source: str = "both",
    tail: int = 100,
    remote_dir: str = DEFAULT_REMOTE_DIR,
    date_str: str | None = None,
) -> dict:
    """Conecta via SSH ao host Solutis e extrai logs remotos."""
    if paramiko is None:
        raise RuntimeError("Biblioteca 'paramiko' não instalada. Execute com 'uv run --with paramiko ...'")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            hostname=host,
            port=port,
            username=user,
            password=password,
            timeout=10,
            allow_agent=True,
            look_for_keys=True,
        )
    except (socket.timeout, TimeoutError) as exc:
        raise ConnectionError(
            f"Timeout ao conectar a {host}:{port}. Verifique se a VPN corporativa da Solutis está ativa e conectada."
        ) from exc
    except paramiko.AuthenticationException as exc:
        raise PermissionError(
            f"Falha de autenticação SSH com o usuário '{user}' em {host}. A senha fornecida é inválida."
        ) from exc
    except Exception as exc:
        raise ConnectionError(
            f"Erro ao conectar via SSH em {host}:{port}: {exc}. Verifique se a VPN corporativa está ativa."
        ) from exc

    results = {}
    target_services = [service_key] if service_key and service_key != "all" else list(SERVICES_MAP.keys())

    try:
        for s_key in target_services:
            s_info = SERVICES_MAP.get(s_key, {})
            results[s_key] = {"files": {}, "containers": {}}

            # Extração de arquivos remotos
            if source in ("files", "both") and s_info.get("log_folder"):
                remote_log_folder = f"{remote_dir}/{s_info['log_folder']}"
                file_pattern = f"{date_str}.log" if date_str else "*.log"
                list_cmd = f"ls -t {remote_log_folder}/{file_pattern} 2>/dev/null | head -n 3"
                _, stdout, _ = client.exec_command(list_cmd)
                remote_files = [line.strip() for line in stdout.readlines() if line.strip()]

                for r_file in remote_files:
                    read_cmd = f"tail -n {tail} {r_file}"
                    _, f_stdout, _ = client.exec_command(read_cmd)
                    results[s_key]["files"][r_file] = [line.rstrip("\r\n") for line in f_stdout.readlines()]

            # Extração de containers remotos
            if source in ("containers", "both"):
                for c_name in s_info.get("containers", []):
                    docker_cmd = f"docker logs --tail {tail} {c_name} 2>&1"
                    _, c_stdout, _ = client.exec_command(docker_cmd)
                    c_lines = [line.rstrip("\r\n") for line in c_stdout.readlines()]
                    if c_lines and not any("No such container" in l for l in c_lines):
                        results[s_key]["containers"][c_name] = c_lines
    finally:
        client.close()

    return results


def generate_error_summary(parsed_data: dict) -> dict:
    """Gera um resumo estatístico e de diagnóstico dos erros encontrados."""
    summary = {
        "total_errors": 0,
        "total_warnings": 0,
        "by_service": {},
        "top_exceptions": {},
        "recent_errors": [],
    }

    exception_pattern = re.compile(r"([A-Za-z0-9_.]*(?:Error|Exception|Fault|Failed|Timeout)):?\s*(.*)")

    for service_key, sources in parsed_data.items():
        srv_errors = 0
        srv_warnings = 0

        all_entries = []
        for file_path, entries in sources.get("files", {}).items():
            all_entries.extend(entries)
        for container_name, entries in sources.get("containers", {}).items():
            all_entries.extend(entries)

        for entry in all_entries:
            level = entry.get("level", "")
            if level in ("ERROR", "CRITICAL", "FATAL", "EXCEPTION"):
                srv_errors += 1
                summary["total_errors"] += 1

                # Extrai tipo da exceção
                msg = entry.get("message", "")
                exc_match = exception_pattern.search(msg)
                if not exc_match and entry.get("traceback"):
                    for tb_line in reversed(entry["traceback"]):
                        exc_match = exception_pattern.search(tb_line)
                        if exc_match:
                            break

                exc_type = exc_match.group(1) if exc_match else (msg.split(":")[0] if ":" in msg else "GenericError")
                exc_type = exc_type.strip()
                summary["top_exceptions"][exc_type] = summary["top_exceptions"].get(exc_type, 0) + 1

                if len(summary["recent_errors"]) < 10:
                    summary["recent_errors"].append({
                        "service": service_key,
                        "timestamp": entry.get("timestamp"),
                        "type": exc_type,
                        "message": msg[:200],
                    })

            elif level in ("WARNING", "WARN"):
                srv_warnings += 1
                summary["total_warnings"] += 1

        summary["by_service"][service_key] = {
            "errors": srv_errors,
            "warnings": srv_warnings,
        }

    return summary


def format_text_output(parsed_data: dict, summary: dict | None = None) -> str:
    """Formata a saída de forma limpa e legível para terminal."""
    out = []
    out.append("=" * 80)
    out.append("🔍 SOLUTIS AGILE - RELATÓRIO DE INVESTIGAÇÃO DE LOGS")
    out.append("=" * 80)

    if summary:
        out.append(f"📊 RESUMO CONSOLIDADO:")
        out.append(f"  • Total de Erros / Exceções: {summary['total_errors']}")
        out.append(f"  • Total de Alertas (Warnings): {summary['total_warnings']}")
        out.append("\n  Distribuição por Serviço:")
        for srv, counts in summary["by_service"].items():
            out.append(f"    - {srv:16}: {counts['errors']} erros | {counts['warnings']} warnings")

        if summary["top_exceptions"]:
            out.append("\n  Principais Exceções Encontradas:")
            sorted_excs = sorted(summary["top_exceptions"].items(), key=lambda x: x[1], reverse=True)[:5]
            for exc_name, count in sorted_excs:
                out.append(f"    - {exc_name}: {count} ocorrência(s)")

        out.append("-" * 80)

    for service_key, sources in parsed_data.items():
        s_info = SERVICES_MAP.get(service_key, {})
        service_title = s_info.get("name", service_key)

        files_data = sources.get("files", {})
        containers_data = sources.get("containers", {})

        if not files_data and not containers_data:
            continue

        out.append(f"\n📦 SERVIÇO: {service_title} ({service_key})")
        out.append("=" * 80)

        # Arquivos de log
        for f_path, entries in files_data.items():
            out.append(f"\n📄 [Arquivo]: {f_path} ({len(entries)} eventos)")
            out.append("-" * 80)
            for entry in entries:
                time_str = f"[{entry['timestamp']}] " if entry.get("timestamp") else ""
                level_str = f"[{entry['level']}] "
                out.append(f"{time_str}{level_str}{entry['message']}")
                if entry.get("traceback") and len(entry["traceback"]) > 1:
                    out.append("    ┌─ [Traceback / Detalhes]:")
                    for tb_line in entry["traceback"]:
                        out.append(f"    │  {tb_line}")
                    out.append("    └────────────────────────")

        # Containers
        for c_name, entries in containers_data.items():
            out.append(f"\n🐳 [Container Docker]: {c_name} ({len(entries)} eventos)")
            out.append("-" * 80)
            for entry in entries:
                time_str = f"[{entry['timestamp']}] " if entry.get("timestamp") else ""
                level_str = f"[{entry['level']}] "
                out.append(f"{time_str}{level_str}{entry['message']}")
                if entry.get("traceback") and len(entry["traceback"]) > 1:
                    out.append("    ┌─ [Traceback / Detalhes]:")
                    for tb_line in entry["traceback"]:
                        out.append(f"    │  {tb_line}")
                    out.append("    └────────────────────────")

    out.append("\n" + "=" * 80)
    return "\n".join(out)


def build_parser() -> argparse.ArgumentParser:
    """Configura e retorna o parser de argumentos CLI."""
    parser = argparse.ArgumentParser(
        description="Extração e investigação de logs dos serviços e containers do Solutis Agile.",
        formatter_class=argparse.RawTextHelpFormatter,
    )

    parser.add_argument(
        "--service",
        "-s",
        default="all",
        choices=["all"] + list(SERVICES_MAP.keys()),
        help="Serviço alvo para extração de logs (padrão: all).",
    )
    parser.add_argument(
        "--source",
        default="both",
        choices=["files", "containers", "both"],
        help="Origem dos logs: 'files' (pastas de logs), 'containers' (docker logs) ou 'both'.",
    )
    parser.add_argument(
        "--errors-only",
        "-e",
        action="store_true",
        help="Filtra apenas erros, exceções e tracebacks.",
    )
    parser.add_argument(
        "--level",
        "-l",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Nível mínimo de severidade para exibição.",
    )
    parser.add_argument(
        "--search",
        "-g",
        "--grep",
        dest="search",
        help="Filtra linhas que contenham o termo de busca especificado.",
    )
    parser.add_argument(
        "--tail",
        "-n",
        type=int,
        default=100,
        help="Número de linhas a extrair por arquivo ou container (padrão: 100).",
    )
    parser.add_argument(
        "--date",
        "-d",
        help="Data do arquivo de log no formato YYYY-MM-DD (padrão: mais recente ou hoje).",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Gera e exibe um sumário estatístico e diagnóstico dos erros.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Retorna o resultado formatado em JSON para consumo por ferramentas e scripts.",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Salva a saída em um arquivo específico.",
    )

    # Argumentos de ambiente remoto
    remote_group = parser.add_argument_group("Ambiente Remoto (Host Solutis)")
    remote_group.add_argument(
        "--remote",
        "-r",
        action="store_true",
        help="Extrai logs remotamente do servidor Solutis (172.21.3.225) via SSH.",
    )
    remote_group.add_argument(
        "--host",
        help=f"Endereço IP ou hostname remoto (padrão: {DEFAULT_HOST} ou resolvido de ~/.ssh/config).",
    )
    remote_group.add_argument(
        "--user",
        help=f"Usuário SSH remoto (padrão: {DEFAULT_USER} ou resolvido de ~/.ssh/config).",
    )
    remote_group.add_argument(
        "--port",
        type=int,
        help=f"Porta SSH remota (padrão: {DEFAULT_PORT} ou resolvido de ~/.ssh/config).",
    )
    remote_group.add_argument(
        "--remote-dir",
        default=DEFAULT_REMOTE_DIR,
        help=f"Diretório raiz da aplicação no servidor remoto (padrão: {DEFAULT_REMOTE_DIR}).",
    )

    return parser


def run(args=None) -> int:
    """Ponto de entrada principal da tool."""
    parser = build_parser()
    parsed_args = parser.parse_args(args)

    base_dir = Path(__file__).resolve().parents[3]  # Raiz do repositório
    date_filter = parsed_args.date or datetime.date.today().isoformat()

    results = {}

    if parsed_args.remote:
        # Extração remota via SSH
        ssh_target = resolve_ssh_config(DEFAULT_SSH_HOST_ALIAS)
        host = parsed_args.host or ssh_target["hostname"]
        user = parsed_args.user or ssh_target["user"]
        port = parsed_args.port or ssh_target["port"]

        password = os.environ.get("SOLUTIS_SSH_PASSWORD")

        try:
            raw_remote_results = extract_remote_logs_via_ssh(
                host=host,
                user=user,
                port=port,
                password=password,
                service_key=parsed_args.service,
                source=parsed_args.source,
                tail=parsed_args.tail,
                remote_dir=parsed_args.remote_dir,
                date_str=parsed_args.date,
            )
        except ConnectionError as exc:
            safe_print(f"⚠️ [FALHA DE CONEXÃO REMOTA]: {exc}", password, file=sys.stderr)
            return EXIT_VPN_CONNECTION_ERROR
        except PermissionError as exc:
            safe_print(f"⚠️ [FALHA DE AUTENTICAÇÃO SSH]: {exc}", password, file=sys.stderr)
            return EXIT_AUTH_ERROR
        except Exception as exc:
            safe_print(f"⚠️ [ERRO AO EXTRAIR LOGS REMOTOS]: {exc}", password, file=sys.stderr)
            return EXIT_GENERAL_ERROR

        for s_key, data in raw_remote_results.items():
            results[s_key] = {"files": {}, "containers": {}}
            for f_path, lines in data.get("files", {}).items():
                entries = parse_log_entries(lines)
                filtered = filter_entries(
                    entries,
                    min_level=parsed_args.level,
                    errors_only=parsed_args.errors_only,
                    search_query=parsed_args.search,
                    tail=parsed_args.tail,
                )
                if filtered:
                    results[s_key]["files"][f_path] = filtered

            for c_name, lines in data.get("containers", {}).items():
                entries = parse_log_entries(lines)
                filtered = filter_entries(
                    entries,
                    min_level=parsed_args.level,
                    errors_only=parsed_args.errors_only,
                    search_query=parsed_args.search,
                    tail=parsed_args.tail,
                )
                if filtered:
                    results[s_key]["containers"][c_name] = filtered

    else:
        # Extração local
        target_services = [parsed_args.service] if parsed_args.service != "all" else list(SERVICES_MAP.keys())

        for s_key in target_services:
            s_info = SERVICES_MAP[s_key]
            results[s_key] = {"files": {}, "containers": {}}

            # Pastas de arquivos de logs
            if parsed_args.source in ("files", "both") and s_info.get("log_folder"):
                log_files = get_local_log_files(base_dir, s_key, date_str=parsed_args.date)
                for l_file in log_files:
                    lines = read_file_lines(l_file, tail=parsed_args.tail)
                    entries = parse_log_entries(lines)
                    filtered = filter_entries(
                        entries,
                        min_level=parsed_args.level,
                        errors_only=parsed_args.errors_only,
                        search_query=parsed_args.search,
                        tail=parsed_args.tail,
                    )
                    if filtered:
                        results[s_key]["files"][str(l_file.relative_to(base_dir))] = filtered

            # Containers Docker
            if parsed_args.source in ("containers", "both"):
                for c_name in s_info.get("containers", []):
                    lines = extract_local_container_logs(c_name, tail=parsed_args.tail)
                    # Se o container não existe/está inativo e não solicitamos erro explícito de docker
                    if any("NÃO ENCONTRADO" in l or "DOCKER INDISPONÍVEL" in l for l in lines) and len(s_info.get("containers", [])) > 1:
                        # Tenta o próximo container (ex: dev se prod falhar)
                        continue

                    entries = parse_log_entries(lines)
                    filtered = filter_entries(
                        entries,
                        min_level=parsed_args.level,
                        errors_only=parsed_args.errors_only,
                        search_query=parsed_args.search,
                        tail=parsed_args.tail,
                    )
                    if filtered:
                        results[s_key]["containers"][c_name] = filtered

    summary = generate_error_summary(results) if (parsed_args.summary or parsed_args.errors_only) else None

    # Saída
    if parsed_args.json:
        payload = {
            "summary": summary or generate_error_summary(results),
            "results": results,
        }
        output_str = json.dumps(payload, indent=2, ensure_ascii=False)
    else:
        output_str = format_text_output(results, summary)

    if parsed_args.output:
        try:
            with open(parsed_args.output, "w", encoding="utf-8") as f:
                f.write(output_str)
            print(f"✅ Relatório de logs salvo com sucesso em: {parsed_args.output}")
        except Exception as e:
            print(f"⚠️ Erro ao salvar arquivo {parsed_args.output}: {e}", file=sys.stderr)
            print(output_str)
    else:
        print(output_str)

    return EXIT_SUCCESS


if __name__ == "__main__":
    sys.exit(run())
