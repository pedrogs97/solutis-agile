#!/usr/bin/env python3
"""
Script de Deploy Remoto via SSH para o Host Solutis.

Executa o deploy.sh remoto no servidor 'Solutis' (172.21.3.225) com:
- Validação prévia de atualização de versões dos serviços (.agents/update_versions.py).
- Solicitação e uso seguro de senha para conexão SSH e sudo (sem vazamento em logs).
- Detecção e aviso explicativo em caso de desconexão da VPN.
- Streaming dos logs do deploy remoto em tempo real.
"""

import argparse
import getpass
import os
import re
import socket
import subprocess
import sys
import time
from pathlib import Path

try:
    import paramiko
except ImportError:
    paramiko = None


# Constantes de saída e configuração
DEFAULT_SSH_HOST_ALIAS = "Solutis"
DEFAULT_HOST = "172.21.3.225"
DEFAULT_USER = "pedro"
DEFAULT_PORT = 22
DEFAULT_REMOTE_DIR = "~/solutis-agile"
DEFAULT_DEPLOY_CMD = "./deploy.sh"

EXIT_SUCCESS = 0
EXIT_GENERAL_ERROR = 1
EXIT_VPN_CONNECTION_ERROR = 2
EXIT_AUTH_ERROR = 3
EXIT_VERSION_CHECK_FAILED = 4

SUDO_PROMPT_PATTERNS = [
    re.compile(r"\[sudo\] password for .+:?", re.IGNORECASE),
    re.compile(r"password for .+:?", re.IGNORECASE),
    re.compile(r"Password:?", re.IGNORECASE),
]


def mask_sensitive_data(text: str, secret: str | None) -> str:
    """Substitui qualquer ocorrência da senha por máscara de segurança."""
    if not text or not secret:
        return text
    return text.replace(secret, "[PROTECTED_PASSWORD]")


def safe_print(message: str, secret: str | None = None, file=None) -> None:
    """Imprime mensagem na saída padrão garantindo o mascaramento da senha."""
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
        # Fallback seguro caso haja erro na leitura do arquivo
        pass

    return target


