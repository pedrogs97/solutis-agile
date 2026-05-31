---
description: Detecta alterações nos serviços do monorepo e atualiza as versões no package.json ou pyproject.toml
---

# Define o que dispara a execução automática no IDE
on:
  push:
    branches:
      - main
  # Permite execução manual direto pela interface do Antigravity IDE com parâmetros personalizados
  workflow_dispatch:
    inputs:
      bump_type:
        type: choice
        description: "Forçar um tipo de incremento específico (opcional)"
        required: false
        options:
          - ""
          - "patch"
          - "minor"
          - "major"
      dry_run:
        type: boolean
        description: "Apenas simular as alterações (Dry Run)?"
        default: false
      run_all:
        type: boolean
        description: "Atualizar todos os serviços independente do Git?"
        default: false

jobs:
  bump_version:
    name: "Analisar Commit e Incrementar Versão"
    runtime: "python:3.13" # Garante o ambiente Python necessário para o script

    steps:
      - name: "Checkout do Repositório"
        action: "workspace/checkout"
        with:
          fetch_depth: 2 # Necessário para o diff-tree do script conseguir comparar com o commit anterior

      - name: "Executar Script de Atualização"
        shell: bash
        run: |
          # Define o caminho do script dentro da estrutura do agente
          SCRIPT_PATH="./.agents/update_versions.py"

          # Garante permissão de execução caso não esteja dropado corretamente
          chmod +x "$SCRIPT_PATH"

          # Inicializa a string de argumentos para o Python
          ARGS=""

          # Validações dos inputs manuais (Interface do Usuário)
          if [ "${{ inputs.run_all }}" = "true" ]; then
            ARGS="$ARGS --all"
          fi

          if [ "${{ inputs.dry_run }}" = "true" ]; then
            ARGS="$ARGS --dry-run"
          fi

          if [ -n "${{ inputs.bump_type }}" ]; then
            ARGS="$ARGS --bump-type ${{ inputs.bump_type }}"
          fi

          # Executa o script enviando o hash do último commit gerado
          echo "🚀 Iniciando script de automação de versão..."
          python3 "$SCRIPT_PATH" --commit HEAD $ARGS

      - name: "Persistir Alterações"
        # Executado apenas se não for um Dry Run
        if: ${{ inputs.dry_run != true }}
        action: "workspace/commit-and-push"
        with:
          commit_message: "chore(version): auto-increment service versions [skip ci]"
          files:
            - "solutis-agile-frontend/package.json"
            - "solutis-sync/pyproject.toml"
            - "solutis_manager_back/pyproject.toml"
            - "solutis_procurement/pyproject.toml"
            - "solutis_report/pyproject.toml"
