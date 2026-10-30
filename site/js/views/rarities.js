// A route file: the card database pages are drawn by cardpage.js.
import { makeView } from './cardpage.js';

export const { render, show } = makeView('rarities');
