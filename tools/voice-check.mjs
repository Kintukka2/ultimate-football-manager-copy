// Holds every word a reader sees to the faults in docs/voice.md that have a
// mechanical signature. The rest of the voice still needs reading; a pattern
// can't tell leading with a price from mentioning one where it belongs.
//
// It reads two kinds of copy:
//   - the built pages under site/, as visible text (tags, scripts and
//     comments dropped; title, alt, aria-label and placeholder kept), with the
//     headings checked on their own for display-type rules
//   - the string literals in the modules that write copy at run time (views,
//     help, the card form and the data files), with comments dropped first
//
// Comments and docs/ are never read: a maintainer's note is allowed to name a
// file or say how the data was gathered, which a reader's copy is not.
//
//   node tools/voice-check.mjs        exit 1 and list what to rewrite
//
// The rules are exported so the tests can prove each one fires, and so any
// other copy (social posts, a launch script) can be held to the same list.

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(REPO, 'site');

// One rule per fault. `why` is what gets printed, so it says what to do.
export const RULES = [
  { id: 'the game\'s words: PTC', re: /\b(SBCs?|squad building challenges?)\b/i, why: 'the game says Player Trade Challenge, PTC for short' },
  { id: 'the game\'s words: coins', re: /\b(bucks|cash)\b/i, why: 'the soft currency is coins in prose (the HUD says Money)' },
  { id: 'the game\'s words: gems', re: /\b(diamonds|rubies)\b/i, why: 'the premium currency is gems' },
  { id: 'the game\'s words: Unsellable', re: /\buntrad(e)?able\b/i, why: 'the game says Unsellable' },
  { id: 'the game\'s words: Weekend League', re: /\bFUT Champions\b/i, why: 'the mode is the Weekend League' },
  { id: 'the game\'s words: Collection Book', re: /\balbum\b/i, why: 'the game says Collection Book' },
  { id: 'the game\'s words: Fitness or Energy', re: /\bstamina\b/i, why: 'per-player Fitness, or the Energy a Quick Match costs' },
  { id: 'the game\'s words: Chemistry', re: /\bchem\b/i, why: 'write Chemistry, or CHM where space is tight' },
  { id: 'never "boss"', re: /\bboss\b/i, why: 'that is the game\'s coach talking; ours says "you"' },
  { id: 'no emoji', re: /\p{Extended_Pictographic}/u, why: 'no emoji in our copy' },
  { id: 'not loud', re: /!/, why: 'confident because it is checked, never because it is loud: no exclamation marks' },
  { id: 'no pack hype', re: /\b(insane|crazy|epic|unreal|massive) (pulls?|packs?|luck)\b|\bpack luck\b|\bgodly\b/i, why: 'report odds and value; never celebrate a pull' },
  { id: 'true minus', re: /(^|[\s(])-\d/, why: 'a negative number takes a true minus (−), as in Focus −2' },
  { id: 'thousands separator', re: /(^|[\s(])\d{5,}(?![\d,]|\.\d)/, why: 'big numbers take a comma: 21,500 coins' },
  { id: 'defends the data', re: /\b(scraped|scraping|guesswork|nothing to scrape)\b/i, why: 'cut the defence; keep the instruction if there is one' },
  { id: 'names one of our own files', re: /\b[\w-]+\.(md|mjs|js|css|json|csv)\b|\b(docs|tools|site)\//, why: 'say what happened, not which file it went into' },
  { id: 'apologises for the tool', re: /\bthe (solver|planner|builder|tool|site|app) (has no|cannot|can't|is unable)\b/i, why: 'say what the reader does and what they get' },
  { id: 'ranks its own points', re: /\b(honest advice|worth being clear about|to be honest|honestly)\b/i, why: 'cut the phrase that praises the point and keep the point' },
  { id: 'house style: British spelling', re: /\b(colors?|colored|favou?rites?(?<=favorites?)|gray|grayed|analyze[ds]?|center(ed)?|catalog)\b/, why: 'British spelling (colour, favourite, grey, analyse, centre), except a word the game prints its own way' },
];

// Display type: the acronym is set only as the first half of our wordmark.
export const HEADING_RULES = [
  { id: 'the acronym in display type', re: /\bUFM(?!WIZ|Wiz)\b/, why: 'set UFM only inside the wordmark; name the game as Ultimate Football Manager 27, in prose' },
];

// Phrases that carry one of the words for a reason. Each says why.
export const ALLOWED = [
  // The game's own example requirement, word for word, in the PTC Solver.
  '3 players need to be a striker',
  // The game's goal banner, quoted where a post describes the match view.
  'GOAL!!!',
];

const plain = (s) => String(s).replace(/&nbsp;| /g, ' ').replace(/&#39;|&rsquo;/g, "'").replace(/&amp;/g, '&');
export const allowed = (text) => ALLOWED.some((a) => plain(text).toLowerCase().includes(a.toLowerCase()));

export function faultsIn(text, rules = RULES) {
  if (allowed(text)) return [];
  const t = plain(text);
  return rules.filter((r) => r.re.test(t));
}

export function sentencesOf(text) {
  return plain(text).split(/(?<=[.?])\s+|\n+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// Visible text: comments, scripts, styles and tags go; the attributes a
// reader sees or hears stay.
export function pageText(html) {
  const kept = [];
  html.replace(/\s(?:title|alt|aria-label|placeholder)="([^"]*)"/g, (m, v) => { kept.push(v); return ''; });
  const body = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<head>[\s\S]*?<\/head>/i, ' ')
    .replace(/<\/(p|li|h[1-6]|div|td|th|figcaption|button|a|span|b|small)>/gi, '$&\n')
    .replace(/<[^>]+>/g, ' ');
  return `${body}\n${kept.join('\n')}`;
}

export const headings = (html) => [...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

// String literals that read as copy: at least two words. A class list, a
// selector or a path is one token and never reaches the rules. The modules
// are read with a small tokenizer rather than a pattern, because template
// literals nest (`a ${b ? `c` : ''} d`) and a pattern can't follow them; a
// template's pieces either side of each ${} are kept together as one string.
const KEYWORD_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'do', 'else', 'void', 'delete', 'throw', 'new', 'yield', 'await']);

export function scriptStrings(src) {
  const out = [];
  const n = src.length;
  let i = 0;
  let prev = '';      // the last significant character of code
  let word = '';      // the last identifier, for `return /re/`
  const templates = []; // open templates: { parts, depth } where depth counts { inside its current ${}
  const push = (s) => {
    s = s.replace(/<[^>]*>/g, ' ');
    if (/[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(s)) out.push(s);
  };
  function readTemplate(t) {
    let buf = '';
    while (i < n) {
      const c = src[i];
      if (c === '\\') { buf += src[i + 1] === 'n' ? '\n' : (src[i + 1] ?? ''); i += 2; continue; }
      if (c === '`') { i++; t.parts.push(buf); templates.pop(); push(t.parts.join(' ')); prev = ')'; return; }
      if (c === '$' && src[i + 1] === '{') { i += 2; t.parts.push(buf); t.depth = 0; prev = '{'; return; }
      buf += c; i++;
    }
    t.parts.push(buf); templates.pop(); push(t.parts.join(' '));
  }
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1, buf = '';
      while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') { buf += src[j + 1] ?? ''; j += 2; } else buf += src[j++]; }
      i = j + 1;
      push(buf);
      prev = ')'; word = '';
      continue;
    }
    if (c === '`') { i++; const t = { parts: [], depth: 0 }; templates.push(t); readTemplate(t); word = ''; continue; }
    if (c === '/' && (!prev || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || KEYWORD_BEFORE_REGEX.has(word))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break;
        j++;
      }
      i = j + 1;
      while (i < n && /[a-z]/i.test(src[i])) i++;
      prev = ')'; word = '';
      continue;
    }
    const t = templates[templates.length - 1];
    if (t && c === '{') t.depth++;
    if (t && c === '}') {
      if (t.depth === 0) { i++; readTemplate(t); continue; }
      t.depth--;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(src[j])) j++;
      word = src.slice(i, j); prev = 'a'; i = j;
      continue;
    }
    if (/\d/.test(c)) { while (i < n && /[\w.]/.test(src[i])) i++; prev = '0'; word = ''; continue; }
    prev = c; word = ''; i++;
  }
  return out;
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

const SCRIPT_DIRS = ['js/views', 'js/ui', 'js/data'];

export async function scan(root = SITE) {
  const problems = [];
  const files = await walk(root);
  const rel = (f) => relative(REPO, f).split(sep).join('/');
  let count = 0;
  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const html = await readFile(f, 'utf8');
    count++;
    const seen = new Set();
    for (const s of sentencesOf(pageText(html))) {
      for (const r of faultsIn(s)) {
        const key = r.id + s;
        if (!seen.has(key)) { seen.add(key); problems.push({ file: rel(f), rule: r, text: s }); }
      }
    }
    for (const h of headings(html)) for (const r of faultsIn(h, HEADING_RULES)) problems.push({ file: rel(f), rule: r, text: h });
  }
  for (const f of files.filter((x) => x.endsWith('.js') && SCRIPT_DIRS.some((d) => rel(x).startsWith(`site/${d}/`)))) {
    count++;
    for (const lit of scriptStrings(await readFile(f, 'utf8'))) {
      for (const s of sentencesOf(lit)) for (const r of faultsIn(s)) problems.push({ file: rel(f), rule: r, text: s });
    }
  }
  return { problems, count };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, count } = await scan();
  if (!problems.length) {
    console.log(`voice-check: ${count} files clean against docs/voice.md`);
    process.exit(0);
  }
  console.error(`voice-check: ${problems.length} to look at\n`);
  for (const p of problems) console.error(`  ${p.file}  [${p.rule.id}]\n    "${p.text.slice(0, 160)}"\n    -> ${p.rule.why}\n`);
  console.error('Rewrite for the reader rather than working around the pattern.');
  console.error('If a word belongs, add it to ALLOWED in tools/voice-check.mjs with a reason.');
  process.exit(1);
}