def check_service_versions_readiness(
    workspace_root: str,
) -> tuple[bool, str]:
    """
    Verifica se todos os serviços modificados tiveram suas versões atualizadas.
    Executa o script .agents/update_versions.py em modo dry-run local.
    """
    script_path = os.path.join(workspace_root, ".agents", "update_versions.py")
    if not os.path.isfile(script_path):
        return True, "Script update_versions.py não encontrado; ignorando verificação."

    try:
        res = subprocess.run(
            [sys.executable, script_path, "--local", "--dry-run"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
            cwd=workspace_root,
        )
        output = res.stdout + res.stderr

        # Se houver menção de "Would update version file" ou "📦 Updating services:"
        if "Would update version file" in output or "📦 Updating services:" in output:
            lines = [
                line.strip()
                for line in output.splitlines()
                if "➡️" in line
                and "Já atualizado" not in line
                or "Updating services:" in line
            ]
            detail = "\n".join(lines)
            return (
                False,
                f"Foram detectadas alterações em serviços sem o devido incremento de versão:\n{detail}",
            )

        return True, "Todas as versões dos serviços estão consistentes e atualizadas."
    except Exception as e:
        return False, f"Falha ao checar versões dos serviços: {e}"


def auto_bump_service_versions(workspace_root: str) -> bool:
    """Executa o bump automático de versão nos serviços pendentes."""
    script_path = os.path.join(workspace_root, ".agents", "update_versions.py")
    if not os.path.isfile(script_path):
        return False

    try:
        res = subprocess.run(
            [sys.executable, script_path, "--local", "--bump-type", "patch"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
            cwd=workspace_root,
        )
        return res.returncode == 0
    except Exception:
        return False


def execute_remote_deploy(
    host: str,
    user: str,
    port: int,
    password: str,
    remote_cmd: str = DEFAULT_DEPLOY_CMD,
    remote_dir: str = DEFAULT_REMOTE_DIR,
    git_pull: bool = True,
    use_sudo: bool = False,
    dry_run: bool = False,
    timeout: int = 10,
) -> int:
    """
    Conecta ao servidor via SSH e executa o deploy.sh remoto.
    Trata prompts de sudo e protege contra vazamento de senhas.
    """
    if paramiko is None:
        safe_print(
            "❌ Erro: O pacote 'paramiko' é obrigatório. Execute via: uv run --with paramiko ...",
            file=sys.stderr,
        )
        return EXIT_GENERAL_ERROR

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    safe_print(f"🔌 Conectando via SSH ao servidor Solutis ({user}@{host}:{port})...")

    try:
        client.connect(
            hostname=host,
            port=port,
            username=user,
            password=password,
            timeout=timeout,
            auth_timeout=timeout,
            banner_timeout=timeout,
            look_for_keys=False,
            allow_agent=False,
        )
    except (
        socket.timeout,
        TimeoutError,
        paramiko.ssh_exception.NoValidConnectionsError,
        socket.gaierror,
        ConnectionRefusedError,
        OSError,
    ) as conn_err:
        err_str = str(conn_err)
        safe_print(
            f"\n❌ Não foi possível conectar ao servidor Solutis ({host}): {err_str}",
            secret=password,
            file=sys.stderr,
        )
        safe_print(
            "⚠️ Por favor, verifique se a VPN corporativa da Solutis está conectada e tente novamente.\n",
            file=sys.stderr,
        )
        return EXIT_VPN_CONNECTION_ERROR
    except paramiko.ssh_exception.AuthenticationException:
        safe_print(
            f"\n❌ Falha de autenticação SSH: Senha incorreta ou acesso negado para '{user}' no servidor Solutis ({host}).",
            secret=password,
            file=sys.stderr,
        )
        return EXIT_AUTH_ERROR
    except Exception as e:
        safe_print(
            f"\n❌ Erro inesperado ao conectar via SSH: {e}",
            secret=password,
            file=sys.stderr,
        )
        return EXIT_GENERAL_ERROR

    safe_print("✅ Conexão SSH estabelecida com sucesso!")

    if dry_run:
        safe_print(
            f"🔍 [DRY-RUN] Testando existência do diretório do projeto: {remote_dir}"
        )
        stdin, stdout, stderr = client.exec_command(
            f'bash -c "test -d {remote_dir} && echo OK || echo NOT_FOUND"'
        )
        res = stdout.read().decode("utf-8").strip()
        client.close()
        if res == "OK":
            safe_print(f"✅ Diretório '{remote_dir}' encontrado no servidor.")
            return EXIT_SUCCESS
        else:
            safe_print(
                f"⚠️ Diretório '{remote_dir}' não encontrado remotamente. Verifique o caminho ou use --remote-dir.",
                file=sys.stderr,
            )
            return EXIT_GENERAL_ERROR

    # Monta comando remoto com navegação para o diretório do projeto
    cmd_prefix = "sudo " if use_sudo else ""
    pull_step = "git checkout main && git pull origin main && " if git_pull else ""
    full_cmd = f"cd {remote_dir} && {pull_step}chmod +x {remote_cmd} && {cmd_prefix}{remote_cmd}"

    safe_print(f"🚀 Iniciando execução remota do deploy: '{full_cmd}'")
    safe_print("=" * 60)

    try:
        transport = client.get_transport()
        if transport is None:
            safe_print("❌ Falha: Transporte SSH indisponível.", file=sys.stderr)
            client.close()
            return EXIT_GENERAL_ERROR

        channel = transport.open_session()
        # Solicita PTY para suportar prompts interativos como sudo
        channel.get_pty()
        channel.settimeout(timeout)
        channel.exec_command(full_cmd)

        buffer = ""
        sudo_prompt_handled = False

        while True:
            # Se o canal tiver dados prontos para leitura
            if channel.recv_ready():
                raw_data = channel.recv(4096)
                if not raw_data:
                    break
                chunk = (
                    raw_data.decode("utf-8", errors="replace")
                    if isinstance(raw_data, bytes)
                    else str(raw_data)
                )
                buffer += chunk

                # Exibe saída com sanitização estrita da senha
                safe_print(chunk, secret=password, file=sys.stdout)

                # Verifica se há prompt de senha para sudo
                if not sudo_prompt_handled:
                    for pattern in SUDO_PROMPT_PATTERNS:
                        if pattern.search(buffer):
                            safe_print("\n[⚡ Enviando senha de sudo ao servidor...]")
                            channel.send(password + "\n")
                            sudo_prompt_handled = True
                            buffer = ""
                            break

            # Se o comando finalizou e não há mais dados no buffer
            if channel.exit_status_ready() and not channel.recv_ready():
                break

            time.sleep(0.02)

        exit_status = channel.recv_exit_status()
        safe_print("=" * 60)

        if exit_status == 0:
            safe_print("🎉 Deploy remoto concluído com sucesso!")
        else:
            safe_print(
                f"❌ O script de deploy remoto falhou com código de saída: {exit_status}",
                file=sys.stderr,
            )

        return exit_status
    except Exception as e:
        safe_print(
            f"❌ Erro durante a execução remota: {e}",
            secret=password,
            file=sys.stderr,
        )
        return EXIT_GENERAL_ERROR
    finally:
        client.close()


def main() -> int:
    """Ponto de entrada da CLI."""
    parser = argparse.ArgumentParser(
        description="Tool de Deploy Remoto via SSH para o Host Solutis."
    )
    parser.add_argument(
        "--host",
        default=None,
        help="Endereço IP ou hostname do servidor (padrão: lido de ~/.ssh/config ou 172.21.3.225)",
    )
    parser.add_argument(
        "--user",
        default=None,
        help="Usuário SSH (padrão: lido de ~/.ssh/config ou pedro)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Porta SSH (padrão: 22)",
    )
    parser.add_argument(
        "--password",
        default=None,
        help="Senha de acesso SSH/sudo (recomendado: usar env SOLUTIS_SSH_PASSWORD)",
    )
    parser.add_argument(
        "--remote-dir",
        default=DEFAULT_REMOTE_DIR,
        help=f"Diretório raiz do projeto no servidor (padrão: {DEFAULT_REMOTE_DIR})",
    )
    parser.add_argument(
        "--remote-cmd",
        default=DEFAULT_DEPLOY_CMD,
        help=f"Script de deploy no servidor (padrão: {DEFAULT_DEPLOY_CMD})",
    )
    parser.add_argument(
        "--sudo",
        action="store_true",
        help="Executa o script remoto com sudo",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Apenas testa a conexão e a existência do diretório sem executar o deploy",
    )
    parser.add_argument(
        "--no-pull",
        dest="git_pull",
        action="store_false",
        default=True,
        help="Não executa git checkout main e git pull origin main antes do deploy",
    )
    parser.add_argument(
        "--skip-version-check",
        action="store_true",
        help="Pula a verificação prévia de incremento de versões dos serviços",
    )
    parser.add_argument(
        "--auto-bump",
        action="store_true",
        help="Incrementa automaticamente a versão de serviços alterados antes do deploy",
    )
    parser.add_argument(
        "--check-versions-only",
        action="store_true",
        help="Apenas verifica se os serviços estão com versões consistentes e encerra",
    )

    args = parser.parse_args()

    # Localiza a raiz do monorepo
    current_dir = Path(__file__).resolve().parent
    workspace_root = current_dir.parents[3]  # .agents/skills/deploy/scripts -> root

    # 1. Verificação prévia de atualização de versões
    if not args.skip_version_check:
        safe_print("🔍 Verificando status das versões dos serviços...")
        versions_ok, v_msg = check_service_versions_readiness(str(workspace_root))

        if not versions_ok:
            if args.auto_bump:
                safe_print(
                    "⚙️ Executando incremento automático das versões pendentes..."
                )
                bump_ok = auto_bump_service_versions(str(workspace_root))
                if not bump_ok:
                    safe_print(
                        "❌ Falha ao tentar atualizar automaticamente as versões.",
                        file=sys.stderr,
                    )
                    return EXIT_VERSION_CHECK_FAILED
                safe_print("✅ Versões atualizadas com sucesso!")
            else:
                safe_print(
                    f"\n❌ Bloqueio de Segurança no Deploy:\n{v_msg}\n",
                    file=sys.stderr,
                )
                safe_print(
                    "💡 Dica: Atualize as versões antes de implantar ou use --auto-bump.",
                    file=sys.stderr,
                )
                return EXIT_VERSION_CHECK_FAILED
        else:
            safe_print(f"✅ {v_msg}")

    if args.check_versions_only:
        return EXIT_SUCCESS

    # 2. Resolução das configurações SSH
    ssh_cfg = resolve_ssh_config(host_alias=DEFAULT_SSH_HOST_ALIAS)
    host = args.host or ssh_cfg["hostname"]
    user = args.user or ssh_cfg["user"]
    port = args.port or ssh_cfg["port"]

    # 3. Obtenção segura da senha (sem expor em histórico ou disco)
    password = (
        args.password
        or os.environ.get("SOLUTIS_SSH_PASSWORD")
        or os.environ.get("SSH_PASSWORD")
    )

    if not password:
        if sys.stdin.isatty():
            safe_print(
                f"🔐 Digite a senha para conectar em {user}@{host} e usar sudo: "
            )
            try:
                password = getpass.getpass(prompt="Senha: ")
            except Exception:
                pass

    if not password:
        safe_print(
            "❌ Erro de Segurança: A senha de acesso/sudo do servidor Solutis não foi informada.",
            file=sys.stderr,
        )
        safe_print(
            "Por favor, forneça a senha via variável de ambiente SOLUTIS_SSH_PASSWORD ou prompt interativo.",
            file=sys.stderr,
        )
        return EXIT_AUTH_ERROR

    # 4. Execução do Deploy Remoto
    return execute_remote_deploy(
        host=host,
        user=user,
        port=port,
        password=password,
        remote_cmd=args.remote_cmd,
        remote_dir=args.remote_dir,
        git_pull=args.git_pull,
        use_sudo=args.sudo,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
