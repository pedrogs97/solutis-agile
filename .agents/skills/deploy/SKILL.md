---
name: deploy
description: Executa o deploy remoto da aplicação Solutis Agile no servidor remoto (host Solutis) via SSH. Garante checagem de atualização de versão dos serviços, solicitação obrigatória e sigilosa da senha de acesso/sudo ao usuário, diagnóstico de VPN e streaming dos logs de build e containers.
---

# Deploy Remoto - Solutis Agile

Esta skill guia o agente no procedimento seguro e automatizado de implantação (deploy) do ecossistema Solutis Agile no servidor de produção (`Solutis` - `172.21.3.225`).

---

## Regras Críticas e Invioláveis

1. **Garantia de Atualização de Versões dos Serviços**:
   - Antes de iniciar o deploy, é **obrigatório** verificar se os serviços que sofreram alterações de código tiveram suas versões devidamente incrementadas no `package.json` ou `pyproject.toml`.
   - Utilize o script helper [remote_deploy.py](./scripts/remote_deploy.py) com a opção `--check-versions-only` ou `--auto-bump` caso seja necessário sincronizar os incrementos.

2. **Commit e Push Prévios Obrigatórios**:
   - O commit das alterações e o envio (`git push origin main`) para o repositório remoto DEVEM ser realizados **antes** de acessar o servidor e executar o deploy.
   - Isso garante que a branch remota contenha todos os códigos e novas versões prontas para sincronização.

3. **Sincronização no Servidor via `git pull`**:
   - No servidor remoto (`~/solutis-agile`), é obrigatório sincronizar as alterações via `git checkout main && git pull origin main` antes de rodar o `./deploy.sh`.
   - O script `remote_deploy.py` já executa essa etapa de sincronização por padrão.

4. **Solicitação Obrigatória e Prévia de Senha**:
   - O agente **NUNCA** deve tentar disparar o deploy remoto sem antes solicitar de forma explícita a senha de acesso SSH e comandos `sudo` ao usuário no chat.
   - O agente **NUNCA DEVE expor ou ecoar a senha** recebida em nenhuma mensagem, log ou resumo gerado.

5. **Diagnóstico Obrigatório de VPN**:
   - Se ocorrer timeout ou recusa de conexão com o servidor `Solutis` (`172.21.3.225`), o agente deve imediatamente alertar o usuário:
     > ⚠️ **Não foi possível conectar ao servidor Solutis (172.21.3.225). Por favor, verifique se a VPN corporativa está conectada e ativa antes de tentar novamente.**

---

## Procedimento de Execução do Agente

### Passo 1: Leitura de Contexto (`spec-reader`)
Leia a pasta `.spec/` (`project-overview.md`, `architecture.md` e `changes-log.md`) para confirmar o estado do projeto e os microsserviços vigentes.

### Passo 2: Verificação e Atualização Prévia de Versões
Execute a validação para confirmar se as versões locais estão atualizadas:
```bash
uv run --with paramiko python3 .agents/skills/deploy/scripts/remote_deploy.py --check-versions-only
```
- Se houver serviços modificados pendentes de bump, aplique o incremento com `--auto-bump` (ou `.agents/update_versions.py --local`).

### Passo 3: Commit e Push das Alterações para o Repositório Remoto
Realize o commit das alterações de código, testes, especificações e versões, seguido de `git push origin main`:
```bash
git add .
git commit -m "<mensagem semântica>"
git push origin main
```
*Se houver solicitação de credenciais do GitHub no terminal, oriente o usuário a autenticar ou executar o push.*

### Passo 4: Solicitação da Senha ao Usuário
Peça ao usuário que informe a senha de acesso ao servidor `Solutis` (que também será utilizada para comandos que exigem `sudo`):
> *"Por favor, forneça a senha de acesso para conexão SSH e comandos `sudo` no servidor Solutis para que eu possa prosseguir com o deploy com segurança."*

### Passo 5: Execução Segura do Deploy Remoto
Ao receber a senha, execute o deploy remoto. O script conectará via SSH em `~/solutis-agile`, executará `git checkout main && git pull origin main` e chamará `./deploy.sh`:

```bash
SOLUTIS_SSH_PASSWORD="<SENHA_INFORMADA>" uv run --with paramiko python3 .agents/skills/deploy/scripts/remote_deploy.py
```

Opções suportadas pela tool:
- `--no-pull`: Pula o `git checkout main && git pull origin main` remoto (padrão é puxar).
- `--sudo`: Adiciona elevação `sudo` na chamada remota de `./deploy.sh`.
- `--dry-run`: Apenas testa a conectividade SSH e a existência da pasta remota.
- `--auto-bump`: Se houver versões pendentes, faz o bump automaticamente antes do deploy.
- `--remote-dir <caminho>`: Sobrescreve o diretório remoto do projeto (padrão: `~/solutis-agile`).

### Passo 6: Tratamento de Resultados e Feedback
- **Sucesso (Exit code 0)**: Apresente o resumo dos serviços atualizados e containers reconstruídos.
- **Falha de Conexão (Exit code 2)**: Alerte sobre a **VPN desconectada** e oriente o usuário a se conectar na VPN da Solutis.
- **Falha de Autenticação (Exit code 3)**: Alerte que a senha fornecida foi recusada pelo servidor e solicite a correção.
- **Outros Erros**: Apresente a mensagem amigável sem expor dados sensíveis ou segredos técnicos.

### Passo 7: Registro no Histórico (`spec-updater`)
Registre a execução e o status do deploy em `.spec/changes-log.md`.
