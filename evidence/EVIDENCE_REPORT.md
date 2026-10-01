# Relatório de Execução de Evidências — UX-CW03 v1.0
**Projeto:** Toca do Peixe  
**Frente:** CW-03 — Relacionamento e Receita / Clientes + Comercial  
**Work Item:** CW03-WI01 — Construir e ensaiar UX-CW03 v1.0  
**Data:** 01/10/2026  
**Status do Executor:** DONE (Pronto para revisão independente do ChatGPT)  
**Regra de Governança:** DONE ≠ APPROVED

---

## 1. Diretório e Isolamento

O protótipo foi construído em diretório local totalmente autocontido e isolado, **sem qualquer modificação ou impacto no repositório de produção** (`tocadopeixe/repo/tocadopeixe`), sem alteração de deploy, Dokploy, Hostinger ou interferência na homologação iFood.

- **Caminho absoluto do protótipo:** `/Users/tonyjonas/Documents/faisca/faiscaworks/ux-cw03-prototype/`
- **Ponto de entrada:** `index.html` (navegável diretamente via browser ou servidor estático)
- **Design System vigente:** Faisca Works Product UI Kit v0.3 (sidebar clara, canvas neutro `#F6F7F9`, vermelho de ação `#D7263D`, tipografia Sora/Inter, DimensionStatus independente sem progress bar linear, touch targets >= 44px)

---

## 2. Escopo Normativo v1.0 (6 Superfícies)

Construídas e testadas as seis superfícies canônicas:

1. `SCR-CRM-001` — Perfil e histórico
2. `SCR-CRM-002` — Atendimento humano/agente
3. `SCR-CRM-003` — Feedback/recuperação
4. `SCR-MKT-001` — Inbox comercial e oportunidades
5. `SCR-MKT-004` — Eventos, experiências e encomendas
6. `SCR-EXT-007` — Proposta de evento externa

> [!IMPORTANT]
> **Desambiguação Normativa (R1-F04):** A superfície normativa é estritamente **SCR-EXT-007 — Proposta de evento externa**. A apresentação web para o cliente final visualizar a proposta comercial é meramente a forma de exibição/layout deste artefato e **NÃO** corresponde a `SCR-EXT-003 — Área do cliente` (que permanece fora do escopo da baseline v1.0).

> [!NOTE]
> Conforme determinado pelas fontes canônicas, as superfícies `SCR-EXT-003`, `SCR-CRM-004`, `SCR-MKT-002`, `SCR-MKT-003`, `SCR-MKT-005` e `SCR-EXT-010` **não foram promovidas** nem construídas como superfícies normativas nesta execução v1.0.

---

## 3. Matriz dos 12 Cenários Obrigatórios

