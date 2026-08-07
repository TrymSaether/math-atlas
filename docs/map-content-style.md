# Map content style

This is the authoring contract for every concept in every Math Atlas map. The
goal is consistent meaning, not identical field presence: every concept has a
readable statement, and optional facets are added only when they contribute
different information.

Concept labels use sentence case, preserve proper names and standard acronyms,
and have no terminal punctuation. A concept reused across maps keeps the same
`id`, `label`, and `kind`; map-specific explanations and examples may differ.

## Canonical content fields

| Field | Required | Purpose | Authoring style |
| --- | --- | --- | --- |
| `statement` | yes | The canonical answer to “what is this?” or “what does it say?” | One precise, readable sentence or a short exercise prompt. Use prose with inline `$...$` mathematics. Include the hypotheses needed to avoid a false statement. |
| `formal` | no | A rigorous expansion of the statement | State domains, hypotheses, quantifier scope, and conclusion. Prefer readable prose around mathematics. Explicit `\forall`, `\exists`, and logical connectives are appropriate when their scope is part of the concept. |
| `formula` | no | A compact symbolic extraction | Exactly one `$$...$$` display block. Use it for identities, equivalences, estimates, limits, and compact logical forms. Do not repeat the full prose statement. Keep each `\text{...}` annotation to at most a few words. |
| `intuition` | no | The mental model or reason the concept matters | One to three complete sentences. Explain rather than restate. Avoid proof details. Core concepts should normally have this field. |
| `gloss` | no | A scan-friendly dictionary line | One short complete sentence, normally shorter than `statement`. Omit it when it would duplicate `statement` or `intuition`. |
| `notation` | no | Symbols introduced or commonly used | An array with one inline-math `$...$` item per entry. Store symbols, not explanations or display equations. Omit the key when the array is empty. |

There is deliberately no `content.definition` field. A definition is identified
by `kind: "definition"`; its readable definition belongs in `statement`, its
fully qualified version in `formal`, and its symbolic equivalence in `formula`.

## Quantifiers and logical notation

Do not make every formal statement maximally symbolic.

- In `statement`, write outer logic in words: “for every”, “there exists”, “if”,
  and “then”.
- In `formal`, use prose when it improves readability and symbolic quantifiers
  when exact nesting or scope is mathematically important.
- In `formula`, prefer the compact symbolic equivalent.

Example:

```json
{
  "kind": "definition",
  "label": "Cauchy sequence",
  "content": {
    "statement": "A sequence is Cauchy if its terms become arbitrarily close to one another sufficiently far out.",
    "formal": "Let $(M,d)$ be a metric space and $(x_n)$ a sequence in $M$. The sequence is Cauchy when every positive tolerance eventually bounds all pairwise tail distances.",
    "formula": "$$\\forall\\varepsilon>0\\;\\exists N\\in\\mathbb N\\;\\forall m,n\\ge N:\\ d(x_m,x_n)<\\varepsilon.$$",
    "intuition": "The tail stabilizes internally, whether or not its limit belongs to the space.",
    "notation": ["$(x_n)$"]
  }
}
```

## Other visible fields

### Examples

`examples` is an array of worked or illustrative cases:

```json
{
  "content": "The example in precise prose with inline mathematics.",
  "label": "Optional short title",
  "role": "example"
}
```

`role` is optional and, when present, is one of `example`, `counterexample`,
`non_example`, `application`, or `failure_mode`. Subjects and names belong in
`label`, not `role`. A short one-line example does not need a label.

### Assumptions and properties

- `assumptions` contains free-text hypotheses that are not concept references.
- `properties` contains secondary consequences or characteristics that do not
  belong in the canonical statement.
- Use complete sentences with terminal punctuation.
- Concept dependencies belong in `edges`, not in either array.

### Proof and solution steps

Theorems and exercises share `proof.steps`; the UI labels the block “Solution”
for exercises. Each step has a short sentence-case `role`, complete `content`,
and optional `uses` concept IDs. Omit `uses` when empty.

## Node-kind guidance

| Kind | Statement content | Common optional facets |
| --- | --- | --- |
| definition, structure, object, notation | The readable definition | `formal`, `formula`, `intuition`, examples |
| theorem, lemma, proposition, corollary | Full true claim with essential hypotheses | `formal`, `formula`, `intuition`, proof |
| example, counterexample, non-example | What the case demonstrates or refutes | examples, `intuition`, `formula` |
| exercise | The complete problem prompt | assumptions, solution steps |
| construction, method, proof method | What is built or what the method accomplishes | assumptions, steps, examples |

## Source normalization

Defaults are supplied by the schema. Omit empty `notation`, `examples`,
`assumptions`, `properties`, `tags`, proof-step `uses`, and source `references`.
Omit `priority` when it is `standard`. Never store identical text in two content
facets; the strict schema rejects exact duplicates.

Before accepting a content batch, run the repository validation once. The
schema checks the mechanical contract; mathematical correctness and whether two
different phrasings are substantively redundant still require editorial review.
