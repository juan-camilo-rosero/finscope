import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const EMAIL = 'coordinador@finscope.co';
const PASSWORD = 'Finscope2024!';
const SHOTS_DIR = 'C:/Users/Juan Camilo/Desktop/programacion/finscope_shots';

fs.mkdirSync(SHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const log = [];
function record(step, note) { log.push({ step, note }); console.log('[' + step + '] ' + note); }

// S1: cliente/radicar loads without login
await page.goto(BASE + '/cliente/radicar');
await page.waitForLoadState('networkidle');
const url1 = page.url();
const isOnRadicar = url1.includes('radicar') && !url1.includes('login');
record('S1', 'cliente/radicar without auth -> URL: ' + url1 + ' | NOT redirected to login: ' + isOnRadicar);
await page.screenshot({ path: SHOTS_DIR + '/01_cliente_radicar.png' });

// S2: coordinador/dashboard redirects to login without session
await page.goto(BASE + '/coordinador/dashboard');
await page.waitForURL('**/login**', { timeout: 5000 });
record('S2', 'Unauth access to /coordinador/dashboard -> redirected to: ' + page.url());
await page.screenshot({ path: SHOTS_DIR + '/02_login.png' });

// S3: Login as coordinador
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
try {
  await page.waitForURL('**/coordinador/dashboard**', { timeout: 12000 });
  record('S3', 'Login SUCCESS -> ' + page.url());
} catch (e) {
  record('S3', 'Login FAILED -> ' + page.url());
}
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await page.screenshot({ path: SHOTS_DIR + '/03_dashboard_loaded.png', fullPage: true });

// S4: Dashboard content
const dashHtml = await page.content();
const iaChips = (dashHtml.match(/IA · Finscope/g) || []).length;
const concesChips = (dashHtml.match(/Concesionario/g) || []).length;
const enAnalisisRows = (dashHtml.match(/En análisis/g) || []).length;
record('S4', 'IA chips: ' + iaChips + ' | Concesionario: ' + concesChips + ' | en_analisis visible: ' + enAnalisisRows);
['Solicitudes activas','Requieren acción','Detectados por IA','Aprobadas'].forEach(m => {
  record('S4-m', '"' + m + '": ' + (dashHtml.includes(m) ? 'FOUND' : 'MISSING'));
});

// S5: IA filter - should only show finscope_ia rows
await page.locator('button').filter({ hasText: 'Detectados por IA' }).first().click();
await page.waitForTimeout(500);
const afterIA = await page.content();
const iaAfterCount = (afterIA.match(/IA · Finscope/g) || []).length;
const concesAfterCount = (afterIA.match(/Concesionario/g) || []).length;
record('S5', 'IA filter -> IA rows: ' + iaAfterCount + ', Concesionario rows: ' + concesAfterCount);
await page.screenshot({ path: SHOTS_DIR + '/04_ia_filter.png', fullPage: true });

// S6: Requieren accion filter - should only show en_coordinacion
await page.locator('button').filter({ hasText: 'Requieren acción' }).first().click();
await page.waitForTimeout(500);
const afterAccion = await page.content();
const tomarCount = (afterAccion.match(/Tomar decisión/g) || []).length;
const verCount = (afterAccion.match(/Ver detalle|Ver motivo/g) || []).length;
record('S6', 'Requieren accion -> "Tomar decision": ' + tomarCount + ', "Ver*": ' + verCount);
await page.screenshot({ path: SHOTS_DIR + '/05_accion_filter.png', fullPage: true });

// S7: Open drawer for a completed/devuelta case
await page.locator('button').filter({ hasText: 'Todas' }).first().click();
await page.waitForTimeout(500);
const verDetalle = page.locator('button').filter({ hasText: /Ver detalle|Ver motivo/ }).first();
if (await verDetalle.count() > 0) {
  await verDetalle.click();
  await page.waitForTimeout(700);
  const drawerHtml = await page.content();
  const hasTimeline = drawerHtml.includes('Línea de tiempo');
  const hasDocs = drawerHtml.includes('Documentos');
  const hasIASection = drawerHtml.includes('Detectado por Finscope IA');
  const hasCTA = drawerHtml.includes('Ir a tomar decisión');
  record('S7', 'Drawer: timeline=' + hasTimeline + ' docs=' + hasDocs + ' IASection=' + hasIASection + ' CTA=' + hasCTA);
  await page.screenshot({ path: SHOTS_DIR + '/06_drawer.png', fullPage: true });
  // close
  await page.locator('button').filter({ hasText: '✕' }).first().click();
  await page.waitForTimeout(400);
}

// S8: Cola page - load and check
await page.goto(BASE + '/coordinador/cola');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
record('S8', 'Cola loaded: ' + page.url());
const colaHtml = await page.content();
const colaRows = await page.locator('tbody tr').count();
const iaInCola = (colaHtml.match(/⚡ IA/g) || []).length;
record('S8', 'Cola rows: ' + colaRows + ', IA badges: ' + iaInCola);
await page.screenshot({ path: SHOTS_DIR + '/07_cola_loaded.png', fullPage: true });

// S9: Select a case - check detail sections
if (colaRows > 0) {
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(600);
  const detailHtml = await page.content();
  record('S9', 'Detail: A=' + detailHtml.includes('A — Perfil') +
    ' D=' + detailHtml.includes('D — Consultas') +
    ' decision=' + detailHtml.includes('Decisión final'));
  await page.screenshot({ path: SHOTS_DIR + '/08_detail_selected.png', fullPage: true });
}

// S10: prospectado vs nuevo - devolver button visibility
const rowTexts = await page.locator('tbody tr').evaluateAll(rs => rs.map(r => r.innerText.substring(0,50)));
record('S10-rows', 'Queue: ' + JSON.stringify(rowTexts.slice(0,4)));

const patriciaRow = page.locator('tbody tr').filter({ hasText: 'Patricia' });
if (await patriciaRow.count() > 0) {
  await patriciaRow.first().click();
  await page.waitForTimeout(500);
  const devolverVisible = await page.locator('button').filter({ hasText: 'Devolver al analista' }).count() > 0;
  const secBAnalista = (await page.content()).includes('B — Recomendación del analista');
  record('S10a', 'Patricia(nuevo) -> devolver: ' + devolverVisible + ' sec-B-analista: ' + secBAnalista);
  await page.screenshot({ path: SHOTS_DIR + '/09_nuevo_panel.png', fullPage: true });
}

const carlosRow = page.locator('tbody tr').filter({ hasText: 'Carlos' });
const lauraRow = page.locator('tbody tr').filter({ hasText: 'Laura' });
const prospRow = await carlosRow.count() > 0 ? carlosRow.first() : lauraRow.first();
if (await prospRow.count() > 0) {
  await prospRow.click();
  await page.waitForTimeout(500);
  const devolverHidden = await page.locator('button').filter({ hasText: 'Devolver al analista' }).count() === 0;
  const secBIA = (await page.content()).includes('B — Detección IA');
  record('S10b', 'Prospectado -> devolver hidden: ' + devolverHidden + ' sec-B-IA: ' + secBIA);
  await page.screenshot({ path: SHOTS_DIR + '/10_prospectado_panel.png', fullPage: true });
}

// S11: ?id pre-selection from dashboard
await page.goto(BASE + '/coordinador/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
const tomarOnDash = page.locator('button').filter({ hasText: 'Tomar decisión' }).first();
if (await tomarOnDash.count() > 0) {
  await tomarOnDash.click();
  await page.waitForURL('**/coordinador/cola**', { timeout: 5000 });
  const colaUrl = page.url();
  record('S11', '"Tomar decision" -> ' + colaUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  const detailPresel = await page.locator('text=A — Perfil del cliente').count() > 0;
  record('S11b', '?id pre-selection: detail visible = ' + detailPresel);
  await page.screenshot({ path: SHOTS_DIR + '/11_preselected.png', fullPage: true });
}

// S12: Approve + ConfirmModal + Toast + Undo
await page.goto(BASE + '/coordinador/cola');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
const firstQRow = page.locator('tbody tr').first();
if (await firstQRow.count() > 0) {
  await firstQRow.click();
  await page.waitForTimeout(500);
  const aprobar = page.locator('button').filter({ hasText: /✓ Aprobar/ }).first();
  if (await aprobar.count() > 0) {
    await aprobar.click();
    await page.waitForTimeout(300);
    const modalAppeared = await page.locator('text=¿Aprobar este caso?').count() > 0;
    record('S12a', 'Approve confirm modal: ' + modalAppeared);
    await page.screenshot({ path: SHOTS_DIR + '/12_approve_modal.png' });
    const confirmBtn = page.locator('button').filter({ hasText: 'Sí, aprobar' });
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(700);
      const toastCount = await page.locator('text=aprobado').count();
      record('S12b', 'Toast with "aprobado": ' + (toastCount > 0));
      const undoBtn = page.locator('button').filter({ hasText: 'Deshacer' });
      const undoCount = await undoBtn.count();
      record('S12c', 'Undo button in toast: ' + (undoCount > 0));
      await page.screenshot({ path: SHOTS_DIR + '/13_toast_undo.png' });
      if (undoCount > 0) {
        await undoBtn.first().click();
        await page.waitForTimeout(900);
        const pendAfterUndo = await page.locator('tbody tr').count();
        record('S12d', 'After undo -> rows in queue: ' + pendAfterUndo);
        await page.screenshot({ path: SHOTS_DIR + '/14_after_undo.png', fullPage: true });
      }
    }
  }
}

// S13: Rechazar modal is danger variant
await page.goto(BASE + '/coordinador/cola');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
if (await page.locator('tbody tr').first().count() > 0) {
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(500);
  const rechazar = page.locator('button').filter({ hasText: /✕ Rechazar/ });
  if (await rechazar.count() > 0) {
    await rechazar.click();
    await page.waitForTimeout(300);
    const rechModal = await page.locator('text=¿Rechazar definitivamente?').count() > 0;
    record('S13', 'Rechazar modal (danger): ' + rechModal);
    await page.screenshot({ path: SHOTS_DIR + '/15_rechazar_modal.png' });
    await page.locator('button').filter({ hasText: 'Cancelar' }).first().click();
    record('S13b', 'Cancelled OK');
  }
}

// Final dashboard
await page.goto(BASE + '/coordinador/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await page.screenshot({ path: SHOTS_DIR + '/16_dashboard_final.png', fullPage: true });
const finalDash = await page.content();
record('S_FINAL', 'Dashboard final IA chips: ' + (finalDash.match(/IA · Finscope/g) || []).length);

console.log('\n=== VERIFICATION SUMMARY ===');
log.forEach(l => console.log(l.step + ' | ' + l.note));

await browser.close();
