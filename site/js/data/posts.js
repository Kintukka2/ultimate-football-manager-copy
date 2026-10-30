// Blog posts. Each one opens with the answer, uses the game's own words, shows
// the arithmetic, and states the date and the game version it was checked on.
// `figure` names a board figure from lib/board.js; it is drawn after the answer.

export const POSTS = [
  {
    slug: 'weekend-league-rank-1',
    series: 'How It Works',
    title: 'Weekend League: what rank 1 takes',
    dek: '55 points from 15 games, which is 14 wins. You can drop one game, not two.',
    date: '2026-10-30', version: '27.4.0',
    figure: 'fifteenGames',
    figureCaption: 'Fifteen games. Thirteen wins in marker, the one loss you can afford, and the bib on the fourteenth win: the one that makes rank 1.',
    html: `
<p class="answer">Rank 1 needs 55 points from your 15 Weekend League games. A win is worth 4 points and a loss 1, so you need 14 wins: you can lose one game, not two.</p>
<h2>The arithmetic</h2>
<p>Every game you play scores at least the 1 point a loss gives, so 15 games guarantee 15 points. A win is worth 3 more than that. So your total is <strong>15 + 3 × wins</strong>, and rank 1 needs 15 + 3 × wins ≥ 55, which means 3 × wins ≥ 40. Thirteen wins give 54, one point short. Fourteen give 57.</p>
<div class="dtable-wrap"><table class="dtable">
<thead><tr><th>Wins</th><th>Losses</th><th class="n">Points</th><th>Rank 1?</th></tr></thead>
<tbody>
<tr class="is-on"><td class="big">15</td><td>0</td><td class="n big">60</td><td class="pos-t">Yes</td></tr>
<tr class="is-on"><td class="big">14</td><td>1</td><td class="n big">57</td><td class="pos-t">Yes</td></tr>
<tr><td class="big">13</td><td>2</td><td class="n big">54</td><td>1 point short</td></tr>
<tr><td class="big">12</td><td>3</td><td class="n big">51</td><td>4 short</td></tr>
<tr><td class="big">10</td><td>5</td><td class="n big">45</td><td>10 short</td></tr>
</tbody></table></div>
<p>The game has ten rank tiers. Rank 1 at 55 points is the one the game prints in its help; for the others, put the target from your rank screen into the <a href="ufm27/weekend-league/">Weekend League planner</a> and it does the same sum.</p>
<h2>First, qualify</h2>
<p>You earn Qualification Points (QP) by winning League and Quick Match games, and you need to reach the threshold before the weekend timer runs out. Players report that the threshold rose to <strong>1,500 QP</strong> in UFM 27, from 1,000 in UFM 26 (September 2026). The game doesn't print what a win is worth, so the planner asks for the QP your last win showed and counts the wins from there.</p>
<h2>Enter at your best</h2>
<p>A Weekend League game is worth far more than a Quick Match, so play it with the squad at its peak:</p>
<ul>
<li><strong>Focus</strong> re-rolls after every league match. Train after the league result and claim the sessions before your Weekend League games, not before the league match.</li>
<li><strong>Fitness</strong> comes back at 1% an hour. A starter on 70% needs 30 hours to be fresh, so rest them earlier in the week.</li>
<li><strong>Chemistry</strong> counts the starting eleven only. Check it in the <a href="ufm27/squad-builder/">Squad Builder</a> before you register.</li>
</ul>`,
  },
  {
    slug: 'how-chemistry-works',
    series: 'How It Works',
    title: 'Chemistry: where the +3 comes from',
    dek: 'Starters who share a nationality, a league or a special rarity. Where they stand doesn\'t matter, and the bench never counts.',
    date: '2026-10-30', version: '27.4.0',
    html: `
<p class="answer">Chemistry adds up to +3 to a starter's OVR and to every one of their sub-stats. It comes from starters who share a nationality, a league or a special rarity. Where they stand on the pitch doesn't matter, and the bench never counts.</p>
<h2>What counts</h2>
<ul>
<li><strong>Nationality, league and special rarity.</strong> Each is a group. When enough of your starting eleven share one, every player in it gets a boost.</li>
<li><strong>Only the starting eleven.</strong> The game's help says it plainly: "the bench is excluded from Chemistry boosts". Your bench can be anyone.</li>
<li><strong>Not position, not neighbours.</strong> "It doesn't matter if the players are positioned next to each other." Two Brazilians at left-back and striker link as well as two side by side.</li>
<li><strong>A cap of +3 per player.</strong> However many groups a player is in, they top out at +3, and the +3 goes on their OVR and every sub-stat.</li>
</ul>
<h2>The thresholds</h2>
<p>Boosts arrive in steps. The game's help gives the first two for a nationality: <strong>2 players for +1, 5 players for +2</strong>. The higher nationality step and the steps for leagues and rarities are only shown in the game's own Chemistry view, so the <a href="ufm27/squad-builder/">Squad Builder</a> lets you type them in once and keeps them.</p>
<h2>Build it on purpose</h2>
<p>Because adjacency doesn't matter, the best Chemistry squad is just the best eleven who share tags. Stack one league, one nationality and one special rarity across as many starters as you can, and check each player's total before you buy anyone.</p>
<p>What it is worth: +3 on every starter adds 3 to the average of your eleven. That is the same as replacing every starter with a card rated 3 higher, for the price of picking players who belong together.</p>
<h2>How the game reports it</h2>
<p>Match feedback compares your average Chemistry with your opponent's ("Our average Chemistry level was better than theirs"), and the Match Preparation checklist before a League game has a Chemistry line. If you see "Their players' Chemistry levels were higher", it is the starters, not the bench, that need changing.</p>`,
  },
  {
    slug: 'fitness-focus-training',
    series: 'How It Works',
    title: 'Fitness, Focus and when to train',
    dek: 'Train right after each league match. Focus re-rolls when it ends, and Fitness only comes back at 1% an hour.',
    date: '2026-10-30', version: '27.4.0',
    html: `
<p class="answer">Train right after each league match. Focus re-rolls when the league match ends, so a session claimed before it is wasted, and Fitness comes back at only 1% an hour, so every session has a cost you will feel for days.</p>
<h2>Fitness: 1% an hour</h2>
<p>Players lose Fitness after every League match and every training session, and get it back at <strong>1% an hour</strong>, automatically. Lower Fitness lowers how a player performs.</p>
<div class="dtable-wrap"><table class="dtable">
<thead><tr><th>From</th><th class="n">Hours to 100%</th><th>About</th></tr></thead>
<tbody>
<tr><td class="big">40%</td><td class="n big">60</td><td>2 days 12 hours</td></tr>
<tr><td class="big">60%</td><td class="n big">40</td><td>1 day 16 hours</td></tr>
<tr><td class="big">75%</td><td class="n big">25</td><td>1 day 1 hour</td></tr>
<tr><td class="big">90%</td><td class="n big">10</td><td>10 hours</td></tr>
</tbody></table></div>
<p>Quick Matches are the exception. Players tire during one, but Fitness resets when it ends: "You can play as many Quick Matches as you'd like without draining the players' fitness." Energy Bars at the Fitness Coach and rewarded videos top it up faster.</p>
<h2>Focus: −2 to +2, re-rolled</h2>
<p>Focus is a temporary boost from −2 to +2, shown by the arrow on the card, and it adds to OVR and every sub-stat. It is <strong>re-rolled at random after every League game</strong>, and the new roll can be negative. Training is the only way to raise it, and it can't go above +2.</p>
<h2>The rhythm</h2>
<ul>
<li>There are <strong>four training slots</strong>. Medium Training runs about 4 hours, Long Training about 8, and longer sessions give bigger, more reliable gains.</li>
<li>Start Long sessions as soon as the league result is in, and claim them before the next kick-off.</li>
<li>Spend the four slots on your lowest-Focus starters. A bench player's Focus only matters once they come on.</li>
<li>Training costs Fitness. Keep a second Lineup Preset of fresh players, and set Auto Substitutions to Frequent in League games to spread the minutes.</li>
</ul>`,
  },
];
