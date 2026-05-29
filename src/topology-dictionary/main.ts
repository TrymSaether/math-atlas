import "katex/dist/katex.min.css";
import "./styles.css";

import { DATA_URL } from "./constants";
import { byId, isTypingTarget } from "./dom";
import {
  createInitialState,
  flashEntry,
  initControls,
  render,
  revealRelatedTarget,
  setData,
  setQuery,
} from "./render";
import { initTheme } from "./theme";
import type { DictionaryEntry } from "./types";

const state = createInitialState();

const targets = {
  list: byId<HTMLElement>("list"),
  count: byId<HTMLOutputElement>("count"),
  azbar: byId<HTMLElement>("azbar"),
  entryTotal: byId<HTMLElement>("entry-total"),
};

const queryInput = byId<HTMLInputElement>("q");
const chapterChips = byId<HTMLElement>("chapter-chips");
const kindChips = byId<HTMLElement>("kind-chips");
const sortRow = byId<HTMLElement>("sortrow");

function rerender(): void {
  render(state, targets);
}

initTheme(byId<HTMLButtonElement>("theme"));
initControls(state, targets, chapterChips, kindChips, sortRow, rerender);

queryInput.addEventListener("input", () => {
  setQuery(state, queryInput.value);
  rerender();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || isTypingTarget(event.target)) return;

  event.preventDefault();
  queryInput.focus();
});

targets.list.addEventListener("click", (event) => {
  const anchor = (
    event.target as HTMLElement | null
  )?.closest<HTMLAnchorElement>("a[data-jump]");
  if (!anchor) return;

  const id = anchor.dataset.jump;
  if (!id) return;

  revealRelatedTarget(state, chapterChips, kindChips, queryInput, id, rerender);
  window.setTimeout(() => flashEntry(id), 30);
});

async function start(): Promise<void> {
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${DATA_URL}`);

    const data = (await response.json()) as DictionaryEntry[];
    setData(state, data);
    rerender();
  } catch (error) {
    targets.entryTotal.textContent = "0 entries";
    targets.count.textContent = "0 entries";
    targets.list.innerHTML =
      '<p class="empty">Could not load dictionary data.</p>';
    console.error(error);
  }
}

void start();
