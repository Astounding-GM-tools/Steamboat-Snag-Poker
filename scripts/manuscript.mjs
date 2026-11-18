#!/usr/bin/env node
/**
 * The manuscript: every piece of text the player can see, gathered from the source into one document
 * (docs/manuscript.md), for reading and editing the words without reading the code. Run it again after
 * changing any text:
 *
 *   node scripts/manuscript.mjs
 *
 * Story files are read with TypeScript's own parser: each string is listed with who says it (a line's
 * `who`, or the helper it's said through: `say('gus', …)`, `bar(…)` for Sandy), what it is (a line, a
 * reply button, a caption's title, a log entry) and where it lives (the declaration and file:line).
 * Ids, keys and other strings the player never sees are left out. The dictionary (src/i18n/en.ts) is
 * listed whole, by section.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/manuscript.md');

/** The story's files, in roughly the order the player meets them. */
const PARTS = [
  {
    title: 'Chapter one: Muscatine, The Sandbar, the river',
    files: ['src/story/chapters/01_muscatine/index.ts', 'src/story/characters/sandy.ts', 'src/story/characters/debris.ts', 'src/story/log.ts'],
  },
  {
    title: 'The Tri-Cities',
    files: ['src/story/chapters/02_triCities/index.ts', 'src/story/chapters/02_triCities/depot.ts', 'src/story/chapters/02_triCities/bettendorf.ts', 'src/story/characters/gaylord.ts'],
  },
  { title: 'The crew, aboard (the deck game, advice, chatter)', files: ['src/story/characters/crew.ts'] },
  { title: 'Davenport, the rapids, LeClaire', files: ['src/story/chapters/03_rapids/index.ts'] },
  { title: 'The tutorial (League mode)', files: ['src/story/chapters/00_tutorial/tutorial.ts', 'src/story/chapters/00_tutorial/hands.ts'] },
];

/** Properties whose string values are never shown: ids, kinds, keys, flags. */
const HIDDEN_PROPS = new Set([
  'id', 'who', 'type', 'size', 'when', 'ai', 'stake', 'kind', 'leg', 'place', 'flag', 'flags', 'clear', 'mood', 'require',
  'effect', 'hub', 'label_key', 'onFail', 'engaged', 'joined', 'goal', 'proxy', 'role', 'side', 'station', 'fixer', 'address',
  'to', 'from', 'times', 'notFlag', 'trader', 'hire', 'item', 'key', 'tic', 'layer', 'fill', 'stroke', 'effect',
]);
/** Calls whose string arguments are keys, not text (the dictionary, flags, lookups). */
const KEY_CALLS = new Set(['t', 'includes', 'startsWith', 'endsWith', 'has', 'get', 'push', 'filter', 'jokerCard', 'Error', 'find', 'indexOf', 'split', 'join', 'replace', 'flag', 'met']);
/** Helpers that take the speaker as their first argument. */
const SPEAKER_CALLS = new Set(['say', 'aside']);

/** Looks like an id or a key, not prose. */
const isKey = (s) =>
  !/\s/.test(s) &&
  (/^[a-z][\w.:/-]*$/.test(s) || /^[A-Z_]+$/.test(s) || /^[\w.-]+\.(ts|svelte|json|mp3|webp)$/.test(s) ||
    // A card, as the tutorial deals it: "Ah", "10s", "Th".
    /^(10|[2-9TJQKA])[cdhs]$/.test(s) ||
    // Nothing but a placeholder.
    /^\{[^}]*\}$/.test(s.trim()));

const CHARACTER_NAMES = (() => {
  // Who's who, from the dictionary: `character.<id>.called` or `.name`.
  const src = readFileSync(join(ROOT, 'src/i18n/en.ts'), 'utf8');
  const names = { you: 'You' };
  for (const m of src.matchAll(/'character\.(\w+)\.(called|name)':\s*'([^']*)'/g)) if (m[2] === 'called' || !names[m[1]]) names[m[1]] = m[3];
  return names;
})();
const speakerName = (id) => (id ? (CHARACTER_NAMES[id] ?? id) : null);

