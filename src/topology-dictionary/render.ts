import { CHAPTER_ORDER, CHAPTERS, KIND_FILTERS, KIND_ORDER } from "./constants";
import { escapeHtml, highlight, processInlineMarkup } from "./markup";
import type {
  ChapterId,
  DictionaryEntry,
  FilterValue,
  SortMode,
} from "./types";

interface RenderState {
  data: DictionaryEntry[];
  activeChapter: FilterValue;
  activeKind: FilterValue;
  query: string;
  sortBy: SortMode;
}

interface RenderTargets {
  list: HTMLElement;
  count: HTMLOutputElement;
  azbar: HTMLElement;
  entryTotal: HTMLElement;
}

export function createInitialState(): RenderState {
  return {
    data: [],
    activeChapter: "all",
    activeKind: "all",
    query: "",
    sortBy: "alpha",
  };
}

export function setData(state: RenderState, data: DictionaryEntry[]): void {
  state.data = data;
}

export function initControls(
  state: RenderState,
  targets: RenderTargets,
  chapterChips: HTMLElement,
  kindChips: HTMLElement,
  sortRow: HTMLElement,
  onRender: () => void,
): void {
  chapterChips.appendChild(
    makeChip("All chapters", "all", state.activeChapter === "all", (value) => {
      state.activeChapter = value;
      syncPressed(chapterChips, value);
      onRender();
    }),
  );

  Object.entries(CHAPTERS).forEach(([key, label]) => {
    const chapter = key as ChapterId;
    const shortLabel =
      `${chapter.match(/[AB]/) ? chapter : `Ch ${chapter}`} · ` +
      label.replace(/^Appendix . — /, "");

    chapterChips.appendChild(
      makeChip(
        shortLabel,
        chapter,
        state.activeChapter === chapter,
        (value) => {
          state.activeChapter = value;
          syncPressed(chapterChips, value);
          onRender();
        },
      ),
    );
  });

  KIND_FILTERS.forEach((kind) => {
    const label = kind === "all" ? "All kinds" : `${kind}s`;
    kindChips.appendChild(
      makeChip(label, kind, state.activeKind === kind, (value) => {
        state.activeKind = value;
        syncPressed(kindChips, value);
        onRender();
      }),
    );
  });

  const sortLabel = document.createElement("span");
  sortLabel.className = "sort-label";
  sortLabel.textContent = "Sort";
  sortRow.appendChild(sortLabel);

  [
    { value: "alpha", label: "A–Z" },
    { value: "chapter", label: "Chapter" },
    { value: "kind", label: "Kind" },
  ].forEach(({ value, label }) => {
    const id = `sort-${value}`;

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "sort";
    input.id = id;
    input.value = value;
    input.checked = value === state.sortBy;
    input.addEventListener("change", () => {
      state.sortBy = value as SortMode;
      onRender();
    });

    const chip = document.createElement("label");
    chip.htmlFor = id;
    chip.className = "sort-chip";
    chip.textContent = label;

    sortRow.append(input, chip);
  });

  render(state, targets);
}

function makeChip(
  label: string,
  value: string,
  active: boolean,
  onClick: (value: string) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "chip";
  button.type = "button";
  button.textContent = label;
  button.dataset.value = value;
  button.setAttribute("aria-pressed", String(active));
  button.addEventListener("click", () => onClick(value));
  return button;
}

function syncPressed(container: HTMLElement, activeValue: string): void {
  Array.from(container.querySelectorAll<HTMLButtonElement>(".chip")).forEach(
    (button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.value === activeValue),
      );
    },
  );
}

export function setQuery(state: RenderState, query: string): void {
  state.query = query.trim();
}

export function render(state: RenderState, targets: RenderTargets): void {
  const items = getFilteredItems(state);
  targets.entryTotal.textContent = `${state.data.length} entries`;
  targets.count.textContent = `${items.length} / ${state.data.length} entries`;
  targets.list.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No entries match — try a broader search.";
    targets.list.appendChild(empty);
    buildAZ([], targets.azbar);
    return;
  }

  let groupKey = "";
  for (const entry of items) {
    const group = getGroup(entry, state.sortBy);
    if (group.key !== groupKey) {
      groupKey = group.key;
      const heading = document.createElement("h2");
      heading.className = "letter-head";
      heading.id = group.id;
      heading.textContent = group.label;
      targets.list.appendChild(heading);
    }

    targets.list.appendChild(cardEl(entry, state));
  }

  if (state.sortBy === "alpha") {
    targets.azbar.hidden = false;
    buildAZ(items, targets.azbar);
  } else {
    targets.azbar.hidden = true;
  }
}

function getFilteredItems(state: RenderState): DictionaryEntry[] {
  const items = state.data.filter((entry) => {
    const matchesChapter =
      state.activeChapter === "all" || entry.chapter === state.activeChapter;
    const matchesKind =
      state.activeKind === "all" || entry.kind === state.activeKind;
    const matchesQuery = !state.query || matches(entry, state.query);

    return matchesChapter && matchesKind && matchesQuery;
  });

  return items.sort((a, b) => compareEntries(a, b, state.sortBy));
}

