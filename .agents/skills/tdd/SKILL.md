---
name: tdd
description: Diretrizes e fluxo de Desenvolvimento Orientado a Testes (TDD) para garantir cobertura de testes e alta performance de execução.
---

# Skill - Test-Driven Development (TDD)

Esta skill estabelece os princípios e procedimentos obrigatórios para implementação de funcionalidades e correção de bugs no projeto utilizando TDD.

## Fluxo TDD Obrigatório

1. **Escrever Testes Primeiro (Red)**:
   - Crie ou atualize os casos de teste para reproduzir a falha/bug ou validar o novo requisito antes de modificar o código de produção.
   - Os testes devem cobrir cenários de sucesso, cenários de borda (tabelas/bancos vazios, campos nulos ou opcionais) e validações de erro (duplicidade de dados, chaves estrangeiras).

2. **Implementar a Solução (Green)**:
   - Altere o código de produção estritamente para satisfazer os requisitos e fazer os testes passarem.

3. **Refatorar e Otimizar Desempenho dos Testes (Refactor & Optimize)**:
   - Mantenha o código limpo, legível e desacoplado.
   - Otimize a performance da suíte de testes:
     - Evite retentativas ou timeouts de rede longos em fixtures de teste (ex: conexão MySQL vs SQLite in-memory).
     - Reutilize estados ou faça cache de falhas conhecidas de infraestrutura nas fixtures base de teste.
     - Garanta tempo de execução rápido para a suíte de testes.
