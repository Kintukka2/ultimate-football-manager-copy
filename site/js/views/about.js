// About: who UFMWiz is, what it is not, where the data comes from and what
// it keeps. The disclaimer is word for word from the Brand Book.

export function render() {
  return `<div class="wrap"><div class="prose">
    <p class="answer">Free tools for Ultimate Football Manager 27 that do the counting so you can do the managing.</p>
    <p>UFMWiz is for the player who already likes UFM and wants to spend less time doing arithmetic on a phone: which cards finish a PTC, whether a squad clears its Chemistry steps, what a pack actually holds, and how many wins the Weekend League rank needs. It is the sibling of <a href="https://fhcwiz.com/" rel="noopener">FHCWiz</a>, which does the same for Football Head Coach 27.</p>
    <h2>What UFMWiz is not</h2>
    <ul>
      <li><strong>Not official.</strong> Not made, endorsed or reviewed by Gamebasics or Miniclip.</li>
      <li><strong>Not a hack.</strong> We never offer mods, gem generators, account services or anything that touches the game. Anything that promises "unlimited gems" is a scam.</li>
      <li><strong>Not a pack hype channel.</strong> We report odds and value. We don't celebrate pulls or push spending.</li>
    </ul>
    <h2>Where the numbers come from</h2>
    <p>The rules the tools count with are the ones the game prints: in its help text, its screens and its own words. Where a number comes from players instead, like the Weekend League's QP threshold, the page says "players report" and gives the month. Card data comes from what players can see on their cards and enter by hand or import as CSV. No ratings are taken from the game's files or servers, and no game art, card art, logos or player photos are used anywhere on the site.</p>
    <h2>Privacy</h2>
    <p>There are no accounts, no cookies, no analytics and no ads. The cards, squads and challenges you enter are saved in this browser's own storage, on this device, and never leave it: clear your browser's site data and they are gone, so export your cards as CSV from Players if you want a copy. The page loads its three typefaces from Google Fonts, which means your browser asks Google's servers for them.</p>
    <h2>The disclaimer</h2>
    <p>UFMWiz is an independent fan project. It is not affiliated with, endorsed by or sponsored by Gamebasics BV or Miniclip. Ultimate Football Manager and UFM are trademarks of their respective owners. Player names and ratings are shown as reference data only.</p>
  </div></div>`;
}

export function mount(body) { body.innerHTML = render(); }