function compareEntries(
  a: DictionaryEntry,
  b: DictionaryEntry,
  sortBy: SortMode,
): number {
  const alpha = a.term.localeCompare(b.term, undefined, {
    sensitivity: "base",
  });

  if (sortBy === "chapter") {
    return (
      CHAPTER_ORDER.indexOf(a.chapter) - CHAPTER_ORDER.indexOf(b.chapter) ||
      alpha
    );
  }

  if (sortBy === "kind") {
    return (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99) || alpha;
  }

  return alpha;
}

function matches(entry: DictionaryEntry, query: string): boolean {
  const haystack = [
    entry.term,
    entry.gloss,
    entry.statement,
    entry.example,
    entry.ref,
    entry.kind,
    entry.chapter,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getGroup(
  entry: DictionaryEntry,
  sortBy: SortMode,
): { key: string; label: string; id: string } {
  if (sortBy === "chapter") {
    return {
      key: entry.chapter,
      label: `Ch. ${entry.chapter} · ${CHAPTERS[entry.chapter]}`,
      id: `G-ch-${entry.chapter}`,
    };
  }

  if (sortBy === "kind") {
    return {
      key: entry.kind,
      label: `${entry.kind}s`,
      id: `G-kind-${entry.kind}`,
    };
  }

  const letter = entry.term[0]?.toUpperCase() || "#";
  return {
    key: letter,
    label: letter,
    id: `L-${letter}`,
  };
}

function cardEl(entry: DictionaryEntry, state: RenderState): HTMLElement {
  const card = document.createElement("article");
  card.className = "card";
  card.id = entry.id;

  const related = (entry.related ?? [])
    .map((id) => {
      const target = state.data.find((candidate) => candidate.id === id);
      return target
        ? `<a href="#${escapeHtml(id)}" data-jump="${escapeHtml(id)}">${escapeHtml(target.term)}</a>`
        : "";
    })
    .filter(Boolean)
    .join(" &middot; ");

  const chapterTitle = CHAPTERS[entry.chapter].replace(/^Appendix . — /, "");
  const diagram = entry.diagramPath
    ? `<img src="${escapeHtml(entry.diagramPath)}" alt="${escapeHtml(
        entry.diagramAlt || `Diagram for ${entry.term}`,
      )}" loading="lazy" decoding="async" />`
    : "";

  card.innerHTML = `
    <div class="body">
      <h3 class="term">${highlight(entry.term, state.query)}</h3>
      <div class="tags">
        <span class="tag kind">${escapeHtml(entry.kind)}</span>
        <span class="tag ref">${escapeHtml(entry.ref)}</span>
        <span class="tag">Ch. ${escapeHtml(entry.chapter)} &middot; ${escapeHtml(chapterTitle)}</span>
      </div>
      <div class="statement">
        <span class="lab">Statement</span>
        <div class="tex-d">${processInlineMarkup(entry.statement)}</div>
      </div>
      <div class="gloss">
        <span class="lab">In words</span>
        ${processInlineMarkup(entry.gloss)}
      </div>
      <div class="example">
        <span class="lab">Example</span>
        ${processInlineMarkup(entry.example)}
      </div>
      ${related ? `<div class="related"><span class="lab">See also</span>${related}</div>` : ""}
    </div>
    <div class="dia">${diagram}</div>
  `;

  return card;
}

function buildAZ(items: DictionaryEntry[], container: HTMLElement): void {
  const present = new Set(
    items.map((entry) => entry.term[0]?.toUpperCase()).filter(Boolean),
  );
  container.replaceChildren();

  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
    if (!present.has(letter)) return;

    const anchor = document.createElement("a");
    anchor.textContent = letter;
    anchor.href = `#L-${letter}`;
    container.appendChild(anchor);
  });
}

export function revealRelatedTarget(
  state: RenderState,
  chapterChips: HTMLElement,
  kindChips: HTMLElement,
  queryInput: HTMLInputElement,
  id: string,
  onRender: () => void,
): void {
  const target = state.data.find((entry) => entry.id === id);
  if (!target) return;

  const targetIsHidden =
    (state.activeChapter !== "all" && target.chapter !== state.activeChapter) ||
    (state.activeKind !== "all" && target.kind !== state.activeKind) ||
    state.query.length > 0;

  if (targetIsHidden) {
    state.activeChapter = "all";
    state.activeKind = "all";
    state.query = "";
    queryInput.value = "";
    syncPressed(chapterChips, "all");
    syncPressed(kindChips, "all");
    onRender();
  }
}

export function flashEntry(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;

  element.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
  });

  element.classList.remove("flash");
  void element.offsetWidth;
  element.classList.add("flash");
}
