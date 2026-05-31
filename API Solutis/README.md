# 🐶 Bruno API Collection - Solutis Agile

Este diretório contém a coleção de requisições de API configurada para o [Bruno](https://www.usebruno.com/), um cliente de API Git-friendly, open-source e extremamente leve.

A coleção permite testar, documentar e explorar todos os endpoints fornecidos pelos microsserviços do monorepo de forma centralizada e sem a necessidade de ferramentas proprietárias.

---

## 📂 Estrutura de Pastas da Coleção

As requisições estão organizadas por domínio e correspondem aos endpoints dos serviços:

- **🔑 Authorization**: Autenticação de usuários, login e obtenção de tokens JWT.
- **📝 Clicksign**: Integração e testes com a API de assinatura eletrônica do Clicksign.
- **📄 Document**: Gestão de documentos, termos de aceite e relatórios.
- **🤝 Lending**: Fluxos e controle de comodatos (empréstimos de ativos/equipamentos).
- **🛒 Procurement**: Gestão de fornecedores (Supplier) e regras do Django.
- **🔗 Proxy**: Endpoints de proxying para requisições intermediadas.
- **⚡ Sync**: Controle e monitoramento de execuções de sincronização periódica de dados.
- **✅ Verification**: Validações cadastrais e verificações de integridade.

---

## 🚀 Como Usar no Bruno

1. **Baixar o Bruno**: Instale o cliente desktop oficial do [site do Bruno](https://www.usebruno.com/) ou utilize a extensão oficial do VS Code.
2. **Abrir a Coleção**:
   - Abra o aplicativo do Bruno.
   - Clique em **"Open Collection"** (Abrir Coleção).
   - Selecione a pasta `API Solutis` na raiz deste monorepo.
3. **Configurar o Ambiente**:
   - A coleção está configurada para buscar variáveis de ambiente.
   - Verifique a pasta `environments` no Bruno.
   - O arquivo `collection.bru` mapeia as portas padrão de cada serviço rodando localmente:
     - **Manager Backend (`agile-back`)**: `http://localhost:8080`
     - **Procurement (`solutis-procurement`)**: `http://localhost:8001`
     - **Report Service (`solutis-report`)**: `http://localhost:8002`
     - **Sync Service (`solutis-sync`)**: `http://localhost:8003`

---

## 📝 Boas Práticas

- Ao adicionar novos endpoints no código dos serviços, lembre-se de atualizar a coleção do Bruno criando a respectiva requisição `.bru` na pasta apropriada.
- Não versionar segredos ou credenciais reais (como tokens JWT expirados ou senhas de produção) nos arquivos de environment do repositório. Utilize variáveis ou insira-os apenas localmente no Bruno.