/** A placeholder's code, as a short name for the reader: `{t(`joker.${…}`)}` is `{snag}`, `{what.toLowerCase()}` is `{what}`. */
function placeholder(code) {
  if (/joker\./.test(code)) return 'snag';
  if (/place\./.test(code)) return 'place';
  if (/character\./.test(code)) return 'name';
  const words = code.match(/[A-Za-z_]\w*/g)?.filter((w) => !['t', 'toLowerCase', 'toUpperCase', 'length', 'join', 'map', 'Math', 'round', 'max', 'min', 'String'].includes(w));
  return words?.at(-1) ?? '…';
}

function textOf(node, sf) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    for (const span of node.templateSpans) s += `{${placeholder(span.expression.getText(sf))}}` + span.literal.text;
    return s;
  }
  return null;
}

/** For each file: helper functions that say things as someone (`const bar = (t) => say('sandbar', t)`). */
function speakerHelpers(sf) {
  const helpers = new Map([['you', 'you']]);
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
      let who = null;
      const find = (n) => {
        if (who) return;
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (SPEAKER_CALLS.has(n.expression.text) || helpers.has(n.expression.text)) && n.arguments.length) {
          const a = n.arguments[0];
          if (SPEAKER_CALLS.has(n.expression.text) && ts.isStringLiteral(a)) who = a.text;
          else if (helpers.has(n.expression.text)) who = helpers.get(n.expression.text);
        }
        if (ts.isPropertyAssignment(n) && n.name.getText(sf) === 'who' && ts.isStringLiteral(n.initializer)) who = n.initializer.text;
        ts.forEachChild(n, find);
      };
      find(node.initializer);
      if (who) helpers.set(node.name.text, who);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return helpers;
}

