/**
 * Automated Test Runner & Visual Verification Harness
 * Toca do Peixe — UX-CW03 v1.0
 * 
 * Uses Headless Chrome via Chrome DevTools Protocol (CDP) and native Node.js HTTP/WebSocket.
 * No external dependencies required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROTOTYPE_DIR = path.resolve(__dirname);
const EVIDENCE_DIR = path.join(PROTOTYPE_DIR, 'evidence');
const SCREENSHOTS_DIR = path.join(EVIDENCE_DIR, 'screenshots');
const PORT = 8989;
const CHROME_PORT = 9223;

// Criar diretórios de evidência
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// 1. Static Server
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(PROTOTYPE_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

// 2. CDP Helper
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.errors = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const err = msg.params.exceptionDetails;
          this.errors.push(err.text || (err.exception && err.exception.description) || 'Runtime Exception');
        }

        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 600
    });
    await this.send('Emulation.setVisibleSize', { width, height });
  }

  async captureScreenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const dest = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(dest, buffer);
    console.log(`  📸 Screenshot salvo: ${filename} (${buffer.length} bytes)`);
    return dest;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('================================================================');
  console.log('TOCA DO PEIXE — ENSAIO AUTÔNOMO DOS 12 CENÁRIOS UX-CW03 v1.0');
  console.log('================================================================\n');

  // Start HTTP server
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[1] Servidor estático local iniciado em http://localhost:${PORT}`);

  // Launch Chrome Headless
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeArgs = [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--safebrowsing-disable-auto-update',
    '--user-data-dir=/tmp/chrome-test-profile-' + Date.now(),
    'about:blank'
  ];

  console.log('[2] Iniciando Google Chrome Headless com remote debugging...');
  const chromeProc = spawn(chromePath, chromeArgs);

  // Aguardar porta CDP ficar acessível
  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    await wait(400);
    try {
      const resp = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
      const targets = await resp.json();
      pageTarget = targets.find(t => t.type === 'page');
      if (pageTarget) break;
    } catch (e) {
      // continua tentando
    }
  }

  if (!pageTarget) {
    throw new Error('Falha ao conectar no Chrome via CDP.');
  }

  console.log(`[3] Alvo CDP encontrado: ${pageTarget.webSocketDebuggerUrl}`);
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  // Viewport Desktop Padrão (1440 x 900)
  await client.setViewport(1440, 900);

  // Navegar para a aplicação
  console.log(`[4] Carregando http://localhost:${PORT}...`);
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/index.html` });
  await wait(1000);

  const scenarioLog = [];

  // =========================================================================
  // EXECUÇÃO E VERIFICAÇÃO DOS 12 CENÁRIOS
  // =========================================================================

  console.log('\n[5] Executando e Verificando os 12 Cenários...');

  // --- CENÁRIO 1: Cliente homônimo ---
  console.log('\n▶ Cenário 1: Cliente homônimo');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-CRM-001')");
  await client.eval("window.UX_ACTIONS.openContextualPanel('disambiguate')");
  await wait(400);
  await client.captureScreenshot('cenario-01-homonimo-painel-busca.png');

  // Selecionar CL-DEMO-021 pelo contexto
  await client.eval("window.UX_ACTIONS.selectHomonymCustomer('CL-DEMO-021')");
  await wait(300);
  const c1State = await client.eval(`({
    customersCount: window.UX_STATE.customers.length,
    selectedId: window.UX_STATE.selectedCustomer.id,
    c021Context: window.UX_STATE.customers.find(c => c.id === 'CL-DEMO-021').authorizedContext,
    c088Context: window.UX_STATE.customers.find(c => c.id === 'CL-DEMO-088').authorizedContext,
    res: window.UX_STATE.scenarioResults[1]
  })`);

  let c1Pass = (c1State.customersCount === 2 && c1State.selectedId === 'CL-DEMO-021' && c1State.res.status === 'PASS');
  scenarioLog.push({ id: 1, name: 'Cliente homônimo', pass: c1Pass, note: c1State.res.note });
  console.log(`  Resultado C1: ${c1Pass ? 'PASS' : 'FAIL'} — ${c1State.res.note}`);
  await client.captureScreenshot('cenario-01-homonimo-selecionado.png');

  // --- CENÁRIO 2: Continuar caso existente ---
  console.log('\n▶ Cenário 2: Continuar caso existente');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-CRM-002')");
  await client.eval("window.UX_ACTIONS.openModal({ type: 'continueCaseCheck' })");
  await wait(400);
  await client.captureScreenshot('cenario-02-modal-caso-existente.png');

  await client.eval("window.UX_ACTIONS.continueExistingCase('AT-DEMO-021')");
  await wait(300);
  const c2State = await client.eval(`({
    casesCount: window.UX_STATE.cases.length,
    caseId: window.UX_STATE.cases[0].id,
    caseStatus: window.UX_STATE.cases[0].status,
    res: window.UX_STATE.scenarioResults[2]
  })`);

  let c2Pass = (c2State.casesCount === 1 && c2State.caseId === 'AT-DEMO-021' && c2State.caseStatus === 'em_atendimento' && c2State.res.status === 'PASS');
  scenarioLog.push({ id: 2, name: 'Continuar caso existente', pass: c2Pass, note: c2State.res.note });
  console.log(`  Resultado C2: ${c2Pass ? 'PASS' : 'FAIL'} — ${c2State.res.note}`);
  await client.captureScreenshot('cenario-02-caso-atendido.png');

  // --- CENÁRIO 3: Feedback público + nota interna ---
  console.log('\n▶ Cenário 3: Feedback público + nota interna');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-CRM-003')");
  await client.eval("window.UX_ACTIONS.verifyFeedbackAudiences()");
  await wait(400);

  const c3State = await client.eval(`({
    fb: window.UX_STATE.feedbacks.find(f => f.id === 'FB-DEMO-008'),
    res: window.UX_STATE.scenarioResults[3]
  })`);

  let c3Pass = (c3State.fb.publicAudience.includes('PÚBLICO') && c3State.fb.internalAudience.includes('INTERNO / PRIVADO') && c3State.res.status === 'PASS');
  scenarioLog.push({ id: 3, name: 'Feedback público + nota interna', pass: c3Pass, note: c3State.res.note });
  console.log(`  Resultado C3: ${c3Pass ? 'PASS' : 'FAIL'} — ${c3State.res.note}`);
  await client.captureScreenshot('cenario-03-audiencias-separadas.png');

  // --- CENÁRIO 4: Preparar resposta pública ---
  console.log('\n▶ Cenário 4: Preparar resposta pública');
  await client.eval("window.UX_ACTIONS.openContextualPanel('draftResponse')");
  await wait(400);
  await client.captureScreenshot('cenario-04-rascunho-resposta-painel.png');

  await client.eval("window.UX_ACTIONS.savePublicResponseDraft('Olá Carlos, lamentamos muito pela experiência com o peixe e a embalagem. Nossa equipe foi orientada e convidamos você a nos contatar no WhatsApp para recebê-lo.')");
  await wait(300);

  const c4State = await client.eval(`({
    fb: window.UX_STATE.feedbacks.find(f => f.id === 'FB-DEMO-008'),
    res: window.UX_STATE.scenarioResults[4]
  })`);

  let c4Pass = (c4State.fb.publicResponseStatus === 'rascunho' && !c4State.fb.publicResponseDraft.includes('pico') && c4State.res.status === 'PASS');
  scenarioLog.push({ id: 4, name: 'Preparar resposta pública', pass: c4Pass, note: c4State.res.note });
  console.log(`  Resultado C4: ${c4Pass ? 'PASS' : 'FAIL'} — ${c4State.res.note}`);

  // --- CENÁRIO 5: Recuperação separada da comunicação ---
  console.log('\n▶ Cenário 5: Recuperação separada da comunicação');
  await client.eval("window.UX_ACTIONS.registerRecoveryAction('Cozinha instruída a lacrar molhos e preparar cortesia')");
  await client.eval("window.UX_ACTIONS.sendCommunicationIntentSuccess()");
  await wait(300);

  const c5State = await client.eval(`({
    action: window.UX_STATE.recoveryActions.find(a => a.id === 'ACT-REC-104'),
    intent: window.UX_STATE.communicationIntents.find(i => i.id === 'COMM-INT-502'),
    res: window.UX_STATE.scenarioResults[5]
  })`);

  let c5Pass = (c5State.intent.status === 'enviada' && c5State.action.status !== 'executada_operacionalmente' && c5State.res.status === 'PASS');
  scenarioLog.push({ id: 5, name: 'Recuperação separada da comunicação', pass: c5Pass, note: c5State.res.note });
  console.log(`  Resultado C5: ${c5Pass ? 'PASS' : 'FAIL'} — ${c5State.res.note}`);
  await client.captureScreenshot('cenario-05-recuperacao-vs-comunicacao.png');

  // --- CENÁRIO 6: Compensação com autoridade insuficiente ---
  console.log('\n▶ Cenário 6: Compensação com autoridade insuficiente');
  await client.eval("window.UX_ACTIONS.requestCompensationProposal(120.00)");
  await wait(300);

  const c6State = await client.eval(`({
    proposal: window.UX_STATE.recoveryActions.find(a => a.id === 'ACT-REC-104').compensationProposal,
    res: window.UX_STATE.scenarioResults[6]
  })`);

  let c6Pass = (c6State.proposal.status === 'bloqueada_autoridade_insuficiente' && c6State.proposal.financialAdjustmentRef === null && c6State.res.status === 'PASS');
  scenarioLog.push({ id: 6, name: 'Compensação com autoridade insuficiente', pass: c6Pass, note: c6State.res.note });
  console.log(`  Resultado C6: ${c6Pass ? 'PASS' : 'FAIL'} — ${c6State.res.note}`);
  await client.captureScreenshot('cenario-06-compensacao-bloqueada.png');

  // --- CENÁRIO 7: Resultado incerto de mensagem ---
  console.log('\n▶ Cenário 7: Resultado incerto de mensagem');
  await client.eval("window.UX_ACTIONS.simulateCommunicationTimeout()");
  await wait(300);

  const c7PreState = await client.eval(`({
    intent: window.UX_STATE.communicationIntents.find(i => i.id === 'COMM-INT-502'),
    res: window.UX_STATE.scenarioResults[7]
  })`);

  let c7PrePass = (c7PreState.intent.status === 'resultado_incerto' && c7PreState.intent.dispatchAttempts === 2);
  await client.captureScreenshot('cenario-07-resultado-incerto-timeout.png');

  // Reconciliar sem retry cego
  await client.eval("window.UX_ACTIONS.reconcileCommunicationIntent()");
  await wait(300);

  const c7PostState = await client.eval(`({
    intent: window.UX_STATE.communicationIntents.find(i => i.id === 'COMM-INT-502')
  })`);

  let c7Pass = (c7PrePass && c7PostState.intent.status === 'reconciliada_sucesso' && c7PostState.intent.dispatchAttempts === 2);
  scenarioLog.push({ id: 7, name: 'Resultado incerto de mensagem', pass: c7Pass, note: c7PreState.res.note });
  console.log(`  Resultado C7: ${c7Pass ? 'PASS' : 'FAIL'} — ${c7PreState.res.note}`);
  await client.captureScreenshot('cenario-07-reconciliado.png');

  // --- CENÁRIO 8: Conversa vira oportunidade ---
  console.log('\n▶ Cenário 8: Conversa vira oportunidade');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-MKT-001')");
  await client.eval("window.UX_ACTIONS.convertConversationToOpportunity()");
  await wait(400);

  const c8State = await client.eval(`({
    conv: window.UX_STATE.commercialConversations.find(c => c.id === 'CONV-DEMO-031'),
    opp: window.UX_STATE.opportunities.find(o => o.id === 'OPP-DEMO-006'),
    res: window.UX_STATE.scenarioResults[8]
  })`);

  let c8Pass = (c8State.conv.status === 'oportunidade_criada' && c8State.opp.originConversationRef === 'CONV-DEMO-031' && c8State.res.status === 'PASS');
  scenarioLog.push({ id: 8, name: 'Conversa vira oportunidade', pass: c8Pass, note: c8State.res.note });
  console.log(`  Resultado C8: ${c8Pass ? 'PASS' : 'FAIL'} — ${c8State.res.note}`);
  await client.captureScreenshot('cenario-08-conversa-vira-oportunidade.png');

  // --- CENÁRIO 9: Enviar EventProposal v1 ---
  console.log('\n▶ Cenário 9: Enviar EventProposal v1');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-MKT-004')");
  await client.eval("window.UX_ACTIONS.sendProposalV1()");
  await wait(400);

  const c9State = await client.eval(`({
    p1: window.UX_STATE.event.proposals['v1.0'],
    evt: window.UX_STATE.event,
    res: window.UX_STATE.scenarioResults[9]
  })`);

  let c9Pass = (c9State.p1.status === 'enviada' && c9State.evt.capacityCommitment.status === 'pendente' && c9State.evt.productionStatus === 'bloqueada' && c9State.evt.paymentStatus === 'pendente' && c9State.res.status === 'PASS');
  scenarioLog.push({ id: 9, name: 'Enviar EventProposal v1', pass: c9Pass, note: c9State.res.note });
  console.log(`  Resultado C9: ${c9Pass ? 'PASS' : 'FAIL'} — ${c9State.res.note}`);
  await client.captureScreenshot('cenario-09-proposta-v1-enviada.png');

  // --- CENÁRIO 10: Cliente aceita v1 ---
  console.log('\n▶ Cenário 10: Cliente aceita v1');
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-EXT-007')");
  await wait(400);
  await client.captureScreenshot('cenario-10-portal-cliente-proposta.png');

  await client.eval("window.UX_ACTIONS.acceptProposalV1Externally()");
  await wait(400);
  await client.captureScreenshot('cenario-10-cliente-aceitou-v1.png');

  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-MKT-004')");
  await wait(400);

  const c10State = await client.eval(`({
    p1: window.UX_STATE.event.proposals['v1.0'],
    acc: window.UX_STATE.event.proposalAcceptances['ACC-EVT-001'],
    evt: window.UX_STATE.event,
    res: window.UX_STATE.scenarioResults[10]
  })`);

  let c10Pass = (c10State.p1.status === 'aceita' && c10State.p1.acceptanceRef === 'ACC-EVT-001' && c10State.acc.proposalVersion === 'v1.0' && c10State.evt.capacityCommitment.status === 'pendente' && c10State.evt.productionStatus === 'bloqueada' && c10State.evt.paymentStatus === 'pendente' && c10State.res.status === 'PASS');
  scenarioLog.push({ id: 10, name: 'Cliente aceita v1', pass: c10Pass, note: c10State.res.note });
  console.log(`  Resultado C10: ${c10Pass ? 'PASS' : 'FAIL'} — ${c10State.res.note}`);
  await client.captureScreenshot('cenario-10-aceite-v1-no-gestor.png');

  // --- CENÁRIO 11: Capacidade indisponível FND-11 antes do compromisso ---
  console.log('\n▶ Cenário 11: Capacidade indisponível FND-11');
  await client.eval("window.UX_ACTIONS.simulateFND11CapacityConflict()");
  await wait(400);

  const c11State = await client.eval(`({
    p1: window.UX_STATE.event.proposals['v1.0'],
    acc: window.UX_STATE.event.proposalAcceptances['ACC-EVT-001'],
    evt: window.UX_STATE.event,
    res: window.UX_STATE.scenarioResults[11]
  })`);

  let c11Pass = (c11State.evt.capacityCommitment.status === 'em_conflito' && c11State.p1.acceptanceRef === 'ACC-EVT-001' && c11State.acc !== undefined && c11State.res.status === 'PASS');
  scenarioLog.push({ id: 11, name: 'Capacidade indisponível FND-11', pass: c11Pass, note: c11State.res.note });
  console.log(`  Resultado C11: ${c11Pass ? 'PASS' : 'FAIL'} — ${c11State.res.note}`);
  await client.captureScreenshot('cenario-11-conflito-capacidade-fnd11.png');

  // --- CENÁRIO 12: EventProposal v2 altera materialmente o acordo ---
  console.log('\n▶ Cenário 12: EventProposal v2 altera materialmente o acordo');
  await client.eval("window.UX_ACTIONS.createAndSendProposalV2()");
  await wait(400);

  const c12State = await client.eval(`({
    p1: window.UX_STATE.event.proposals['v1.0'],
    p2: window.UX_STATE.event.proposals['v2.0'],
    accV1: window.UX_STATE.event.proposalAcceptances['ACC-EVT-001'],
    currentVersion: window.UX_STATE.event.currentActiveVersion,
    res: window.UX_STATE.scenarioResults[12]
  })`);

  let c12Pass = (c12State.p1.status === 'superada' && c12State.p1.acceptanceRef === 'ACC-EVT-001' && c12State.p2.status === 'enviada' && c12State.p2.acceptanceRef === null && c12State.currentVersion === 'v2.0' && c12State.res.status === 'PASS');
  scenarioLog.push({ id: 12, name: 'EventProposal v2 alteração material', pass: c12Pass, note: c12State.res.note });
  console.log(`  Resultado C12: ${c12Pass ? 'PASS' : 'FAIL'} — ${c12State.res.note}`);
  await client.captureScreenshot('cenario-12-proposta-v2-emitida.png');

  // Visão externa da v2 em SCR-EXT-007 (Proposta de evento externa)
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-EXT-007')");
  await wait(400);
  await client.captureScreenshot('cenario-12-portal-cliente-proposta-v2.png');

  // =========================================================================
  // TESTE DE VIEWPORT MOBILE (390 x 844)
  // =========================================================================
  console.log('\n[6] Verificando Viewport Mobile (390 x 844)...');
  await client.setViewport(390, 844);
  await wait(500);

  // SCR-CRM-002 no mobile
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-CRM-002')");
  await wait(400);
  await client.captureScreenshot('mobile-scr-crm-002-atendimento.png');

  // SCR-EXT-007 no mobile
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-EXT-007')");
  await wait(400);
  await client.captureScreenshot('mobile-scr-ext-007-proposta.png');

  // Verificar overflow horizontal no mobile
  const mobileOverflow = await client.eval(`
    document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
  `);
  console.log(`  Mobile horizontal overflow: ${mobileOverflow ? 'DETECTED (FAIL)' : 'NONE (PASS)'}`);

  // Retornar para Desktop
  await client.setViewport(1440, 900);
  await client.eval("window.UX_ACTIONS.navigateToSurface('SCR-CRM-001')");
  await wait(400);
  await client.captureScreenshot('desktop-overview-harness-final.png');

  // =========================================================================
  // RELATÓRIO FINAL
  // =========================================================================
  console.log('\n================================================================');
  console.log('RESUMO DOS RESULTADOS:');
  console.log('================================================================');

  let allPass = true;
  scenarioLog.forEach(s => {
    const mark = s.pass ? '✅ PASS' : '❌ FAIL';
    if (!s.pass) allPass = false;
    console.log(`Cenário ${s.id.toString().padStart(2, ' ')}: ${mark} — ${s.name}`);
  });

  console.log(`\nErros não tratados de JS: ${client.errors.length}`);
  if (client.errors.length > 0) {
    console.error('Erros encontrados:', client.errors);
  }

  // Gravar arquivo de log estruturado
  const report = {
    executedAt: new Date().toISOString(),
    totalScenarios: 12,
    passCount: scenarioLog.filter(s => s.pass).length,
    allPass,
    unhandledErrors: client.errors,
    consoleLogsCount: client.consoleLogs.length,
    mobileOverflowDetected: mobileOverflow,
    scenarios: scenarioLog
  };

  fs.writeFileSync(path.join(EVIDENCE_DIR, 'test_execution_log.json'), JSON.stringify(report, null, 2));

  // Fechar conexões
  client.close();
  chromeProc.kill();
  server.close();

  console.log('\n[✓] Ensaio concluído com sucesso!');
  process.exit(allPass && !mobileOverflow && client.errors.length === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('ERRO FATAL NO TEST RUNNER:', err);
  process.exit(1);
});
