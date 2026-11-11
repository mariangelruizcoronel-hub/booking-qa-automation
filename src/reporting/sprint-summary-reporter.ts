import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';
import { ACCEPTANCE_CRITERIA, STORY } from '../data/acceptance-criteria';

/**
 * Reporter propio: al terminar la ejecución genera un "Sprint Testing · Resumen final"
 *   - results/sprint-summary.md   (para pegar en Jira / PR / Slack)
 *   - results/sprint-summary.html (para enseñar en pantalla)
 * Con: veredicto, métricas, cobertura por criterio de aceptación, bugs conocidos y flaky.
 */

type Row = {
  title: string;
  project: string;
  file: string;
  status: TestResult['status'];
  expectedStatus: TestCase['expectedStatus'];
  outcome: ReturnType<TestCase['outcome']>;
  tags: string[];
  knownBug?: string;
  durationMs: number;
};

const AC_TAG = /^@AC(\d+)$/;

export default class SprintSummaryReporter implements Reporter {
  private rows = new Map<string, Row>();
  private startedAt = new Date();

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project()?.name ?? '';
    if (project === 'setup') return;
    const annotations = [...test.annotations, ...((result as { annotations?: TestCase['annotations'] }).annotations ?? [])];
    const knownBug = annotations.find((a) => a.type === 'fail')?.description ?? (test.expectedStatus === 'failed' ? 'Bug conocido' : undefined);
    // Nos quedamos con el último intento (retries)
    this.rows.set(test.id, {
      title: test.title.replace(/\s@[\w-]+/g, '').trim(),
      project,
      file: path.relative(process.cwd(), test.location.file),
      status: result.status,
      expectedStatus: test.expectedStatus,
      outcome: test.outcome(),
      tags: test.tags,
      knownBug,
      durationMs: result.duration,
    });
  }

  onEnd(result: FullResult) {
    const rows = [...this.rows.values()];
    const executed = rows.filter((r) => r.outcome !== 'skipped');
    const passed = executed.filter((r) => r.outcome === 'expected' && !r.knownBug);
    const knownBugs = executed.filter((r) => r.outcome === 'expected' && r.knownBug);
    const failed = executed.filter((r) => r.outcome === 'unexpected');
    const flaky = executed.filter((r) => r.outcome === 'flaky');
    const real = passed.length + failed.length + flaky.length;
    const passRate = real ? ((passed.length + flaky.length) / real) * 100 : 0;

    const verdict =
      failed.length === 0
        ? knownBugs.length
          ? `PASSED con ${knownBugs.length} bug(s) conocido(s) abiertos`
          : 'PASSED'
        : `FAILED (${failed.length} test(s) fallan)`;

    // Cobertura por AC
    const acRows = Object.entries(ACCEPTANCE_CRITERIA).map(([id, text]) => {
      const tests = executed.filter((r) => r.tags.some((t) => t === `@${id}`));
      const fail = tests.filter((t) => t.outcome === 'unexpected').length;
      const bug = tests.filter((t) => t.knownBug).length;
      const status = !tests.length ? 'SIN COBERTURA' : fail ? 'FALLA' : bug ? 'CUBIERTO · bug abierto' : 'CUBIERTO';
      const layers = [...new Set(tests.map((t) => t.project))].join(', ');
      return { id, text, count: tests.length, status, layers };
    });

    const byProject = [...new Set(executed.map((r) => r.project))].map((p) => {
      const list = executed.filter((r) => r.project === p);
      return { project: p, total: list.length, failed: list.filter((r) => r.outcome === 'unexpected').length };
    });

    const bugList = [...new Map(knownBugs.map((b) => [b.knownBug!, b])).values()];
    const durationS = ((Date.now() - this.startedAt.getTime()) / 1000).toFixed(1);

    const md = [
      `# Sprint Testing — ${STORY.id} · Resumen final`,
      '',
      `**Historia:** como ${STORY.asA}, quiero ${STORY.iWant}, para ${STORY.soThat}.`,
      '',
      `**Veredicto:** ${failed.length ? '❌' : '✅'} ${verdict}`,
      '',
      '## Métricas',
      '',
      '| Métrica | Valor |',
      '| --- | --- |',
      `| Tests ejecutados | ${executed.length} |`,
      `| Pasados | ${passed.length} |`,
      `| Fallados | ${failed.length} |`,
      `| Flaky (pasan al reintentar) | ${flaky.length} |`,
      `| Bugs conocidos controlados | ${knownBugs.length} |`,
      `| Pass rate | ${passRate.toFixed(1)}% |`,
      `| Duración | ${durationS} s |`,
      '',
      '## Cobertura de criterios de aceptación',
      '',
      '| AC | Criterio | Tests | Capas | Estado |',
      '| --- | --- | --- | --- | --- |',
      ...acRows.map((a) => `| ${a.id} | ${a.text} | ${a.count} | ${a.layers || '-'} | ${a.status} |`),
      '',
      '## Por capa',
      '',
      '| Capa | Tests | Fallados |',
      '| --- | --- | --- |',
      ...byProject.map((p) => `| ${p.project} | ${p.total} | ${p.failed} |`),
      '',
      '## Bugs abiertos (ver docs/hallazgos.md)',
      '',
      ...(bugList.length ? bugList.map((b) => `- ${b.knownBug}`) : ['- Ninguno']),
      '',
      ...(failed.length
        ? ['## Fallos a revisar', '', ...failed.map((f) => `- [${f.project}] ${f.title} (${f.file})`), '']
        : []),
      `_Generado automáticamente por Playwright · ${new Date().toLocaleString('es-ES')} · estado global: ${result.status}_`,
    ].join('\n');

    const dir = path.join(process.cwd(), 'results');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'sprint-summary.md'), md);
    fs.writeFileSync(path.join(dir, 'sprint-summary.html'), this.html({ verdict, failed: failed.length, executed: executed.length, passed: passed.length, flaky: flaky.length, knownBugs: knownBugs.length, passRate, durationS, acRows, byProject, bugList: bugList.map((b) => b.knownBug!) }));

    // Resumen también en el job de GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');

    console.log(`\n📋 Sprint summary: results/sprint-summary.html  ·  ${verdict}  ·  pass rate ${passRate.toFixed(1)}%\n`);
  }

  private html(d: {
    verdict: string; failed: number; executed: number; passed: number; flaky: number; knownBugs: number;
    passRate: number; durationS: string;
    acRows: { id: string; text: string; count: number; status: string; layers: string }[];
    byProject: { project: string; total: number; failed: number }[];
    bugList: string[];
  }) {
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
    const pill = (s: string) =>
      `<span class="pill ${s.startsWith('CUBIERTO ·') ? 'warn' : s === 'CUBIERTO' ? 'ok' : 'bad'}">${esc(s)}</span>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Sprint Testing ${STORY.id}</title>
<style>
body{margin:0;background:#0f172a;color:#e2e8f0;font:15px/1.5 ui-monospace,Menlo,monospace;padding:40px}
.wrap{max-width:1000px;margin:auto}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;color:#94a3b8;margin:32px 0 10px;text-transform:uppercase;letter-spacing:.08em}
.verdict{font-size:18px;margin:18px 0;padding:14px 18px;border-radius:10px;background:${d.failed ? '#450a0a' : '#052e16'};border:1px solid ${d.failed ? '#ef4444' : '#22c55e'}}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:#1e293b;border-radius:10px;padding:14px}.kpi b{display:block;font-size:26px;color:#fff}.kpi span{color:#94a3b8;font-size:12px}
table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden}td,th{padding:9px 12px;border-bottom:1px solid #334155;text-align:left}th{color:#94a3b8;font-weight:500}
.pill{padding:2px 8px;border-radius:99px;font-size:12px}.ok{background:#14532d;color:#86efac}.warn{background:#713f12;color:#fde68a}.bad{background:#7f1d1d;color:#fecaca}
.story{color:#94a3b8}li{margin:4px 0}</style></head><body><div class="wrap">
<h1>Sprint Testing — ${STORY.id} · Resumen final</h1><div class="story">Como ${STORY.asA}, quiero ${STORY.iWant}, para ${STORY.soThat}.</div>
<div class="verdict">${d.failed ? '❌' : '✅'} Veredicto: ${esc(d.verdict)}</div>
<div class="kpis"><div class="kpi"><b>${d.executed}</b><span>tests ejecutados</span></div><div class="kpi"><b>${d.passRate.toFixed(1)}%</b><span>pass rate</span></div>
<div class="kpi"><b>${d.knownBugs}</b><span>bugs conocidos controlados</span></div><div class="kpi"><b>${d.durationS}s</b><span>duración</span></div></div>
<h2>Cobertura de criterios de aceptación</h2><table><tr><th>AC</th><th>Criterio</th><th>Tests</th><th>Capas</th><th>Estado</th></tr>
${d.acRows.map((a) => `<tr><td>${a.id}</td><td>${esc(a.text)}</td><td>${a.count}</td><td>${esc(a.layers || '-')}</td><td>${pill(a.status)}</td></tr>`).join('')}</table>
<h2>Por capa</h2><table><tr><th>Capa</th><th>Tests</th><th>Fallados</th></tr>${d.byProject.map((p) => `<tr><td>${p.project}</td><td>${p.total}</td><td>${p.failed}</td></tr>`).join('')}</table>
<h2>Bugs abiertos</h2><ul>${d.bugList.length ? d.bugList.map((b) => `<li>${esc(b)}</li>`).join('') : '<li>Ninguno</li>'}</ul>
<p class="story">Pasados: ${d.passed} · Fallados: ${d.failed} · Flaky: ${d.flaky} · Generado por Playwright · ${new Date().toLocaleString('es-ES')}</p>
</div></body></html>`;
  }
}