| № | Cenário | Ação Executada | Resultado Observado | Status | Evidência Visual (Screenshot) |
|---|---|---|---|:---:|---|
| **1** | **Cliente homônimo** | Busca e desambiguação entre dois registros com mesmo nome (`Carlos Eduardo Silva`) e contextos autorizados distintos (`CL-DEMO-021` vs `CL-DEMO-088`). | Operador selecionou pelo contexto autorizado (`Salão Presencial Consolação`); nenhum registro foi fundido e dados privados não foram vazados. | **PASS** | `cenario-01-homonimo-painel-busca.png`<br/>`cenario-01-homonimo-selecionado.png` |
| **2** | **Continuar caso existente** | Abertura de atendimento para `CL-DEMO-021` que já possui o caso ativo `AT-DEMO-021`. | Sistema detectou o caso em andamento e ofereceu continuar o atendimento existente; impediu duplicação silenciosa de casos. | **PASS** | `cenario-02-modal-caso-existente.png`<br/>`cenario-02-caso-atendido.png` |
| **3** | **Feedback público + nota interna** | Exibição da avaliação `FB-DEMO-008` (nota 2/5) contendo relato público e observação interna da equipe. | Audiência pública (Google Reviews) e interna/restrita (cozinha/gerência) claramente isoladas na UI por cartões e tags inequívocas. | **PASS** | `cenario-03-audiencias-separadas.png` |
| **4** | **Preparar resposta pública** | Rascunho de resposta pública pelo operador com prévia sanitizada. | Prévia identifica canal e destinatário; campos internos (ticket R03, pico da cozinha, nomes da equipe) foram expurgados da resposta externa. | **PASS** | `cenario-04-rascunho-resposta-painel.png` |
| **5** | **Recuperação separada da comunicação** | Registro da `RecoveryAction` (`ACT-REC-104`) e envio posterior da `CommunicationIntent` (`COMM-INT-502`). | Os dois objetos possuem identidades e ciclos de vida independentes; o envio da mensagem não concluiu indevidamente a ação operacional na cozinha. | **PASS** | `cenario-05-recuperacao-vs-comunicacao.png` |
| **6** | **Compensação com autoridade insuficiente** | Operador (Atendente N1, limite R$ 30,00) propôs compensação financeira de R$ 120,00. | Proposta foi marcada como bloqueada por falta de autoridade; efeito financeiro permaneceu separado e texto livre não gerou crédito. | **PASS** | `cenario-06-compensacao-bloqueada.png` |
| **7** | **Resultado incerto de mensagem** | Simulação de timeout na rede durante o disparo da `CommunicationIntent`. | Estado tornou-se "Resultado Incerto"; reenvio cego (blind retry) foi bloqueado na UI; exigiu reconciliação do mesmo ID com o gateway. | **PASS** | `cenario-07-resultado-incerto-timeout.png`<br/>`cenario-07-reconciliado.png` |
| **8** | **Conversa vira oportunidade** | Conversão do chat `CONV-DEMO-031` em oportunidade comercial `OPP-DEMO-006`. | Oportunidade referencia a conversa original por ID; mensagens e histórico não foram duplicados como uma segunda verdade no CRM. | **PASS** | `cenario-08-conversa-vira-oportunidade.png` |
| **9** | **Enviar EventProposal v1** | Emissão e envio da proposta v1.0 para o evento `EVT-DEMO-006`. | Versão, escopo (40 pax, Mezanino), validade e termos explícitos; envio não confirmou capacidade, não liberou produção e não registrou pagamento. | **PASS** | `cenario-09-proposta-v1-enviada.png` |
| **10** | **Cliente aceita v1** | Registro do aceite formal `ProposalAcceptance` (`ACC-EVT-001`) na visão externa do cliente (`SCR-EXT-007`). | Aceite vinculado estritamente à v1.0; capacidade permaneceu pendente no FND-11; produção permaneceu bloqueada; pagamento permaneceu pendente. | **PASS** | `cenario-10-portal-cliente-proposta.png`<br/>`cenario-10-cliente-aceitou-v1.png`<br/>`cenario-10-aceite-v1-no-gestor.png` |
| **11** | **Capacidade deixa de estar disponível** | Consulta de capacidade no FND-11/R03 retorna indisponibilidade no recurso Salão Mezanino em 15/10/2026. | Proposta v1 e aceite `ACC-EVT-001` permaneceram preservados no histórico; capacidade foi marcada "em conflito"; sistema exigiu nova decisão/negociação. | **PASS** | `cenario-11-conflito-capacidade-fnd11.png` |
| **12** | **EventProposal v2 altera materialmente o acordo** | Negociação de nova data (22/10/2026), novo espaço (Deck) e 38 pax, gerando a Proposta v2.0. | v1 e seu aceite permaneceram históricos; v2 foi emitida sem herdar aceite da v1; v2 exige novo aceite independente pelo cliente. | **PASS** | `cenario-12-proposta-v2-emitida.png`<br/>`cenario-12-portal-cliente-proposta-v2.png` |

---

## 4. Ensaios em Viewport e Qualidade de Código

- **Viewport Desktop (1440 x 900):** Todas as 6 superfícies foram renderizadas, testadas e capturadas.
- **Viewport Mobile (390 x 844):** 
  - Testado e capturado em `SCR-CRM-002` (Atendimento humano/agente) e `SCR-EXT-007` (Proposta de evento externa).
  - Ausência de overflow horizontal verificado via script DOM: `scrollWidth <= innerWidth` (**PASS**).
  - Áreas de toque em botões e controles >= 44px.
- **Console JavaScript:**
  - Erros não tratados: **0 (Zero)**.
  - Runtime exceptions: **0 (Zero)**.

---

## 5. O que este ensaio NÃO PROVA (Limitações Explícitas)

Conforme regras canônicas de governança, este ensaio de protótipo de UX **NÃO prova e não autoriza**:
- Implementação de backend da plataforma;
- Banco de dados ou migrações de schema;
- Sistema de autorização / autenticação real (RBAC);
- Identidade real ou verificação civil de clientes;
- Políticas de retenção e privacidade final (D14);
- Integração real com APIs da Meta (WhatsApp Business Cloud API / Instagram Graph API);
- Execução de agentes autônomos reais em produção;
- Pagamento real, cobrança de sinal ou conciliação financeira bancária;
- Capacidade física real do salão da Toca do Peixe;
- Validade jurídica formal do instrumento de aceite;
- Segurança criptográfica de portais externos;
- Promoção da baseline para *Ready for Codex* ou *Ready for Pilot*.
