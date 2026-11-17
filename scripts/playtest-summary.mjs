// Summarises the playtest bot's runs (scripts/playtest.sim.ts) as Markdown tables, for the report.
//   node scripts/playtest-summary.mjs runs/*.json
import { readFileSync } from 'node:fs';

const runs = process.argv.slice(2).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));
const by = (k) => runs.reduce((m, r) => ((m[r[k]] ??= []).push(r), m), {});
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '–');
const q = (xs, p) => {
  if (!xs.length) return '–';
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const qs = (xs) => `${q(xs, 0.1)} / ${q(xs, 0.5)} / ${q(xs, 0.9)}`;
const mean = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : '–');
const row = (cells) => `| ${cells.join(' | ')} |`;
const table = (head, rows) => [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
const personas = by('persona');
const names = Object.keys(personas);

const out = [];
out.push(`Runs: ${runs.length} (${names.map((n) => `${n} ${personas[n].length}`).join(', ')})\n`);

out.push('### Endings and days\n');
out.push(
  table(
    ['persona', 'done', 'timeout (40 days)', 'error', 'days p10/p50/p90 (done)', 'Sandbar nights mean'],
    names.map((n) => {
      const rs = personas[n];
      const done = rs.filter((r) => r.end === 'done');
      return [n, pct(done.length, rs.length), pct(rs.filter((r) => r.end === 'timeout').length, rs.length), rs.filter((r) => r.end === 'error').length, qs(done.map((r) => r.days)), mean(rs.map((r) => r.sandbarNights))];
    }),
  ),
);

out.push('\n### The Sandbar\n');
out.push(
  table(
    ['persona', 'cleared day 1', 'day 2', 'day 3', 'day 4+', 'debris before it (mean)', 'strength at it: day 1 (p10/p50/p90)', 'cleared day 1 with no debris before / with'],
    names.map((n) => {
      const rs = personas[n];
      const c = (k) => rs.filter((r) => (k === 4 ? r.sandbarCleared >= 4 : r.sandbarCleared === k)).length;
      const before = rs.map((r) => r.debris.filter((d) => !d.afterSandbar));
      const strengthAt = rs.map((r, i) => (before[i].length ? before[i].at(-1).strengthAfter : 18));
      const none = rs.filter((_, i) => !before[i].length), some = rs.filter((_, i) => before[i].length);
      return [n, pct(c(1), rs.length), pct(c(2), rs.length), pct(c(3), rs.length), pct(c(4), rs.length), mean(before.map((b) => b.length)), qs(strengthAt), `${pct(none.filter((r) => r.sandbarCleared === 1).length, none.length)} (${none.length}) / ${pct(some.filter((r) => r.sandbarCleared === 1).length, some.length)} (${some.length})`];
    }),
  ),
);

out.push('\n### Debris on the river\n');
out.push(
  table(
    ['persona', 'met per voyage p10/p50/p90', 'before / after the Sandbar (mean)', 'crates won', 'sawyer won', 'deadhead won', 'drift pile won', 'strength lost per piece (mean)', 'runs reaching the Tri-Cities at 0 strength', 'skipped: no strength'],
    names.map((n) => {
      const rs = personas[n];
      const all = rs.flatMap((r) => r.debris);
      const won = (k) => {
        const d = all.filter((x) => x.kind === k);
        return `${pct(d.filter((x) => x.won).length, d.length)} of ${d.length}`;
      };
      return [
        n,
        qs(rs.map((r) => r.debris.length)),
        `${mean(rs.map((r) => r.debris.filter((d) => !d.afterSandbar).length))} / ${mean(rs.map((r) => r.debris.filter((d) => d.afterSandbar).length))}`,
        won('crate'),
        won('sawyer'),
        won('deadhead'),
        won('driftPile'),
        mean(all.map((d) => d.strengthBefore - d.strengthAfter)),
        pct(rs.filter((r) => r.atTriCities && r.atTriCities.strength === 0).length, rs.length),
        rs.reduce((a, r) => a + r.debrisSkippedNoStrength, 0),
      ];
    }),
  ),
);

out.push('\n### Arriving at the Tri-Cities (end of day 1 or later)\n');
out.push(
  table(
    ['persona', 'day arrived p50', 'purse p10/p50/p90', 'strength p10/p50/p90', 'coal', 'salvage $ p50/p90', 'troubles aboard (mean)'],
    names.map((n) => {
      const a = personas[n].map((r) => r.atTriCities).filter(Boolean);
      return [n, q(a.map((x) => x.day), 0.5), qs(a.map((x) => x.purse)), qs(a.map((x) => x.strength)), qs(a.map((x) => x.coal)), `${q(a.map((x) => x.salvage), 0.5)} / ${q(a.map((x) => x.salvage), 0.9)}`, mean(a.map((x) => x.troubles))];
    }),
  ),
);

out.push('\n### Money\n');
const DAYS = [1, 2, 3, 5, 7, 10, 15, 20];
out.push(
  table(
    ['persona', ...DAYS.map((d) => `purse day ${d} p50`), 'lowest purse p50', 'runs ever at $0', 'odd jobs (mean)', 'spent at shops p50'],
    names.map((n) => {
      const rs = personas[n];
      return [
        n,
        ...DAYS.map((d) => {
          const xs = rs.map((r) => r.dawns.find((x) => x.day === d)?.purse).filter((x) => x !== undefined);
          return xs.length ? `${q(xs, 0.5)} (${xs.length})` : '–';
        }),
        q(rs.map((r) => r.lowestPurse), 0.5),
        pct(rs.filter((r) => r.lowestPurse === 0).length, rs.length),
        mean(rs.map((r) => r.oddJobs)),
        q(rs.map((r) => r.spent), 0.5),
      ];
    }),
  ),
);

out.push('\n### Strength and coal at dawn (p50)\n');
out.push(
  table(
    ['persona', ...DAYS.map((d) => `day ${d}: strength / coal`)],
    names.map((n) => [
      n,
      ...DAYS.map((d) => {
        const xs = personas[n].map((r) => r.dawns.find((x) => x.day === d)).filter(Boolean);
        return xs.length ? `${q(xs.map((x) => x.strength), 0.5)} / ${q(xs.map((x) => x.coal), 0.5)}` : '–';
      }),
    ]),
  ),
);

out.push('\n### Encounters: how often each is won (solved / played)\n');
const ids = [...new Set(runs.flatMap((r) => Object.keys(r.encounters)))].filter((id) => !['harbourTalk', 'underway', 'depotTalk', 'breakfast'].includes(id));
out.push(
  table(
    ['encounter', ...names],
    ids.map((id) => [
      id,
      ...names.map((n) => {
        const e = personas[n].map((r) => r.encounters[id]).filter(Boolean);
        const p = e.reduce((a, x) => a + x.played, 0), s = e.reduce((a, x) => a + x.solved, 0);
        return p ? `${pct(s, p)} (${p})` : '–';
      }),
    ]),
  ),
);

out.push('\n### The Games and the climb\n');
out.push(
  table(
    ['persona', 'days queued at Davenport p50/p90', 'climbs begun (mean)', 'pushes per voyage p50', 'push strength p50', 'stage share taken per failed push (mean): Moline / Campbell’s / Long Reach', 'turned back'],
    names.map((n) => {
      const rs = personas[n];
      const pushes = rs.flatMap((r) => r.pushes);
      const share = (st) => mean(pushes.filter((p) => p.stage === st && !p.cleared).map((p) => p.taken));
      return [n, `${q(rs.map((r) => r.tournaments), 0.5)} / ${q(rs.map((r) => r.tournaments), 0.9)}`, mean(rs.map((r) => r.climbs)), q(rs.map((r) => r.pushes.length), 0.5), q(pushes.map((p) => p.strength), 0.5), `${share('molineChain')} / ${share('campbellsChain')} / ${share('longReach')}`, rs.reduce((a, r) => a + r.turnedBack, 0)];
    }),
  ),
);

out.push('\n### Hub choices (per voyage, mean) and purchases (total)\n');
const hubIds = [...new Set(runs.flatMap((r) => Object.keys(r.hub)))];
out.push(table(['persona', ...hubIds], names.map((n) => [n, ...hubIds.map((h) => mean(personas[n].map((r) => r.hub[h] ?? 0)))])));
const items = [...new Set(runs.flatMap((r) => Object.keys(r.bought)))];
out.push('');
out.push(table(['persona', ...items], names.map((n) => [n, ...items.map((i) => personas[n].reduce((a, r) => a + (r.bought[i] ?? 0), 0))])));

out.push('\n### Troubles, salvage, the depot\n');
out.push(
  table(
    ['persona', 'troubles taken (mean)', 'from debris / Sandbar / other', 'fixed at the deck game (mean)', 'salvage earned $ (mean)', 'salvage sold $ (mean)', 'depot cost per game p10/p50/p90', 'depot games costing > $25'],
    names.map((n) => {
      const rs = personas[n];
      const t = rs.flatMap((r) => r.troublesTaken);
      const deb = t.filter((x) => ['sawyer', 'deadhead', 'driftPile'].includes(x.from)).length, sb = t.filter((x) => x.from === 'sandbar').length;
      const dc = rs.flatMap((r) => r.depotCost);
      return [n, mean(rs.map((r) => r.troublesTaken.length)), `${deb} / ${sb} / ${t.length - deb - sb}`, mean(rs.map((r) => r.troublesFixed)), mean(rs.map((r) => r.salvageEarned)), mean(rs.map((r) => r.salvageSold)), qs(dc), `${dc.filter((x) => x > 25).length} of ${dc.length}`];
    }),
  ),
);

out.push('\n### Tables for the purse: dollars won or lost per game\n');
const pids = [...new Set(runs.flatMap((r) => Object.keys(r.purseDelta ?? {})))];
out.push(
  table(
    ['table', ...names.map((n) => `${n}: mean (p10/p50/p90)`)],
    pids.map((id) => [id, ...names.map((n) => {
      const xs = personas[n].flatMap((r) => r.purseDelta?.[id] ?? []);
      return xs.length ? `${mean(xs)} (${qs(xs)}) n=${xs.length}` : '–';
    })]),
  ),
);

out.push('\n### Where the days go (morning of each milestone, p50 / p90, of the runs that got there)\n');
const ms = ['boiler', 'firstGames', 'firstNoonWin'];
out.push(
  table(
    ['persona', ...ms, 'done'],
    names.map((n) => {
      const rs = personas[n];
      return [n, ...ms.map((m) => {
        const xs = rs.map((r) => r.milestones?.[m]).filter((x) => x !== undefined);
        return `${q(xs, 0.5)} / ${q(xs, 0.9)} (${pct(xs.length, rs.length)})`;
      }), `${q(rs.filter((r) => r.end === 'done').map((r) => r.days), 0.5)} / ${q(rs.filter((r) => r.end === 'done').map((r) => r.days), 0.9)}`];
    }),
  ),
);

const bad = runs.filter((r) => r.end !== 'done');
out.push('\n### Runs that did not finish (first 12)\n');
for (const r of bad.slice(0, 12)) out.push(`- ${r.persona} seed ${r.seed}: ${r.end}${r.error ? ` (${r.error})` : ''}: ${r.stoppedAt}`);
const odd = runs.flatMap((r) => r.oddities);
out.push(`\nOddities: ${odd.length}${odd.length ? '\n' + [...new Set(odd)].slice(0, 12).map((o) => `- ${o}`).join('\n') : ''}`);
console.log(out.join('\n'));