/** Where a node lives: the declaration it's in, and the property path down to it. */
function locate(node, sf) {
  const path = [];
  let decl = null;
  for (let n = node.parent, child = node; n; child = n, n = n.parent) {
    if (ts.isPropertyAssignment(n) && n.initializer === child) path.unshift(n.name.getText(sf).replace(/['"]/g, ''));
    else if (ts.isArrayLiteralExpression(n)) {
      const i = n.elements.indexOf(child);
      if (i >= 0 && path[0] !== `[${i}]`) path.unshift(`[${i + 1}]`);
    } else if ((ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n)) && n.name) {
      decl = n.name.getText(sf);
      break;
    }
  }
  return [decl, path.join('.').replace(/\.\[/g, '[')].filter(Boolean).join(' › ');
}

/** Who says a node's text: the nearest enclosing line's `who`, or the helper it's passed to. */
function speakerOf(node, sf, helpers) {
  for (let n = node.parent, child = node; n; child = n, n = n.parent) {
    if (ts.isObjectLiteralExpression(n)) {
      const who = n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'who');
      if (who && ts.isStringLiteral(who.initializer)) return who.initializer.text;
      // A spread of a helper's line: `{ ...said('…'), replies: … }`.
      for (const p of n.properties) {
        if (ts.isSpreadAssignment(p) && ts.isCallExpression(p.expression) && ts.isIdentifier(p.expression.expression)) {
          const h = p.expression.expression.text;
          if (SPEAKER_CALLS.has(h) && ts.isStringLiteral(p.expression.arguments[0])) return p.expression.arguments[0].text;
          if (helpers.has(h)) return helpers.get(h);
        }
      }
    }
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const h = n.expression.text;
      if (SPEAKER_CALLS.has(h) && n.arguments[0] !== child && ts.isStringLiteral(n.arguments[0])) return n.arguments[0].text;
      if (helpers.has(h)) return helpers.get(h);
    }
    if (ts.isVariableStatement(n) || ts.isFunctionDeclaration(n)) break;
  }
  return null;
}

/** What a string is, by the property it's under. */
function roleOf(node, sf) {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isPropertyAssignment(n)) {
      const k = n.name.getText(sf).replace(/['"]/g, '');
      if (k === 'label') return 'button';
      if (k === 'comeback') return 'comeback';
      if (k === 'title') return 'caption title';
      if (k === 'lines' || k === 'text') return null;
      return null;
    }
    if (ts.isVariableStatement(n) || ts.isFunctionDeclaration(n)) break;
  }
  return null;
}

function hidden(node, sf) {
  const p = node.parent;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p) || ts.isCaseClause(p)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isPropertyAssignment(p) && HIDDEN_PROPS.has(p.name.getText(sf).replace(/['"]/g, ''))) return true;
  if (ts.isElementAccessExpression(p)) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return true;
  if (ts.isCallExpression(p)) {
    const callee = ts.isIdentifier(p.expression) ? p.expression.text : ts.isPropertyAccessExpression(p.expression) ? p.expression.name.text : '';
    if (KEY_CALLS.has(callee)) return true;
    if (SPEAKER_CALLS.has(callee) && p.arguments[0] === node) return true;
  }
  if (ts.isNewExpression(p)) return true;
  // An array of keys: `['coal', 'sellCoal', …]`.
  if (ts.isArrayLiteralExpression(p) && p.elements.every((e) => ts.isStringLiteral(e) && isKey(e.text))) return true;
  return false;
}

function fileLines(file) {
  const src = readFileSync(join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const helpers = speakerHelpers(sf);
  const out = [];
  const visit = (node) => {
    const text = textOf(node, sf);
    if (text !== null) {
      if (!hidden(node, sf) && !isKey(text) && text.trim() && /[A-Za-z]/.test(text)) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        out.push({ text, who: speakerOf(node, sf, helpers), role: roleOf(node, sf), where: locate(node, sf), line });
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const md = (s) => s.replace(/\n/g, '  \n> ');

let doc = `# Manuscript: every word the player sees

Generated from the source by \`node scripts/manuscript.mjs\` (${new Date().toISOString().slice(0, 10)}): don't edit it here, edit the
source (each line says where: the declaration, and file:line), then run it again.

How to read it: **Speaker:** the line; **You** is the player (the Captain, or Bill's First Mate before
the handover). Lines with no speaker are captions (intertitles) or log entries; *button* is the player's
reply button, *comeback* is said back to a reply. \`{…}\` is filled in at play (a number, a
name). Story parts come in roughly the order they're met; the dictionary (titles, buttons, names, item
descriptions, the river's calls and the log's labels) is at the end.

`;

let total = 0;
for (const part of PARTS) {
  doc += `\n## ${part.title}\n`;
  for (const file of part.files) {
    const lines = fileLines(file);
    total += lines.length;
    doc += `\n### ${relative(ROOT, join(ROOT, file))}\n\n`;
    let lastWhere = null;
    for (const l of lines) {
      const where = l.where.split(' › ')[0];
      if (where !== lastWhere) {
        doc += `\n**${where || '(top level)'}**\n\n`;
        lastWhere = where;
      }
      // A reply button is the player's own answer, whoever asked.
      const who = l.role === 'button' ? null : speakerName(l.who);
      const tag = l.role ? `*${l.role}* ` : '';
      doc += `- ${tag}${who ? `**${who}:** ` : ''}${md(l.text)} <sub>${l.where.split(' › ').slice(1).join(' › ')} · ${file.split('/').pop()}:${l.line}</sub>\n`;
    }
  }
}

// The dictionary, whole, by section.
const en = readFileSync(join(ROOT, 'src/i18n/en.ts'), 'utf8');
// (Read with the parser too: several entries share a line in places, and quotes vary.)
const enSf = ts.createSourceFile('en.ts', en, ts.ScriptTarget.Latest, true);
const entries = [];
const collect = (node) => {
  if (ts.isPropertyAssignment(node) && (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name))) {
    const text = textOf(node.initializer, enSf);
    if (text !== null) entries.push({ key: node.name.text, text });
    return;
  }
  ts.forEachChild(node, collect);
};
collect(enSf);
doc += `\n## The dictionary (src/i18n/en.ts)\n`;
let section = null;
for (const e of entries) {
  const s = e.key.split('.')[0];
  if (s !== section) {
    doc += `\n### ${s}\n\n`;
    section = s;
  }
  doc += `- \`${e.key}\`: ${md(e.text)}\n`;
}
total += entries.length;

writeFileSync(OUT, doc);
console.log(`docs/manuscript.md: ${total} pieces of text (${entries.length} from the dictionary).`);
