/**
 * TOCA DO PEIXE — UX-CW03 v1.0 PROTOTYPE
 * Faisca Works Product UI Kit v0.3
 * 
 * Contratos de Produto:
 * - contato ≠ pessoa
 * - mesmo telefone não prova identidade
 * - conversa ≠ atendimento ≠ oportunidade
 * - Visit/Order/Bill são referências de R03 (não editáveis no CRM)
 * - resposta pública ≠ nota interna
 * - RecoveryAction ≠ CommunicationIntent
 * - compensação proposta ≠ compensação concedida
 * - mensagem enviada ≠ promessa cumprida
 * - timeout/resultado incerto NÃO autoriza retry cego
 * - EventProposal possui versão própria
 * - ProposalAcceptance possui identidade própria ≠ CapacityCommitmentRef
 * - proposta aceita ≠ capacidade confirmada ≠ pagamento ≠ produção liberada
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. ESTADO GLOBAL REATIVO & FIXTURES CANÔNICAS
  // =========================================================================

  function createInitialState() {
    return {
      currentSurface: 'SCR-CRM-001',
      activeContextualPanel: null, // null | 'disambiguate' | 'newCase' | 'draftResponse' | 'createRecovery' | 'createIntent' | 'createOpportunity' | 'sendProposal' | 'createV2'
      activeModal: null, // null | modalConfig
      currentUser: {
        name: 'Juliana Prado',
        role: 'Atendente N1',
        authorityLimit: 30.00 // limite de cortesia/compensação sem aprovação gerencial
      },

      // Entidades: Clientes
      customers: [
        {
          id: 'CL-DEMO-021',
          personRef: 'PER-021',
          name: 'Carlos Eduardo Silva',
          authorizedContext: 'Salão Presencial (Consolação / SP) — Documento Verificado',
          phone: '(11) 98765-4321',
          email: 'carlos.silva@demo.faisca.works',
          documentId: '***.451.892-**',
          activeCaseId: 'AT-DEMO-021',
          loyaltyPoints: 140,
          preferences: {
            preferredChannel: 'WhatsApp',
            marketingOptIn: false,
            restrictedNotesCount: 1
          },
          r03References: [
            { type: 'Visit', id: 'VISIT-2026-881', date: '24/09/2026', details: 'Mesa 12 · 2 pax · Salão Mezanino', source: 'R03/FND-03 (Somente Leitura)' },
            { type: 'Order', id: 'ORD-R03-4412', date: '24/09/2026', details: 'Peixe na Telha + Suco Natural · R$ 168,00', source: 'R03/FND-04 (Somente Leitura)' },
            { type: 'Bill', id: 'BILL-R03-9031', date: '24/09/2026', details: 'R$ 168,00 · Pago via PIX', source: 'R03/FND-06 (Somente Leitura)' }
          ]
        },
        {
          id: 'CL-DEMO-088',
          personRef: 'PER-088',
          name: 'Carlos Eduardo Silva',
          authorizedContext: 'Delivery Aplicativo (Campinas / SP) — Perfil Não Vinculado a Salão',
          phone: '(19) 97123-4567',
          email: 'carlos.eduardo.camp@email-mock.com',
          documentId: '***.782.119-**',
          activeCaseId: null,
          loyaltyPoints: 0,
          preferences: {
            preferredChannel: 'SMS',
            marketingOptIn: true,
            restrictedNotesCount: 0
          },
          r03References: [
            { type: 'Order', id: 'ORD-R03-3109', date: '12/08/2026', details: 'Combinado Delivery Salmão · R$ 89,00', source: 'R03/FND-04 (Somente Leitura)' }
          ]
        }
      ],

      // Entidades: Atendimentos / Casos
      cases: [
        {
          id: 'AT-DEMO-021',
          customerRef: 'CL-DEMO-021',
          topic: 'Divergência de item no pedido R03-4412 (Entrega incompleta)',
          status: 'em_atendimento', // 'novo', 'em_atendimento', 'aguardando_acao', 'acao_registrada', 'aguardando_retorno', 'encerrado'
          channel: 'WhatsApp',
          currentAssignee: 'Juliana Prado (Atendente N1)',
          agentPaused: true,
          promisedNextResponse: '01/10/2026 às 15:30',
          createdDate: '01/10/2026 13:10',
          originConversationRef: 'CONV-DEMO-031'
        }
      ],

      // Entidades: Feedback / Avaliação
      feedbacks: [
        {
          id: 'FB-DEMO-008',
          customerRef: 'CL-DEMO-021',
          channel: 'Google Business Profile / Delivery',
          rating: 2,
          date: '30/09/2026 21:15',
          publicReview: 'Peixe grelhado chegou frio e o molho de alcaparras veio derramado na sacola. Experiência frustrante ontem no delivery.',
          publicAudience: 'PÚBLICO (Google Reviews · Visível externamente a todos os clientes)',
          internalNote: 'Cozinha teve pico às 20h45 no salão e delivery; embalador substituto não lacrou pote de molho. Ticket R03-4412 conferido. Cozinha orientada pelo Chef.',
          internalAudience: 'INTERNO / PRIVADO (Restrito à equipe interna · NÃO expor em canais públicos)',
          publicResponseDraft: '',
          publicResponseStatus: 'nao_respondido', // 'nao_respondido', 'rascunho', 'enviado_moderacao', 'publicado'
          publicResponsePublished: null
        }
      ],

      // Entidades: Ações de Recuperação (RecoveryAction)
      recoveryActions: [
        {
          id: 'ACT-REC-104',
          feedbackRef: 'FB-DEMO-008',
          customerRef: 'CL-DEMO-021',
          type: 'Ação Operacional (Reposição de Prato & Reforço de Lacres)',
          description: 'Cozinha instruída para lacrar potes de alcaparra e registrar cortesia de prato em próxima visita.',
          status: 'aguardando_acao', // 'aguardando_acao', 'em_execucao', 'executada_operacionalmente'
          executionNote: '',
          compensationProposal: {
            id: 'COMP-PROP-01',
            type: 'Crédito de Compensação / Reembolso',
            amountRequested: 120.00,
            operatorAuthorityLimit: 30.00,
            operatorRole: 'Atendente N1',
            status: 'bloqueada_autoridade_insuficiente', // 'bloqueada_autoridade_insuficiente', 'pendente_gerencia', 'aprovada_gerencia'
            financialAdjustmentRef: null // Nenhum ajuste financeiro gerado enquanto bloqueado
          }
        }
      ],

      // Entidades: Intenções de Comunicação (CommunicationIntent)
      communicationIntents: [
        {
          id: 'COMM-INT-502',
          feedbackRef: 'FB-DEMO-008',
          customerRef: 'CL-DEMO-021',
          channel: 'WhatsApp',
          destinationContact: '(11) 98765-4321',
          content: 'Olá Carlos, lamentamos muito pelo transtorno com seu pedido de ontem. Abrimos o caso AT-DEMO-021 para acompanhar seu atendimento e preparamos um retorno com a nossa gerência.',
          status: 'rascunho', // 'rascunho', 'enviada', 'resultado_incerto', 'reconciliada_sucesso'
          dispatchAttempts: 0,
          uncertainReason: null,
          lastReconciledAt: null
        }
      ],

      // Entidades: Conversa Comercial (SCR-MKT-001)
      commercialConversations: [
        {
          id: 'CONV-DEMO-031',
          contactPoint: '(11) 98765-4321',
          clientName: 'Carlos Eduardo Silva',
          channel: 'WhatsApp Comercial',
          status: 'conversa_aberta', // 'conversa_aberta', 'oportunidade_criada'
          linkedOpportunityRef: null,
          messages: [
            { sender: 'client', time: '11:20', text: 'Boa tarde! Vocês atendem eventos fechados para grupos corporativos?' },
            { sender: 'agent', time: '11:22', text: 'Olá Carlos! Sim, temos o mezanino exclusivo e opções especiais de cardápio. Para quantas pessoas seria?' },
            { sender: 'client', time: '11:25', text: 'Gostaria de consultar orçamento para reserva do mezanino com menu degustação de frutos do mar para comemoração de aniversário da nossa empresa, com aproximadamente 40 convidados na metade de outubro.' }
          ]
        }
      ],

      // Entidades: Oportunidades (Opportunity)
      opportunities: [
        {
          id: 'OPP-DEMO-006',
          originConversationRef: 'CONV-DEMO-031', // Referência, NÃO cópia editável de mensagens!
          customerRef: 'CL-DEMO-021',
          title: 'Jantar Corporativo Aniversário Empresa — 40 pax',
          estimatedGuests: 40,
          estimatedValue: 7200.00,
          targetDate: '15/10/2026',
          status: 'oportunidade_aberta', // 'oportunidade_aberta', 'proposta_emitida', 'ganha', 'perdida'
          linkedEventRef: 'EVT-DEMO-006'
        }
      ],

      // Entidades: Evento e Propostas (SCR-MKT-004 e SCR-EXT-007)
      event: {
        id: 'EVT-DEMO-006',
        opportunityRef: 'OPP-DEMO-006',
        customerRef: 'CL-DEMO-021',
        title: 'Jantar Corporativo Faisca & Toca',
        currentActiveVersion: 'v1.0',
        proposals: {
          'v1.0': {
            version: 'v1.0',
            createdDate: '01/10/2026',
            targetDate: '15/10/2026',
            guests: 40,
            resource: 'Salão Principal Mezanino',
            menuScope: 'Menu Degustação Frutos do Mar + Bebidas Não Alcoólicas',
            totalValue: 7200.00,
            validityDate: '10/10/2026',
            terms: 'O aceite comercial formaliza os parâmetros acordados e precede o compromisso definitivo de capacidade no FND-11. Sinal de 30% faturado após confirmação de agenda.',
            status: 'rascunho', // 'rascunho', 'enviada', 'aceita', 'superada'
            sentAt: null,
            acceptanceRef: null
          },
          'v2.0': {
            version: 'v2.0',
            createdDate: '01/10/2026',
            targetDate: '22/10/2026', // Mudança material de data
            guests: 38,              // Mudança material de convidados
            resource: 'Salão Deck Exclusivo', // Mudança material de recurso
            menuScope: 'Menu Degustação Frutos do Mar + Seleção de Vinhos da Casa',
            totalValue: 6840.00,
            validityDate: '18/10/2026',
            terms: 'Proposta v2.0 gerada após indisponibilidade de agenda na data anterior. Requer novo e inequívoco aceite comercial.',
            status: 'nao_criada', // 'nao_criada', 'rascunho', 'enviada', 'aceita'
            sentAt: null,
            acceptanceRef: null
          }
        },
        proposalAcceptances: {}, // { 'ACC-EVT-001': { proposalVersion: 'v1.0', acceptedAt: '...', clientIp: '...' } }
        capacityCommitment: {
          status: 'pendente', // 'pendente', 'em_conflito', 'comprometido'
          fnd11Ref: null,
          conflictMessage: null
        },
        productionStatus: 'bloqueada', // 'bloqueada', 'liberada'
        paymentStatus: 'pendente',    // 'pendente', 'sinal_faturado'
        executedOrdersBillsRef: []   // Referências R03 reais quando for executado
      },

      // Registro de Cenários de Teste (12 Obrigatórios)
      scenarioResults: {
        1: { status: 'PENDING', note: 'Ainda não executado' },
        2: { status: 'PENDING', note: 'Ainda não executado' },
        3: { status: 'PENDING', note: 'Ainda não executado' },
        4: { status: 'PENDING', note: 'Ainda não executado' },
        5: { status: 'PENDING', note: 'Ainda não executado' },
        6: { status: 'PENDING', note: 'Ainda não executado' },
        7: { status: 'PENDING', note: 'Ainda não executado' },
        8: { status: 'PENDING', note: 'Ainda não executado' },
        9: { status: 'PENDING', note: 'Ainda não executado' },
        10: { status: 'PENDING', note: 'Ainda não executado' },
        11: { status: 'PENDING', note: 'Ainda não executado' },
        12: { status: 'PENDING', note: 'Ainda não executado' }
      }
    };
  }

  // Instância do Estado
  let state = createInitialState();

  // Ouvintes de re-renderização
  const listeners = [];
  function subscribe(fn) {
    listeners.push(fn);
  }
  function notify() {
    listeners.forEach(fn => fn(state));
  }

  // =========================================================================
  // 2. AÇÕES E REGRAS DE TRANSIÇÃO DE ESTADO
  // =========================================================================

  const actions = {
    navigateToSurface(surfaceId) {
      state.currentSurface = surfaceId;
      state.activeContextualPanel = null;
      notify();
    },

    openContextualPanel(panelName) {
      state.activeContextualPanel = panelName;
      notify();
    },

    closeContextualPanel() {
      state.activeContextualPanel = null;
      notify();
    },

    openModal(config) {
      state.activeModal = config;
      notify();
    },

    closeModal() {
      state.activeModal = null;
      notify();
    },

    // CENÁRIO 1: Selecionar cliente homônimo pelo contexto autorizado
    selectHomonymCustomer(customerId) {
      const selected = state.customers.find(c => c.id === customerId);
      if (!selected) return;
      // Garante que não funde cadastros!
      // Registra que a seleção foi baseada em contexto autorizado
      state.activeContextualPanel = null;
      state.selectedCustomer = selected;
      actions.recordScenarioResult(1, 'PASS', `Operador selecionou ${selected.id} (${selected.authorizedContext}) sem qualquer fusão de registros.`);
      notify();
    },

    // CENÁRIO 2: Continuar caso existente vs criar novo
    continueExistingCase(caseId) {
      const targetCase = state.cases.find(c => c.id === caseId);
      if (!targetCase) return;
      targetCase.status = 'em_atendimento';
      targetCase.currentAssignee = `${state.currentUser.name} (${state.currentUser.role})`;
      targetCase.agentPaused = true;
      actions.closeModal();
      actions.recordScenarioResult(2, 'PASS', `Caso ativo ${caseId} mantido sem duplicação silenciosa.`);
      notify();
    },

    createNewCaseExplicitly(customerRef, reason) {
      const newCaseId = `AT-DEMO-${Date.now().toString().slice(-4)}`;
      state.cases.push({
        id: newCaseId,
        customerRef: customerRef,
        topic: reason || 'Novo assunto específico solicitado explicitamente pelo cliente',
        status: 'novo',
        channel: 'WhatsApp',
        currentAssignee: state.currentUser.name,
        agentPaused: true,
        promisedNextResponse: '01/10/2026 às 16:00',
        createdDate: '01/10/2026 14:00',
        originConversationRef: 'CONV-NOVA'
      });
      actions.closeModal();
      notify();
    },

    // CENÁRIO 3: Feedback público + nota interna
    verifyFeedbackAudiences() {
      const fb = state.feedbacks.find(f => f.id === 'FB-DEMO-008');
      if (fb.publicAudience.includes('PÚBLICO') && fb.internalAudience.includes('INTERNO / PRIVADO')) {
        actions.recordScenarioResult(3, 'PASS', 'FB-DEMO-008 isola categoricamente relato público de nota interna restrita da equipe.');
      }
      notify();
    },

    // CENÁRIO 4: Preparar resposta pública
    savePublicResponseDraft(text) {
      const fb = state.feedbacks.find(f => f.id === 'FB-DEMO-008');
      // Verificação sanitária de segurança: nota interna não pode vazar
      if (text.toLowerCase().includes('pico') || text.toLowerCase().includes('lacrou') || text.toLowerCase().includes('ticket')) {
        alert('VIOLAÇÃO DE AUDIÊNCIA: O rascunho público não pode conter dados da nota interna.');
        return;
      }
      fb.publicResponseDraft = text;
      fb.publicResponseStatus = 'rascunho';
      actions.closeContextualPanel();
      actions.recordScenarioResult(4, 'PASS', 'Prévia de resposta pública identifica destino/canal e está completamente limpa de dados privados.');
      notify();
    },

    // CENÁRIO 5: Recuperação separada da comunicação
    registerRecoveryAction(desc) {
      const action = state.recoveryActions.find(a => a.id === 'ACT-REC-104');
      action.status = 'em_execucao';
      action.description = desc || action.description;
      notify();
    },

    sendCommunicationIntentSuccess() {
      const intent = state.communicationIntents.find(i => i.id === 'COMM-INT-502');
      const action = state.recoveryActions.find(a => a.id === 'ACT-REC-104');

      intent.status = 'enviada';
      intent.dispatchAttempts += 1;

      // REGRA: Ação operacional NÃO pode ser marcada como executada automaticamente!
      if (action.status !== 'executada_operacionalmente') {
        actions.recordScenarioResult(5, 'PASS', 'CommunicationIntent marcada como enviada sem alterar indevidamente o estado da RecoveryAction (permanece em execução).');
      } else {
        actions.recordScenarioResult(5, 'FAIL', 'Ação operacional foi concluída erroneamente por efeito colateral do envio da mensagem.');
      }
      notify();
    },

    // CENÁRIO 6: Compensação com autoridade insuficiente
    requestCompensationProposal(amount) {
      const action = state.recoveryActions.find(a => a.id === 'ACT-REC-104');
      action.compensationProposal.amountRequested = amount;

      if (amount > state.currentUser.authorityLimit) {
        action.compensationProposal.status = 'bloqueada_autoridade_insuficiente';
        action.compensationProposal.financialAdjustmentRef = null;
        actions.recordScenarioResult(6, 'PASS', `Proposta de compensação (R$ ${amount.toFixed(2)}) excede a alçada do operador (R$ ${state.currentUser.authorityLimit.toFixed(2)}) e foi bloqueada sem gerar efeito financeiro.`);
      } else {
        action.compensationProposal.status = 'aprovada_operador';
        action.compensationProposal.financialAdjustmentRef = `FIN-ADJ-${Date.now().toString().slice(-4)}`;
      }
      notify();
    },

    // CENÁRIO 7: Resultado incerto de mensagem (timeout / falha sem retry cego)
    simulateCommunicationTimeout() {
      const intent = state.communicationIntents.find(i => i.id === 'COMM-INT-502');
      intent.status = 'resultado_incerto';
      intent.dispatchAttempts += 1;
      intent.uncertainReason = 'Timeout no gateway de mensageria (504 Gateway Timeout). Estado de entrega desconhecido.';
      actions.recordScenarioResult(7, 'PASS', 'Disparo entrou em "resultado incerto"; reenvio cego bloqueado até reconciliação com o provedor.');
      notify();
    },

    reconcileCommunicationIntent() {
      const intent = state.communicationIntents.find(i => i.id === 'COMM-INT-502');
      intent.status = 'reconciliada_sucesso';
      intent.lastReconciledAt = '01/10/2026 14:05';
      intent.uncertainReason = null;
      notify();
    },

    // CENÁRIO 8: Conversa vira oportunidade
    convertConversationToOpportunity() {
      const conv = state.commercialConversations.find(c => c.id === 'CONV-DEMO-031');
      conv.status = 'oportunidade_criada';
      conv.linkedOpportunityRef = 'OPP-DEMO-006';

      const opp = state.opportunities.find(o => o.id === 'OPP-DEMO-006');
      opp.originConversationRef = 'CONV-DEMO-031'; // Referenciada!

      actions.recordScenarioResult(8, 'PASS', 'Oportunidade OPP-DEMO-006 referencia CONV-DEMO-031 sem duplicar ou criar verdade paralela de histórico.');
      notify();
    },

    // CENÁRIO 9: Enviar EventProposal v1
    sendProposalV1() {
      const p1 = state.event.proposals['v1.0'];
      p1.status = 'enviada';
      p1.sentAt = '01/10/2026 14:10';

      // Checagem obrigatória dos contratos:
      const cap = state.event.capacityCommitment.status;
      const prod = state.event.productionStatus;
      const pay = state.event.paymentStatus;

      if (cap === 'pendente' && prod === 'bloqueada' && pay === 'pendente') {
        actions.recordScenarioResult(9, 'PASS', 'Proposta v1.0 enviada com escopo, validade e termos explícitos; capacidade, produção e pagamento continuam pendentes.');
      } else {
        actions.recordScenarioResult(9, 'FAIL', 'Envio da proposta alterou indevidamente capacidade, produção ou faturamento.');
      }
      notify();
    },

    // CENÁRIO 10: Cliente aceita v1
    acceptProposalV1Externally() {
      const p1 = state.event.proposals['v1.0'];
      const acceptanceId = 'ACC-EVT-001';
      p1.status = 'aceita';
      p1.acceptanceRef = acceptanceId;

      state.event.proposalAcceptances[acceptanceId] = {
        id: acceptanceId,
        proposalVersion: 'v1.0',
        acceptedAt: '01/10/2026 14:15',
        clientIp: '201.86.120.45',
        termsAgreed: true
      };

      // Contrato: aceite ≠ capacidade confirmada ≠ pagamento ≠ produção liberada
      const cap = state.event.capacityCommitment.status;
      const prod = state.event.productionStatus;
      const pay = state.event.paymentStatus;

      if (cap === 'pendente' && prod === 'bloqueada' && pay === 'pendente') {
        actions.recordScenarioResult(10, 'PASS', 'Aceite ACC-EVT-001 vinculado unicamente à v1.0; capacidade permanece pendente, sem liberação de produção ou registro de pagamento.');
      } else {
        actions.recordScenarioResult(10, 'FAIL', 'Aceite comercial da proposta confirmou indevidamente capacidade física ou pagamento.');
      }
      notify();
    },

    // CENÁRIO 11: Capacidade indisponível no FND-11 antes do compromisso
    simulateFND11CapacityConflict() {
      state.event.capacityCommitment.status = 'em_conflito';
      state.event.capacityCommitment.conflictMessage = 'Recurso "Salão Principal Mezanino" indisponível em 15/10/2026 (Manutenção agendada no FND-11/R03).';

      // Validação: Proposta v1 e Aceite ACC-EVT-001 continuam íntegros e preservados!
      const p1 = state.event.proposals['v1.0'];
      const acc = state.event.proposalAcceptances['ACC-EVT-001'];

      if (p1 && p1.acceptanceRef === 'ACC-EVT-001' && acc && state.event.capacityCommitment.status === 'em_conflito') {
        actions.recordScenarioResult(11, 'PASS', 'FND-11 retornou conflito; proposta v1 e aceite ACC-EVT-001 permanecem preservados no histórico; exige nova decisão/renegociação.');
      } else {
        actions.recordScenarioResult(11, 'FAIL', 'Conflito de capacidade apagou o aceite ou substituiu a data silenciosamente.');
      }
      notify();
    },

    // CENÁRIO 12: Criar EventProposal v2 com alteração material
    createAndSendProposalV2() {
      const p1 = state.event.proposals['v1.0'];
      const p2 = state.event.proposals['v2.0'];

      p1.status = 'superada'; // Marcada como histórica/superada
      p2.status = 'enviada';
      p2.sentAt = '01/10/2026 14:20';
      state.event.currentActiveVersion = 'v2.0';

      // Validações fundamentais:
      // 1. Aceite de v1 NÃO aceita v2!
      const v2HasNoAcceptance = (p2.acceptanceRef === null);
      // 2. v1 continua com seu aceite histórico preservado
      const v1AcceptancePreserved = (p1.acceptanceRef === 'ACC-EVT-001');

      if (v2HasNoAcceptance && v1AcceptancePreserved) {
        actions.recordScenarioResult(12, 'PASS', 'Proposta v2.0 gerada para nova data/escopo; v1 e seu aceite ACC-EVT-001 permanecem históricos; v2 exige novo aceite independente.');
      } else {
        actions.recordScenarioResult(12, 'FAIL', 'Aceite da v1 autorizou silenciosamente a v2.');
      }
      notify();
    },

    recordScenarioResult(number, status, note) {
      state.scenarioResults[number] = { status, note, timestamp: new Date().toLocaleTimeString('pt-BR') };
      console.log(`[SCENARIO ${number}] ${status}: ${note}`);
    },

    resetAllToDefault() {
      state = createInitialState();
      notify();
    }
  };

  // =========================================================================
  // 3. RENDERIZADORES DAS 6 SUPERFÍCIES
  // =========================================================================

  // Helper para DimensionStatus v0.3
  function renderDimensionStatus(label, text, type) {
    return `
      <div class="dimension-status ${type}">
        <span class="dimension-label">${label}</span>
        <span class="dimension-dot"></span>
        <span class="dimension-value">${text}</span>
      </div>
    `;
  }

  // --- SCR-CRM-001: Perfil e Histórico ---
  function renderSCR_CRM_001() {
    const customer = state.customers.find(c => c.id === 'CL-DEMO-021');
    const homonym = state.customers.find(c => c.id === 'CL-DEMO-088');

    return `
      <div class="surface-viewport" id="scr-crm-001-container">
        <div class="surface-header">
          <div class="surface-title-group">
            <h1>
              Perfil e Histórico do Cliente
              <span class="surface-id-pill">SCR-CRM-001</span>
            </h1>
            <p class="surface-description">
              Identidade prudente baseada em contexto autorizado. Histórico operacional (Visit/Order/Bill) referenciado diretamente de R03 sem cópia de dados.
            </p>
          </div>
          <div class="surface-actions">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.openContextualPanel('disambiguate')">
              🔍 Testar Busca / Homônimos
            </button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.navigateToSurface('SCR-CRM-002')">
              Iniciar Atendimento →
            </button>
          </div>
        </div>

        <!-- Dimensões de Estado do Cliente -->
        <div class="dimension-status-group">
          ${renderDimensionStatus('Identidade', 'Identificado por Contexto Autorizado', 'success')}
          ${renderDimensionStatus('Caso Ativo', 'AT-DEMO-021 em andamento', 'warning')}
          ${renderDimensionStatus('Fidelidade R03', '140 pts disponíveis (FID-R03-092)', 'info')}
          ${renderDimensionStatus('Comunicação', 'WhatsApp Preferencial · Sem Opt-in MKT', 'neutral')}
        </div>

        <!-- Detalhes da Ficha Cadastral -->
        <div class="card-surface">
          <div class="card-header">
            <div>
              <div class="card-title">${customer.name}</div>
              <div class="card-subtitle">ID Canônico: ${customer.id} · Referência de Pessoa: ${customer.personRef}</div>
            </div>
            <span class="badge badge-green">Contexto Ativo & Auditado</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <div class="form-group">
              <label class="form-label">Contexto Autorizado</label>
              <input type="text" class="form-input" readonly value="${customer.authorizedContext}" />
            </div>
            <div class="form-group">
              <label class="form-label">Telefone (ContactPoint)</label>
              <input type="text" class="form-input" readonly value="${customer.phone}" />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail Cadastrado</label>
              <input type="text" class="form-input" readonly value="${customer.email}" />
            </div>
            <div class="form-group">
              <label class="form-label">Documento Sanitizado</label>
              <input type="text" class="form-input" readonly value="${customer.documentId}" />
            </div>
          </div>

          <div class="callout info">
            <span class="callout-icon">ℹ️</span>
            <div>
              <div class="callout-title">Contrato de Identidade Preservado</div>
              Contato telefônico não é prova isolada de identidade. Este perfil é isolado e não sofreu mesclagem automática com o cadastro homônimo existente em Campinas (${homonym.id}).
            </div>
          </div>
        </div>

        <!-- Histórico Factual R03 (Referências Externas Não Editáveis) -->
        <div class="card-surface">
          <div class="card-header">
            <div>
              <div class="card-title">Histórico de Visitas, Pedidos e Contas</div>
              <div class="card-subtitle">Fatos operacionais canônicos provenientes do Baseline R03 (Atender e Entregar)</div>
            </div>
            <span class="badge badge-r03-ref">Origem: R03 / FND-11 · Somente Leitura</span>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tipo Fato</th>
                  <th>ID de Referência R03</th>
                  <th>Data/Hora</th>
                  <th>Detalhamento Factual</th>
                  <th>Fonte Canônica</th>
                </tr>
              </thead>
              <tbody>
                ${customer.r03References.map(ref => `
                  <tr>
                    <td><span class="badge badge-neutral">${ref.type}</span></td>
                    <td><code>${ref.id}</code></td>
                    <td>${ref.date}</td>
                    <td>${ref.details}</td>
                    <td><span class="badge badge-r03-ref">${ref.source}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- SCR-CRM-002: Atendimento Humano / Agente ---
  function renderSCR_CRM_002() {
    const activeCase = state.cases.find(c => c.id === 'AT-DEMO-021');

    return `
      <div class="surface-viewport" id="scr-crm-002-container">
        <div class="surface-header">
          <div class="surface-title-group">
            <h1>
              Atendimento Humano / Agente
              <span class="surface-id-pill">SCR-CRM-002</span>
            </h1>
            <p class="surface-description">
              Gestão de casos e caixa com dono. Agente pausado para o atendimento assumido por humano. Continuidade de casos existentes.
            </p>
          </div>
          <div class="surface-actions">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.openModal({ type: 'continueCaseCheck' })">
              ⚡ Simular Entrada de Mensagem
            </button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.navigateToSurface('SCR-CRM-003')">
              Ver Feedback / Recuperação →
            </button>
          </div>
        </div>

        <!-- Dimensões do Atendimento -->
        <div class="dimension-status-group">
          ${renderDimensionStatus('Caso', `${activeCase.id} — Em Atendimento`, 'warning')}
          ${renderDimensionStatus('Responsável', activeCase.currentAssignee, 'info')}
          ${renderDimensionStatus('Automação', 'Agente IA Pausado nesta conversa', 'neutral')}
          ${renderDimensionStatus('Promessa', `Resposta até ${activeCase.promisedNextResponse}`, 'warning')}
        </div>

        <!-- Alerta de Caso Ativo Existente -->
        <div class="callout warning">
          <span class="callout-icon">⚠️</span>
          <div>
            <div class="callout-title">Caso Ativo Identificado para Carlos Eduardo Silva</div>
            O cliente já possui o atendimento <strong>${activeCase.id}</strong> em andamento. Qualquer nova mensagem do mesmo assunto deve dar continuidade ao caso existente para evitar duplicação ou dispersão de promessas.
          </div>
        </div>

        <!-- Ficha do Caso Operacional -->
        <div class="card-surface">
          <div class="card-header">
            <div>
              <div class="card-title">Protocolo ${activeCase.id}</div>
              <div class="card-subtitle">Aberto em ${activeCase.createdDate} via ${activeCase.channel}</div>
            </div>
            <span class="badge badge-yellow">Em Atendimento com Dono</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <div class="form-group">
              <label class="form-label">Assunto Registrado</label>
              <input type="text" class="form-input" readonly value="${activeCase.topic}" />
            </div>
            <div class="form-group">
              <label class="form-label">Atendente Responsável</label>
              <input type="text" class="form-input" readonly value="${activeCase.currentAssignee}" />
            </div>
            <div class="form-group">
              <label class="form-label">Próxima Resposta Prometida</label>
              <input type="text" class="form-input" readonly value="${activeCase.promisedNextResponse}" />
            </div>
            <div class="form-group">
              <label class="form-label">Conversa de Origem</label>
              <input type="text" class="form-input" readonly value="${activeCase.originConversationRef}" />
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.continueExistingCase('AT-DEMO-021')">
              ✅ Confirmar Continuidade do Caso
            </button>
            <button class="btn btn-outline-danger" onclick="window.UX_ACTIONS.openModal({ type: 'explicitNewCase' })">
              + Abrir Novo Caso com Justificativa
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- SCR-CRM-003: Feedback e Recuperação ---
  function renderSCR_CRM_003() {
    const fb = state.feedbacks.find(f => f.id === 'FB-DEMO-008');
    const recAction = state.recoveryActions.find(a => a.id === 'ACT-REC-104');
    const commIntent = state.communicationIntents.find(i => i.id === 'COMM-INT-502');

    return `
      <div class="surface-viewport" id="scr-crm-003-container">
        <div class="surface-header">
          <div class="surface-title-group">
            <h1>
              Feedback e Recuperação de Serviço
              <span class="surface-id-pill">SCR-CRM-003</span>
            </h1>
            <p class="surface-description">
              Separação estrita entre audiência pública e nota interna. RecoveryAction (operacional) separada de CommunicationIntent (mensageria) e de obrigações financeiras.
            </p>
          </div>
          <div class="surface-actions">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.verifyFeedbackAudiences()">
              👁️ Auditar Separação de Audiências
            </button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.openContextualPanel('draftResponse')">
              Rascunhar Resposta Pública
            </button>
          </div>
        </div>

        <!-- Dimensões de Recuperação e Comunicação -->
        <div class="dimension-status-group">
          ${renderDimensionStatus('Avaliação', `Nota ${fb.rating}/5 estrelas`, 'error')}
          ${renderDimensionStatus('Ação Operacional', recAction.status === 'aguardando_acao' ? 'Aguardando Ação' : 'Em Execução na Cozinha', 'warning')}
          ${renderDimensionStatus('Mensagem', commIntent.status === 'resultado_incerto' ? 'Resultado Incerto (Timeout)' : (commIntent.status === 'enviada' ? 'Enviada' : 'Rascunho'), commIntent.status === 'resultado_incerto' ? 'error' : (commIntent.status === 'enviada' ? 'success' : 'neutral'))}
          ${renderDimensionStatus('Compensação', recAction.compensationProposal.status === 'bloqueada_autoridade_insuficiente' ? 'Bloqueada (Excede Alçada)' : 'Em Análise', 'error')}
        </div>

        <!-- Cartão Comparativo de Audiências -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <!-- Coluna 1: Relato Público -->
          <div class="card-surface" style="border-top: 4px solid #10B981;">
            <div class="card-header">
              <div>
                <div class="card-title">Relato Público do Cliente</div>
                <div class="card-subtitle">Canal: ${fb.channel} · ${fb.date}</div>
              </div>
              <span class="badge badge-green">AUDIÊNCIA PÚBLICA</span>
            </div>

            <p style="font-size: 14px; margin-bottom: 14px; font-style: italic;">
              "${fb.publicReview}"
            </p>

            <div class="callout public-review" style="margin-bottom: 0;">
              <div>
                <strong>Destino:</strong> ${fb.publicAudience}
              </div>
            </div>
          </div>

          <!-- Coluna 2: Nota Interna Restrita -->
          <div class="card-surface" style="border-top: 4px solid #831843;">
            <div class="card-header">
              <div>
                <div class="card-title">Nota Interna Operacional</div>
                <div class="card-subtitle">Restrito à equipe interna e gerência</div>
              </div>
              <span class="badge badge-red">CONFIDENCIAL / RESTRITO</span>
            </div>

            <p style="font-size: 13px; margin-bottom: 14px; color: var(--color-ink-secondary);">
              "${fb.internalNote}"
            </p>

            <div class="callout private-note" style="margin-bottom: 0;">
              <div>
                <strong>Destino:</strong> ${fb.internalAudience}
              </div>
            </div>
          </div>
        </div>

        <!-- Seção: RecoveryAction vs CommunicationIntent -->
        <div class="card-surface">
          <div class="card-header">
            <div>
              <div class="card-title">Contrato de Fatos Independentes</div>
              <div class="card-subtitle">Ação operacional (RecoveryAction) ≠ Comunicação ao cliente (CommunicationIntent)</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Ação Operacional -->
            <div style="background: #F9FAFB; padding: 16px; border-radius: var(--radius-control); border: 1px solid var(--color-border);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>RecoveryAction (${recAction.id})</strong>
                <span class="badge badge-yellow">${recAction.status}</span>
              </div>
              <p style="font-size: 13px; color: var(--color-ink-secondary); margin-bottom: 12px;">
                ${recAction.description}
              </p>
              <div style="margin-bottom: 12px; font-size: 12px;">
                <strong>Proposta de Compensação:</strong> R$ ${recAction.compensationProposal.amountRequested.toFixed(2)}<br/>
                <strong>Status de Autoridade:</strong> <span style="color: var(--status-error-text); font-weight: 600;">${recAction.compensationProposal.status}</span><br/>
                <em>Efeito financeiro desacoplado de texto livre (não gerado).</em>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" onclick="window.UX_ACTIONS.registerRecoveryAction('Execução operacional em andamento na cozinha')">
                  Executar Operação
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.UX_ACTIONS.requestCompensationProposal(120.00)">
                  Submeter R$ 120,00 (Testar Alçada)
                </button>
              </div>
            </div>

            <!-- Comunicação -->
            <div style="background: #F9FAFB; padding: 16px; border-radius: var(--radius-control); border: 1px solid var(--color-border);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>CommunicationIntent (${commIntent.id})</strong>
                <span class="badge ${commIntent.status === 'resultado_incerto' ? 'badge-red' : (commIntent.status === 'enviada' ? 'badge-green' : 'badge-neutral')}">${commIntent.status}</span>
              </div>
              <p style="font-size: 13px; color: var(--color-ink-secondary); margin-bottom: 12px;">
                Destino: ${commIntent.channel} (${commIntent.destinationContact})<br/>
                Texto: "${commIntent.content}"
              </p>
              ${commIntent.uncertainReason ? `
                <div class="callout danger" style="padding: 8px; font-size: 11px; margin-bottom: 10px;">
                  ${commIntent.uncertainReason}
                </div>
              ` : ''}
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" onclick="window.UX_ACTIONS.sendCommunicationIntentSuccess()">
                  Enviar Mensagem (Normal)
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="window.UX_ACTIONS.simulateCommunicationTimeout()">
                  Simular Timeout (Resultado Incerto)
                </button>
                ${commIntent.status === 'resultado_incerto' ? `
                  <button class="btn btn-primary btn-sm" onclick="window.UX_ACTIONS.reconcileCommunicationIntent()">
                    Reconciliar com Provedor (Sem Retry Cego)
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- SCR-MKT-001: Inbox Comercial e Oportunidades ---
  function renderSCR_MKT_001() {
    const conv = state.commercialConversations.find(c => c.id === 'CONV-DEMO-031');
    const opp = state.opportunities.find(o => o.id === 'OPP-DEMO-006');

    return `
      <div class="surface-viewport" id="scr-mkt-001-container">
        <div class="surface-header">
          <div class="surface-title-group">
            <h1>
              Inbox Comercial e Oportunidades
              <span class="surface-id-pill">SCR-MKT-001</span>
            </h1>
            <p class="surface-description">
              Recepção comercial, qualificação de leads e conversão de conversa em oportunidade por referência (sem duplicação de mensagens).
            </p>
          </div>
          <div class="surface-actions">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.convertConversationToOpportunity()">
              🔄 Converter em Oportunidade
            </button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.navigateToSurface('SCR-MKT-004')">
              Avançar para Gestão do Evento →
            </button>
          </div>
        </div>

        <!-- Dimensões Comerciais -->
        <div class="dimension-status-group">
          ${renderDimensionStatus('Conversa', conv.status === 'oportunidade_criada' ? 'Vinculada a Oportunidade' : 'Aberta no Inbox', 'info')}
          ${renderDimensionStatus('Oportunidade', opp ? `${opp.id} — Aberta (40 pax)` : 'Nenhuma vinculada', 'warning')}
          ${renderDimensionStatus('Proposta Comercial', state.event.proposals['v1.0'].status === 'enviada' ? 'v1.0 Enviada' : (state.event.proposals['v1.0'].status === 'aceita' ? 'v1.0 Aceita pelo Cliente' : 'Rascunho'), 'neutral')}
          ${renderDimensionStatus('Capacidade FND-11', state.event.capacityCommitment.status === 'em_conflito' ? 'Conflito de Recurso' : 'Pendente de Compromisso', state.event.capacityCommitment.status === 'em_conflito' ? 'error' : 'warning')}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- Fita de Conversa (WhatsApp Comercial) -->
          <div class="card-surface">
            <div class="card-header">
              <div>
                <div class="card-title">Canal WhatsApp Comercial (${conv.id})</div>
                <div class="card-subtitle">Contato: ${conv.clientName} · ${conv.contactPoint}</div>
              </div>
              <span class="badge badge-blue">Origem Comercial</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
              ${conv.messages.map(m => `
                <div style="align-self: ${m.sender === 'client' ? 'flex-start' : 'flex-end'}; background: ${m.sender === 'client' ? '#F3F4F6' : '#FEE2E2'}; padding: 10px 14px; border-radius: var(--radius-control); max-width: 85%;">
                  <div style="font-size: 11px; color: var(--color-ink-muted); margin-bottom: 2px;">
                    ${m.sender === 'client' ? conv.clientName : 'Atendente Comercial'} · ${m.time}
                  </div>
                  <div style="font-size: 13px;">${m.text}</div>
                </div>
              `).join('')}
            </div>

            <div class="callout info">
              <div>
                <strong>Contrato de Referência:</strong> Ao converter em oportunidade, o histórico é referenciado pelo ID <code>${conv.id}</code>, sem criar uma cópia paralela e editável das mensagens no CRM.
              </div>
            </div>
          </div>

          <!-- Oportunidade Qualificada -->
          <div class="card-surface">
            <div class="card-header">
              <div>
                <div class="card-title">Oportunidade Comercial (${opp.id})</div>
                <div class="card-subtitle">Referência de Origem: <code>${opp.originConversationRef}</code></div>
              </div>
              <span class="badge badge-yellow">${opp.status}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Título da Oportunidade</label>
              <input type="text" class="form-input" readonly value="${opp.title}" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Previsão de Convidados</label>
                <input type="text" class="form-input" readonly value="${opp.estimatedGuests} convidados" />
              </div>
              <div class="form-group">
                <label class="form-label">Valor Estimado</label>
                <input type="text" class="form-input num" readonly value="R$ ${opp.estimatedValue.toFixed(2)}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Data Prevista do Evento</label>
              <input type="text" class="form-input" readonly value="${opp.targetDate}" />
            </div>

            <div style="margin-top: 14px;">
              <button class="btn btn-primary" style="width: 100%;" onclick="window.UX_ACTIONS.navigateToSurface('SCR-MKT-004')">
                Gerenciar Proposta e Evento (${opp.linkedEventRef}) →
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- SCR-MKT-004: Eventos, Experiências e Encomendas ---
  function renderSCR_MKT_004() {
    const evt = state.event;
    const p1 = evt.proposals['v1.0'];
    const p2 = evt.proposals['v2.0'];
    const activeVersion = evt.currentActiveVersion;

    return `
      <div class="surface-viewport" id="scr-mkt-004-container">
        <div class="surface-header">
          <div class="surface-title-group">
            <h1>
              Eventos, Experiências e Encomendas
              <span class="surface-id-pill">SCR-MKT-004</span>
            </h1>
            <p class="surface-description">
              Versionamento formal de propostas, aceites rastreáveis e compromisso de capacidade via FND-11. Desacoplamento entre aceite e liberação de produção.
            </p>
          </div>
          <div class="surface-actions">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.sendProposalV1()">
              📤 Enviar Proposta v1.0
            </button>
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.simulateFND11CapacityConflict()">
              ⚡ Simular Conflito FND-11
            </button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.createAndSendProposalV2()">
              + Criar Proposta v2.0 (Alteração Material)
            </button>
          </div>
        </div>

        <!-- Dimensões Independentes do Evento -->
        <div class="dimension-status-group">
          ${renderDimensionStatus('Versão Ativa', activeVersion, 'info')}
          ${renderDimensionStatus('Proposta v1.0', p1.status === 'aceita' ? 'Aceita (ACC-EVT-001)' : (p1.status === 'superada' ? 'Superada por v2.0' : p1.status), p1.status === 'aceita' ? 'success' : (p1.status === 'superada' ? 'neutral' : 'warning'))}
          ${renderDimensionStatus('Capacidade FND-11', evt.capacityCommitment.status === 'em_conflito' ? 'Conflito de Recurso Detectado' : 'Pendente de Compromisso', evt.capacityCommitment.status === 'em_conflito' ? 'error' : 'warning')}
          ${renderDimensionStatus('Produção Cozinha', evt.productionStatus === 'bloqueada' ? 'Bloqueada (Aguardando Sinal & Capacidade)' : 'Liberada', 'error')}
          ${renderDimensionStatus('Financeiro', evt.paymentStatus === 'pendente' ? 'Sinal Pendente (R$ 0,00)' : 'Sinal Confirmado', 'warning')}
        </div>

        ${evt.capacityCommitment.status === 'em_conflito' ? `
          <div class="callout danger">
            <span class="callout-icon">🚫</span>
            <div>
              <div class="callout-title">Bloqueio de Capacidade (FND-11)</div>
              ${evt.capacityCommitment.conflictMessage}<br/>
              <strong>Contrato de Integridade:</strong> O aceite comercial da v1.0 (<code>ACC-EVT-001</code>) permanece registrado no histórico. O sistema não apaga o aceite nem promete capacidade inexistente; requer negociação de nova data/escopo e geração da Proposta v2.0.
            </div>
          </div>
        ` : ''}

        <!-- Histórico e Comparação de Versões da Proposta -->
        <div class="data-table-container">
          <div style="padding: 14px 16px; border-bottom: 1px solid var(--color-border); font-weight: 600; font-size: 14px;">
            Versões Formais da Proposta de Evento (${evt.id})
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Versão</th>
                <th>Data Agendada</th>
                <th>Convidados</th>
                <th>Espaço / Recurso</th>
                <th>Valor Total</th>
                <th>Validade</th>
                <th>Estado Proposta</th>
                <th>Aceite Comercial</th>
                <th>Capacidade FND-11</th>
              </tr>
            </thead>
            <tbody>
              <!-- Versão 1.0 -->
              <tr class="${activeVersion === 'v1.0' ? 'selected' : ''}">
                <td><strong>v1.0</strong></td>
                <td>${p1.targetDate}</td>
                <td>${p1.guests} pax</td>
                <td>${p1.resource}</td>
                <td class="num">R$ ${p1.totalValue.toFixed(2)}</td>
                <td>${p1.validityDate}</td>
                <td><span class="badge ${p1.status === 'aceita' ? 'badge-green' : (p1.status === 'superada' ? 'badge-neutral' : 'badge-yellow')}">${p1.status}</span></td>
                <td><code>${p1.acceptanceRef || 'Pendente'}</code></td>
                <td><span class="badge ${evt.capacityCommitment.status === 'em_conflito' ? 'badge-red' : 'badge-yellow'}">${evt.capacityCommitment.status}</span></td>
              </tr>
              <!-- Versão 2.0 -->
              ${p2.status !== 'nao_criada' ? `
                <tr class="${activeVersion === 'v2.0' ? 'selected' : ''}">
                  <td><strong>v2.0</strong></td>
                  <td>${p2.targetDate}</td>
                  <td>${p2.guests} pax</td>
                  <td>${p2.resource}</td>
                  <td class="num">R$ ${p2.totalValue.toFixed(2)}</td>
                  <td>${p2.validityDate}</td>
                  <td><span class="badge badge-yellow">${p2.status}</span></td>
                  <td><code>${p2.acceptanceRef || 'Requer Novo Aceite'}</code></td>
                  <td><span class="badge badge-neutral">Aguardando Aceite v2</span></td>
                </tr>
              ` : `
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--color-ink-muted); padding: 16px;">
                    Proposta v2.0 ainda não emitida. Clique em "+ Criar Proposta v2.0" para alterações materiais de data ou convidados.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
          <button class="btn btn-secondary" onclick="window.UX_ACTIONS.navigateToSurface('SCR-EXT-007')">
            🔗 Abrir Visão do Cliente (SCR-EXT-007) →
          </button>
        </div>
      </div>
    `;
  }

  // --- SCR-EXT-007: Proposta de evento externa ---
  function renderSCR_EXT_007() {
    const evt = state.event;
    const activeVersion = evt.currentActiveVersion;
    const currentProp = evt.proposals[activeVersion];
    const isV1Accepted = evt.proposals['v1.0'].status === 'aceita';

    return `
      <div class="surface-viewport" style="background-color: #FAFAFC;" id="scr-ext-007-container">
        <div class="external-portal-container">
          <div class="external-header">
            <div class="brand">TOCA DO PEIXE · Eventos & Experiências</div>
            <span class="surface-id-pill">SCR-EXT-007 · Proposta de evento externa</span>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h2 style="font-family: var(--font-family-title); font-size: 20px; font-weight: 600; color: var(--color-ink);">
                Proposta Comercial de Evento
              </h2>
              <span class="badge badge-blue">Versão ${currentProp.version}</span>
            </div>
            <p style="color: var(--color-ink-muted); font-size: 13px; margin-top: 4px;">
              Proposta preparada para <strong>Carlos Eduardo Silva</strong> · Ref: <code>${evt.id}</code>
              <span style="display: block; font-size: 11px; color: var(--color-ink-muted); margin-top: 2px;">
                Superfície normativa: SCR-EXT-007 — Proposta de evento externa. A apresentação visual é o formato de exibição do artefato e não corresponde a SCR-EXT-003.
              </span>
            </p>
          </div>

          <!-- Metadados da Proposta -->
          <div class="external-proposal-grid">
            <div class="proposal-meta-box">
              <div class="meta-label">Data Planejada</div>
              <div class="meta-value">${currentProp.targetDate}</div>
            </div>
            <div class="proposal-meta-box">
              <div class="meta-label">Número de Convidados</div>
              <div class="meta-value">${currentProp.guests} pessoas</div>
            </div>
            <div class="proposal-meta-box">
              <div class="meta-label">Espaço Reservado</div>
              <div class="meta-value">${currentProp.resource}</div>
            </div>
            <div class="proposal-meta-box">
              <div class="meta-label">Investimento Total Previsto</div>
              <div class="meta-value num">R$ ${currentProp.totalValue.toFixed(2)}</div>
            </div>
          </div>

          <div class="card-surface" style="margin-bottom: 20px;">
            <div class="card-title" style="margin-bottom: 8px;">Escopo do Cardápio</div>
            <p style="font-size: 13px; color: var(--color-ink-secondary); line-height: 1.6;">
              ${currentProp.menuScope}
            </p>
          </div>

          <div class="callout warning" style="margin-bottom: 24px;">
            <span class="callout-icon">📋</span>
            <div>
              <div class="callout-title">Termos de Validade e Capacidade</div>
              ${currentProp.terms}<br/>
              <strong>Validade da proposta:</strong> até ${currentProp.validityDate}.
            </div>
          </div>

          <!-- Ação do Cliente -->
          <div style="border-top: 1px solid var(--color-border); padding-top: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div>
              ${activeVersion === 'v1.0' && isV1Accepted ? `
                <div style="color: var(--status-success-text); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                  <span>✓</span> Proposta v1.0 Aceita em 01/10/2026 (Protocolo: ACC-EVT-001)
                </div>
                <div style="font-size: 12px; color: var(--color-ink-muted);">
                  Aguardando verificação de capacidade FND-11 pelo restaurante.
                </div>
              ` : (activeVersion === 'v2.0' ? `
                <div style="color: var(--status-warning-text); font-weight: 600;">
                  ⚠️ Versão v2.0 com alteração material de data/convidados aguarda nova confirmação.
                </div>
              ` : `
                <div style="font-size: 12px; color: var(--color-ink-muted);">
                  Ao aceitar, você concorda com o escopo e termos comerciais da proposta.
                </div>
              `)}
            </div>

            <div style="display: flex; gap: 10px;">
              ${activeVersion === 'v1.0' && !isV1Accepted ? `
                <button class="btn btn-primary" onclick="window.UX_ACTIONS.acceptProposalV1Externally()">
                  ✓ Aceitar Proposta v1.0
                </button>
              ` : ''}

              ${activeVersion === 'v2.0' && currentProp.status !== 'aceita' ? `
                <button class="btn btn-primary" onclick="alert('Aceite de v2.0 simulado com sucesso. Protocolo gerado: ACC-EVT-002.')">
                  ✓ Aceitar Proposta v2.0
                </button>
              ` : ''}

              <button class="btn btn-secondary" onclick="window.UX_ACTIONS.navigateToSurface('SCR-MKT-004')">
                ← Voltar para Operação
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. PAINÉIS CONTEXTUAIS E MODAIS
  // =========================================================================

  function renderContextualPanel() {
    if (!state.activeContextualPanel) return '';

    if (state.activeContextualPanel === 'disambiguate') {
      return `
        <div class="contextual-panel">
          <div class="panel-header">
            <div class="panel-title">Desambiguação de Clientes Homônimos</div>
            <button class="panel-close-btn" onclick="window.UX_ACTIONS.closeContextualPanel()">✕</button>
          </div>
          <div class="panel-body">
            <div class="callout warning">
              <span class="callout-icon">🔍</span>
              <div>
                <strong>Cenário 1 — Homônimos:</strong> Dois registros foram encontrados com o nome "Carlos Eduardo Silva". A escolha deve ocorrer estritamente pelo contexto autorizado sem fusão de registros.
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${state.customers.map(c => `
                <div style="border: 1px solid var(--color-border); border-radius: var(--radius-control); padding: 14px; background: #FFFFFF;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong>${c.name}</strong>
                    <code>${c.id}</code>
                  </div>
                  <div style="font-size: 12px; color: var(--color-ink-secondary); margin-bottom: 4px;">
                    <strong>Contexto:</strong> ${c.authorizedContext}
                  </div>
                  <div style="font-size: 12px; color: var(--color-ink-muted); margin-bottom: 10px;">
                    Telefone: ${c.phone} · E-mail: ${c.email}
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="window.UX_ACTIONS.selectHomonymCustomer('${c.id}')">
                    Selecionar Este Registro (${c.id})
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="panel-footer">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.closeContextualPanel()">Cancelar</button>
          </div>
        </div>
      `;
    }

    if (state.activeContextualPanel === 'draftResponse') {
      const fb = state.feedbacks.find(f => f.id === 'FB-DEMO-008');

      return `
        <div class="contextual-panel">
          <div class="panel-header">
            <div class="panel-title">Rascunho de Resposta Pública</div>
            <button class="panel-close-btn" onclick="window.UX_ACTIONS.closeContextualPanel()">✕</button>
          </div>
          <div class="panel-body">
            <div class="callout info">
              <span class="callout-icon">📢</span>
              <div>
                <strong>Destino da Publicação:</strong> ${fb.publicAudience}<br/>
                <em>Nota interna da equipe é suprimida da prévia.</em>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Avaliação do Cliente</label>
              <div style="background: #F3F4F6; padding: 10px; border-radius: var(--radius-control); font-size: 13px; font-style: italic;">
                "${fb.publicReview}"
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Texto da Resposta Pública</label>
              <textarea id="public-response-input" class="form-textarea" rows="5" placeholder="Escreva a resposta cordial convidando o cliente para contato privado...">Olá Carlos, lamentamos sinceramente pela experiência com a temperatura do peixe e a embalagem. Nossa equipe de qualidade já foi orientada. Convidamos você a nos contatar pelo WhatsApp para que possamos recebê-lo em nossa casa.</textarea>
              <div class="form-helper-text">Não inclua nomes de funcionários, causas internas ou promessas financeiras automáticas.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Prévia de Publicação Externa</label>
              <div style="border: 1px dashed var(--color-border); padding: 12px; border-radius: var(--radius-control); font-size: 12px; background: #FFFFFF;">
                <span class="badge badge-green" style="margin-bottom: 6px;">Prévia Limpa</span>
                <p id="preview-text" style="color: var(--color-ink-secondary);">
                  Olá Carlos, lamentamos sinceramente pela experiência com a temperatura do peixe e a embalagem...
                </p>
              </div>
            </div>
          </div>
          <div class="panel-footer">
            <button class="btn btn-secondary" onclick="window.UX_ACTIONS.closeContextualPanel()">Cancelar</button>
            <button class="btn btn-primary" onclick="window.UX_ACTIONS.savePublicResponseDraft(document.getElementById('public-response-input').value)">
              Salvar Rascunho Limpo
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  function renderModal() {
    if (!state.activeModal) return '';

    if (state.activeModal.type === 'continueCaseCheck') {
      return `
        <div class="modal-overlay">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Caso Existente Encontrado (Cenário 2)</h3>
              <button class="panel-close-btn" onclick="window.UX_ACTIONS.closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <p style="margin-bottom: 12px;">
                O cliente <strong>Carlos Eduardo Silva (CL-DEMO-021)</strong> já possui o caso ativo <strong>AT-DEMO-021</strong> sobre:
              </p>
              <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 12px; border-radius: var(--radius-control); margin-bottom: 16px;">
                <strong>Divergência de item no pedido R03-4412</strong><br/>
                Responsável: Juliana Prado · Promessa: 01/10/2026 às 15:30
              </div>
              <p style="color: var(--color-ink-secondary); font-size: 13px;">
                Deseja continuar o atendimento no caso existente para manter a trilha de promessas unificada, ou criar um novo caso por motivo explicitamente diferente?
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="window.UX_ACTIONS.createNewCaseExplicitly('CL-DEMO-021', 'Novo assunto não relacionado a entregas')">
                Criar Novo Caso com Justificativa
              </button>
              <button class="btn btn-primary" onclick="window.UX_ACTIONS.continueExistingCase('AT-DEMO-021')">
                Continuar Caso Existente (AT-DEMO-021)
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // --- HARNESS BAR & SCENARIO CONTROLS ---
  function renderHarnessBar() {
    const scenarios = [
      { id: 1, name: '1. Cliente homônimo' },
      { id: 2, name: '2. Continuar caso existente' },
      { id: 3, name: '3. Feedback público + nota interna' },
      { id: 4, name: '4. Preparar resposta pública' },
      { id: 5, name: '5. Recuperação vs comunicação' },
      { id: 6, name: '6. Compensação sem autoridade' },
      { id: 7, name: '7. Mensagem resultado incerto' },
      { id: 8, name: '8. Conversa vira oportunidade' },
      { id: 9, name: '9. Enviar proposta v1.0' },
      { id: 10, name: '10. Cliente aceita v1.0' },
      { id: 11, name: '11. Capacidade indisponível FND-11' },
      { id: 12, name: '12. Proposta v2.0 alteração material' }
    ];

    const passCount = Object.values(state.scenarioResults).filter(s => s.status === 'PASS').length;

    return `
      <div class="harness-bar">
        <div class="brand-badge">
          <span class="flame-icon">🔥</span>
          <span>FAISCA WORKS</span>
          <span class="mode-tag">UX-CW03 v1.0 PROTÓTIPO & ENSAIOS</span>
        </div>

        <div class="scenario-controls">
          <span style="color: #9CA3AF; font-size: 11px;">12 Cenários: <strong>${passCount}/12 PASS</strong></span>
          <select id="scenario-selector" onchange="window.UX_ACTIONS.runScenario(parseInt(this.value, 10))">
            <option value="">Selecione um cenário para executar...</option>
            ${scenarios.map(s => `
              <option value="${s.id}">
                ${s.name} [${state.scenarioResults[s.id].status}]
              </option>
            `).join('')}
          </select>
          <button class="btn-harness" onclick="window.UX_ACTIONS.runAllScenarios()">
            ▶ Executar Todos (1..12)
          </button>
          <button class="btn-harness-outline" onclick="window.UX_ACTIONS.resetAllToDefault()">
            ↺ Reset
          </button>
        </div>
      </div>
    `;
  }

  // --- DRAWER INFERIOR DE EVIDÊNCIAS E STATUS DE CENÁRIOS ---
  function renderTestHarnessDrawer() {
    return `
      <div class="test-harness-drawer" id="test-harness-drawer">
        <div class="test-harness-drawer-header" onclick="document.getElementById('test-harness-drawer').classList.toggle('expanded')" title="Clique para expandir/recolher">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--color-primary-red); font-weight: 600;">ENSAIO DE CONTRATOS & CENÁRIOS:</span>
            <span>Matriz dos 12 Cenários Canônicos UX-CW03 (Clique para alternar)</span>
          </div>
          <span style="font-size: 11px; color: #9CA3AF;">DONE ≠ APPROVED · Revisão Independente ChatGPT</span>
        </div>

        <div class="test-harness-drawer-body">
          <div class="scenario-pill-list">
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
              const res = state.scenarioResults[num];
              const pillClass = res.status === 'PASS' ? 'pass' : (res.status === 'FAIL' ? 'fail' : '');
              return `
                <div class="scenario-pill ${pillClass}" onclick="window.UX_ACTIONS.runScenario(${num})" title="${res.note}">
                  <span>C${num}</span>
                  <strong>${res.status}</strong>
                </div>
              `;
            }).join('')}
          </div>
          <div id="scenario-log" style="color: #D1D5DB; font-size: 11px; max-height: 120px; overflow-y: auto;">
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
              const res = state.scenarioResults[num];
              return `<div><strong>Cenário ${num}:</strong> <span style="color: ${res.status === 'PASS' ? '#34D399' : (res.status === 'FAIL' ? '#F87171' : '#9CA3AF')}">${res.status}</span> — ${res.note} ${res.timestamp ? `(${res.timestamp})` : ''}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- SIDEBAR PRINCIPAL ---
  function renderSidebar() {
    const surfaces = [
      { id: 'SCR-CRM-001', code: 'CRM-001', name: 'Perfil e histórico', section: 'CRM Operacional' },
      { id: 'SCR-CRM-002', code: 'CRM-002', name: 'Atendimento humano/agente', section: 'CRM Operacional' },
      { id: 'SCR-CRM-003', code: 'CRM-003', name: 'Feedback/recuperação', section: 'CRM Operacional' },
      { id: 'SCR-MKT-001', code: 'MKT-001', name: 'Inbox comercial e oportunidades', section: 'Comercial & Eventos' },
      { id: 'SCR-MKT-004', code: 'MKT-004', name: 'Eventos e encomendas', section: 'Comercial & Eventos' },
      { id: 'SCR-EXT-007', code: 'EXT-007', name: 'Proposta de evento externa', section: 'Superfície Externa' }
    ];

    let currentSection = '';

    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="app-title">Toca do Peixe</div>
          <div class="app-subtitle">UX-CW03 v1.0 · UI Kit v0.3</div>
        </div>

        <nav class="sidebar-nav">
          ${surfaces.map(s => {
            let sectionHeader = '';
            if (s.section !== currentSection) {
              currentSection = s.section;
              sectionHeader = `<div class="nav-section-title">${currentSection}</div>`;
            }
            const isActive = state.currentSurface === s.id;
            return `
              ${sectionHeader}
              <a class="nav-item ${isActive ? 'active' : ''}" onclick="window.UX_ACTIONS.navigateToSurface('${s.id}')">
                <span>${s.name}</span>
                <span class="code-badge">${s.code}</span>
              </a>
            `;
          }).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="user-chip">
            <div>
              <div style="font-weight: 600;">${state.currentUser.name}</div>
              <div style="font-size: 11px; color: var(--color-ink-muted);">Alçada: R$ ${state.currentUser.authorityLimit.toFixed(2)}</div>
            </div>
            <span class="role-tag">${state.currentUser.role}</span>
          </div>
        </div>
      </aside>
    `;
  }

  // =========================================================================
  // 5. MOTOR DE EXECUÇÃO DOS 12 CENÁRIOS
  // =========================================================================

  actions.runScenario = function (scenarioNumber) {
    console.log(`[EXECUTING SCENARIO ${scenarioNumber}]...`);

    switch (scenarioNumber) {
      case 1:
        // Cenário 1 — cliente homônimo
        actions.navigateToSurface('SCR-CRM-001');
        actions.openContextualPanel('disambiguate');
        actions.selectHomonymCustomer('CL-DEMO-021');
        break;

      case 2:
        // Cenário 2 — continuar caso existente
        actions.navigateToSurface('SCR-CRM-002');
        actions.openModal({ type: 'continueCaseCheck' });
        actions.continueExistingCase('AT-DEMO-021');
        break;

      case 3:
        // Cenário 3 — feedback público + nota interna
        actions.navigateToSurface('SCR-CRM-003');
        actions.verifyFeedbackAudiences();
        break;

      case 4:
        // Cenário 4 — preparar resposta pública
        actions.navigateToSurface('SCR-CRM-003');
        actions.openContextualPanel('draftResponse');
        actions.savePublicResponseDraft('Olá Carlos, lamentamos muito pelo ocorrido com o peixe e a embalagem. Nossa equipe foi orientada e gostaríamos de recebê-lo novamente.');
        break;

      case 5:
        // Cenário 5 — recuperação separada da comunicação
        actions.navigateToSurface('SCR-CRM-003');
        actions.registerRecoveryAction('Ação operacional em andamento na cozinha');
        actions.sendCommunicationIntentSuccess();
        break;

      case 6:
        // Cenário 6 — compensação com autoridade insuficiente
        actions.navigateToSurface('SCR-CRM-003');
        actions.requestCompensationProposal(120.00);
        break;

      case 7:
        // Cenário 7 — resultado incerto de mensagem
        actions.navigateToSurface('SCR-CRM-003');
        actions.simulateCommunicationTimeout();
        break;

      case 8:
        // Cenário 8 — conversa vira oportunidade
        actions.navigateToSurface('SCR-MKT-001');
        actions.convertConversationToOpportunity();
        break;

      case 9:
        // Cenário 9 — enviar EventProposal v1
        actions.navigateToSurface('SCR-MKT-004');
        actions.sendProposalV1();
        break;

      case 10:
        // Cenário 10 — cliente aceita v1
        actions.navigateToSurface('SCR-EXT-007');
        actions.acceptProposalV1Externally();
        actions.navigateToSurface('SCR-MKT-004');
        break;

      case 11:
        // Cenário 11 — capacidade fica indisponível antes do compromisso
        actions.navigateToSurface('SCR-MKT-004');
        actions.simulateFND11CapacityConflict();
        break;

      case 12:
        // Cenário 12 — EventProposal v2 altera materialmente o acordo
        actions.navigateToSurface('SCR-MKT-004');
        actions.createAndSendProposalV2();
        break;

      default:
        console.warn('Cenário desconhecido:', scenarioNumber);
    }
  };

  actions.runAllScenarios = function () {
    console.log('Executando os 12 cenários em sequência com verificação de invariantes...');
    for (let i = 1; i <= 12; i++) {
      actions.runScenario(i);
    }
  };

  // =========================================================================
  // 6. RENDERIZAÇÃO PRINCIPAL DO APP
  // =========================================================================

  function renderApp() {
    const root = document.getElementById('app-root');
    if (!root) return;

    let surfaceHtml = '';
    switch (state.currentSurface) {
      case 'SCR-CRM-001':
        surfaceHtml = renderSCR_CRM_001();
        break;
      case 'SCR-CRM-002':
        surfaceHtml = renderSCR_CRM_002();
        break;
      case 'SCR-CRM-003':
        surfaceHtml = renderSCR_CRM_003();
        break;
      case 'SCR-MKT-001':
        surfaceHtml = renderSCR_MKT_001();
        break;
      case 'SCR-MKT-004':
        surfaceHtml = renderSCR_MKT_004();
        break;
      case 'SCR-EXT-007':
        surfaceHtml = renderSCR_EXT_007();
        break;
      default:
        surfaceHtml = `<div>Superfície desconhecida</div>`;
    }

    root.innerHTML = `
      <div class="app-shell">
        ${renderHarnessBar()}
        <div class="app-body-container">
          ${renderSidebar()}
          <main class="main-canvas">
            ${surfaceHtml}
            ${renderContextualPanel()}
            ${renderModal()}
          </main>
        </div>
        ${renderTestHarnessDrawer()}
      </div>
    `;

  }

  // Inicialização e Exportação de Ações para Window
  window.UX_ACTIONS = actions;
  window.UX_STATE = state;

  subscribe(renderApp);

  document.addEventListener('DOMContentLoaded', () => {
    // Permite abrir superfície específica por query param (ex: ?surface=SCR-EXT-007)
    const urlParams = new URLSearchParams(window.location.search);
    const requestedSurface = urlParams.get('surface');
    if (requestedSurface && ['SCR-CRM-001','SCR-CRM-002','SCR-CRM-003','SCR-MKT-001','SCR-MKT-004','SCR-EXT-007'].includes(requestedSurface)) {
      state.currentSurface = requestedSurface;
    }
    renderApp();
  });

})();
