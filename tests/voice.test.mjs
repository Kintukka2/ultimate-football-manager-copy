// The voice tripwires (docs/voice.md). A check that has never failed proves
// nothing, so each rule is first shown to fire on the Brand Book's own "Don't"
// examples, then shown to stay quiet on its "Do" ones, and only then run over
// every word the site shows.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RULES, HEADING_RULES, faultsIn, scriptStrings, pageText, headings, scan } from '../tools/voice-check.mjs';

const fires = (text, id) => faultsIn(text).some((r) => r.id === id);

test('each rule fires on the copy it was written for', () => {
  const cases = [
    ['Hey boss, your players need some love in the training ground', 'never "boss"'],
    ['Your players need some love \u{1F4AA}', 'no emoji'],
    ['INSANE pull from a Screamers Mega Pack', 'no pack hype'],
    ['Grinding the Weekend League is tough, but you can climb to the very top!', 'not loud'],
    ['Finish the SBC before it expires.', 'the game\'s words: PTC'],
    ['This card is untradeable.', 'the game\'s words: Unsellable'],
    ['Save up 50 bucks for a gold pack.', 'the game\'s words: coins'],
    ['Focus runs from -2 to +2.', 'true minus'],
    ['A gold pack costs 7500 coins and a rare one 21500.', 'thousands separator'],
    ['Your cards are saved in mycards.json.', 'names one of our own files'],
    ['The ratings were scraped from the game.', 'defends the data'],
    ['The solver cannot read your club.', 'apologises for the tool'],
    ['Honestly, Chemistry matters more than OVR.', 'ranks its own points'],
    ['Pick a color for your squad.', 'house style: British spelling'],
    ['Your stamina drops after training.', 'the game\'s words: Fitness or Energy'],
    ['Spend 50 diamonds on a Mega Pack.', 'the game\'s words: gems'],
    ['Qualify for FUT Champions this weekend.', 'the game\'s words: Weekend League'],
    ['Fill your album with every Screamers card.', 'the game\'s words: Collection Book'],
    ['Stack chem across the eleven.', 'the game\'s words: Chemistry'],
  ];
  for (const [text, id] of cases) assert.ok(fires(text, id), `${id} should fire on: ${text}`);
  // every rule is exercised by at least one case above
  for (const r of RULES) assert.ok(cases.some(([, id]) => id === r.id), `no case proves "${r.id}" fires`);
  assert.ok(faultsIn('UFM 27 PTC SOLVER', HEADING_RULES).length, 'the acronym in a heading fires');
  assert.equal(faultsIn('UFMWiz', HEADING_RULES).length, 0, 'the wordmark itself does not');
});

test('the Brand Book\'s "Do" examples pass', () => {
  const good = [
    'Rank 1 needs 55 points from 15 games. A win is 4, a loss is 1, so that\'s 14 wins.',
    'Train after each league match. Focus re-rolls when the match ends, so earlier training is wasted.',
    'Players report one gold around 76 from the 7,500-coin gold pack. Check the market price of the card you need before you open one.',
    'Focus runs from −2 to +2.',
    'Team OVR 86.2, CHM +2.0, 21,500 coins, 2.5% (1 in 40), Sat 31 Oct, 7H 59M.',
    'The defence makes an M and the five forwards make a W.',
    'The colours are measured, and the 4-3-3 Attack has a CAM.',
  ];
  for (const s of good) assert.deepEqual(faultsIn(s).map((r) => r.id), [], s);
});

test('the modules are read as copy, nested templates and all', async () => {
  const src = 'const a = `Win ${n} of ${x ? `the last ${k}` : \'none\'} games left`; // a comment, boss!\n'
    + 'const re = /it\'s "quoted"/g; const b = "A second sentence here."; import x from \'./y.js\';';
  const out = scriptStrings(src);
  assert.ok(out.some((s) => /Win .* of .* games left/.test(s)), JSON.stringify(out));
  assert.ok(out.some((s) => s.includes('the last')));
  assert.ok(out.includes('A second sentence here.'));
  assert.ok(!out.join(' ').includes('boss'), 'comments are not copy');
  assert.ok(!out.join(' ').includes('quoted'), 'a regular expression is not copy');
  const posts = scriptStrings(await readFile(new URL('../site/js/data/posts.js', import.meta.url), 'utf8'));
  assert.ok(posts.some((s) => s.includes('Rank 1 needs 55 points')), 'the posts are reached');
});

test('pages are read as visible text, headings apart', () => {
  const html = '<head><title>UFM 27 tools</title></head><body><h1>Packs</h1><!-- boss! --><script>var a = "boss!"</script>'
    + '<p>Open <b>one</b> pack.</p><button aria-label="Close help">x</button></body>';
  const text = pageText(html);
  assert.ok(text.includes('Open') && text.includes('Close help'));
  assert.ok(!text.includes('boss'), 'comments and scripts are not copy');
  assert.ok(!text.includes('UFM 27 tools'), 'the head is metadata, not display type');
  assert.deepEqual(headings(html), ['Packs']);
});

test('every word the site shows reads in our voice', async () => {
  const { problems, count } = await scan();
  assert.ok(count > 20, `the scan reached the site (${count} files)`);
  assert.deepEqual(problems.map((p) => `${p.file} [${p.rule.id}] ${p.text.slice(0, 90)}`), []);
});
