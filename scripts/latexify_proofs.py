#!/usr/bin/env python3
"""Convert PDF-extracted Unicode-math proofs into clean LaTeX with $...$ spans.

The proofs in src/data/maps/topology.json arrive from `pdftotext` as raw Unicode:
mathematical-alphanumeric letters (𝑋, 𝑓, 𝒯, 𝖡), blackboard/script styles, and
Unicode operators (∈, ⊆, →, ∶). Prose is plain ASCII. That clean split lets us
tokenize math runs (anything containing a "strong" math glyph, greedily absorbing
adjacent digits / brackets / operators) and wrap them in $...$, mapping each glyph
to its LaTeX command. Subscripts (𝑈𝜆 → U_\\lambda, 𝑥0 → x_0) and the inverse
superscript (𝑓 −1 → f^{-1}) are reconstructed from the extraction's spacing
conventions (no space = subscript; " −1" after a symbol = inverse).

Usage:
    python3 scripts/latexify_proofs.py            # preview all converted proofs
    python3 scripts/latexify_proofs.py --write     # write back into topology.json
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

JSON_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "maps" / "topology.json"

GREEK_TO_CMD = {
    "ALPHA": "alpha", "BETA": "beta", "GAMMA": "gamma", "DELTA": "delta",
    "EPSILON": "epsilon", "ZETA": "zeta", "ETA": "eta", "THETA": "theta",
    "IOTA": "iota", "KAPPA": "kappa", "LAMDA": "lambda", "LAMBDA": "lambda",
    "MU": "mu", "NU": "nu", "XI": "xi", "OMICRON": "omicron", "PI": "pi",
    "RHO": "rho", "SIGMA": "sigma", "TAU": "tau", "UPSILON": "upsilon",
    "PHI": "phi", "CHI": "chi", "PSI": "psi", "OMEGA": "omega",
}

# Direct operator / symbol map (non-alphanumeric Unicode → LaTeX).
OPERATORS = {
    "∅": r"\varnothing", "∈": r"\in", "∉": r"\notin", "∋": r"\ni",
    "⊆": r"\subseteq", "⊂": r"\subset", "⊊": r"\subsetneq",
    "⊇": r"\supseteq", "⊃": r"\supset", "⊋": r"\supsetneq",
    "∩": r"\cap", "∪": r"\cup", "⋂": r"\bigcap", "⋃": r"\bigcup",
    "→": r"\to", "↦": r"\mapsto", "⟶": r"\longrightarrow",
    "⇒": r"\Rightarrow", "⟹": r"\Longrightarrow", "↔": r"\leftrightarrow",
    "⇔": r"\Leftrightarrow", "←": r"\leftarrow", "↪": r"\hookrightarrow",
    "≅": r"\cong", "≃": r"\simeq", "≈": r"\approx", "≠": r"\neq",
    "≤": r"\leq", "≥": r"\geq", "≪": r"\ll", "≫": r"\gg",
    "∞": r"\infty", "∘": r"\circ", "∗": "*", "⋆": r"\star",
    "×": r"\times", "·": r"\cdot", "∙": r"\cdot", "±": r"\pm", "∓": r"\mp",
    "∂": r"\partial", "∇": r"\nabla", "⧵": r"\setminus", "∖": r"\setminus",
    "⟨": r"\langle", "⟩": r"\rangle", "⌊": r"\lfloor", "⌋": r"\rfloor",
    "⌈": r"\lceil", "⌉": r"\rceil",
    "⋯": r"\cdots", "…": r"\ldots", "⋮": r"\vdots", "⋱": r"\ddots",
    "∀": r"\forall", "∃": r"\exists", "∄": r"\nexists", "¬": r"\neg",
    "∧": r"\wedge", "∨": r"\vee", "⊻": r"\veebar",
    "∑": r"\sum", "∏": r"\prod", "∫": r"\int", "√": r"\sqrt",
    "∼": r"\sim", "≡": r"\equiv", "⊕": r"\oplus", "⊗": r"\otimes",
    "⊥": r"\perp", "∣": r"\mid", "∥": r"\parallel", "⊢": r"\vdash",
    "∶": ":", "∝": r"\propto", "≔": ":=", "≜": r"\triangleq",
    "⟂": r"\perp", "△": r"\triangle", "□": r"\square", "■": r"\blacksquare",
    "↑": r"\uparrow", "↓": r"\downarrow", "⨯": r"\times",
    "′": "'", "″": "''", "‴": "'''",
    "−": "-", "∕": "/", "⁄": "/",
    "ℵ": r"\aleph", "∅": r"\varnothing",
    "⨆": r"\bigsqcup", "⊔": r"\sqcup", "⊓": r"\sqcap", "≺": r"\prec",
    "◦": r"\circ", "⩽": r"\leq", "⩾": r"\geq", "⟦": r"\llbracket",
    "⟧": r"\rrbracket", "≲": r"\lesssim", "≳": r"\gtrsim", "⊴": r"\trianglelefteq",
    "⊲": r"\vartriangleleft", "≀": r"\wr", "⋊": r"\rtimes", "⋉": r"\ltimes",
    "↠": r"\twoheadrightarrow", "↣": r"\rightarrowtail", "⨿": r"\amalg",
}

# Letterlike symbols outside the mathematical-alphanumeric block.
LETTERLIKE = {
    "ℎ": "h", "ℏ": r"\hbar", "ℓ": r"\ell", "℘": r"\wp",
    "ℜ": r"\Re", "ℑ": r"\Im", "ℵ": r"\aleph",
}

# Combining accents → wrapping LaTeX command.
COMBINING = {
    "̂": "hat", "̃": "tilde", "̄": "bar", "̅": "bar",
    "̇": "dot", "̈": "ddot", "̆": "breve", "̌": "check",
    "⃗": "vec", "́": "acute", "̀": "grave",
}

# Unicode sub/superscript digits.
SUPERSCRIPTS = {"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5",
                "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+",
                "ⁿ": "n", "ⁱ": "i"}
SUBSCRIPTS = {"₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5",
              "₆": "6", "₇": "7", "₈": "8", "₉": "9", "₋": "-", "₊": "+",
              "ₙ": "n", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₘ": "m", "ₚ": "p",
              "ₗ": "l", "ₐ": "a", "ₓ": "x"}

# Plain (non-mathematical-block) Greek letters, just in case.
PLAIN_GREEK = {chr(c): None for c in range(0x391, 0x3CA)}

# Lowercase greek command atoms (for the "greek constant × latin letter" product
# heuristic: 2πt is a product, not π_t) and operator commands (for placing a
# floated accent onto the following variable rather than onto an operator).
GREEK_COMMANDS = {"\\" + c for c in GREEK_TO_CMD.values()} | {
    "\\varepsilon", "\\varphi", "\\vartheta", "\\varkappa", "\\varrho",
    "\\varpi", "\\varsigma",
}
OP_COMMANDS = {v for v in OPERATORS.values() if v.startswith("\\")}


def decode_math_alnum(ch: str):
    """Return (base_latex, is_letter) for a math-alphanumeric / letterlike glyph,
    or None if ch is not such a glyph."""
    try:
        name = unicodedata.name(ch)
    except ValueError:
        return None

    style = ""
    if "SCRIPT" in name:
        style = "mathcal"
    elif "FRAKTUR" in name or "BLACK-LETTER" in name:
        style = "mathfrak"
    elif "DOUBLE-STRUCK" in name:
        style = "mathbb"
    elif "MONOSPACE" in name:
        style = "mathtt"
    elif "SANS-SERIF" in name:
        style = "mathsf"

    def wrap(core: str) -> str:
        return f"\\{style}{{{core}}}" if style else core

    # Letterlike-block blackboard letters (ℝ ℕ ℤ ℚ ℂ ℋ …).
    m = re.match(r"DOUBLE-STRUCK (CAPITAL|SMALL) ([A-Z])$", name)
    if m:
        letter = m.group(2)
        return (f"\\mathbb{{{letter if m.group(1)=='CAPITAL' else letter.lower()}}}", True)
    m = re.match(r"SCRIPT (CAPITAL|SMALL) ([A-Z])$", name)
    if m:
        letter = m.group(2)
        return (f"\\mathcal{{{letter if m.group(1)=='CAPITAL' else letter.lower()}}}", True)

    if name.startswith("MATHEMATICAL"):
        # Letter
        m = re.search(r"(CAPITAL|SMALL) ([A-Z])$", name)
        if m:
            letter = m.group(2)
            core = letter if m.group(1) == "CAPITAL" else letter.lower()
            return (wrap(core), True)
        # Greek letter
        m = re.search(r"(CAPITAL|SMALL) ([A-Z]+)$", name)
        if m and m.group(2) in GREEK_TO_CMD:
            cmd = GREEK_TO_CMD[m.group(2)]
            if m.group(1) == "CAPITAL":
                cmd = cmd[0].upper() + cmd[1:]
            return (wrap("\\" + cmd), True)
        # Greek variant glyphs (epsilon/phi/theta/kappa/rho/pi "SYMBOL").
        variant = {
            "EPSILON": "varepsilon", "PHI": "varphi", "THETA": "vartheta",
            "KAPPA": "varkappa", "RHO": "varrho", "PI": "varpi", "SIGMA": "varsigma",
        }
        m = re.search(r"([A-Z]+) SYMBOL$", name)
        if m and m.group(1) in variant:
            return (wrap("\\" + variant[m.group(1)]), True)
        if "FINAL SIGMA" in name:
            return (wrap(r"\varsigma"), True)
        if "NABLA" in name:
            return (r"\nabla", False)
        if "PARTIAL DIFFERENTIAL" in name:
            return (r"\partial", False)
        # Digit
        m = re.search(r"DIGIT (\w+)$", name)
        if m:
            words = {"ZERO": "0", "ONE": "1", "TWO": "2", "THREE": "3",
                     "FOUR": "4", "FIVE": "5", "SIX": "6", "SEVEN": "7",
                     "EIGHT": "8", "NINE": "9"}
            d = words.get(m.group(1))
            if d:
                return (wrap(d), False)
        # Dotless i/j and a few partials
        if "PARTIAL DIFFERENTIAL" in name:
            return (r"\partial", False)

    # Plain Greek block.
    if 0x391 <= ord(ch) <= 0x3C9:
        gname = name.split()[-1]
        if gname in GREEK_TO_CMD:
            cmd = GREEK_TO_CMD[gname]
            if "CAPITAL" in name:
                cmd = cmd[0].upper() + cmd[1:]
            return ("\\" + cmd, True)

    return None


STRONG = "strong"   # math letter / operator that forces math mode
NEUTRAL = "neutral"  # digits, brackets, +-=, etc. — join math if adjacent
PROSE = "prose"     # ascii letters & words


def classify(ch: str) -> str:
    if ch in OPERATORS or ch in SUPERSCRIPTS or ch in SUBSCRIPTS or ch in COMBINING:
        return STRONG
    if ch in LETTERLIKE:
        return STRONG
    if decode_math_alnum(ch) is not None:
        return STRONG
    if ch.isascii() and ch.isalpha():
        return PROSE
    if ch in "0123456789()[]{}+-=/<>|,;.:!?^_'*′ \t":
        return NEUTRAL
    return PROSE


def render_atom(ch: str) -> str:
    if ch in LETTERLIKE:
        return LETTERLIKE[ch]
    dec = decode_math_alnum(ch)
    if dec is not None:
        return dec[0]
    if ch in OPERATORS:
        return OPERATORS[ch]
    if ch == "{":
        return r"\{"
    if ch == "}":
        return r"\}"
    return ch


# Bases that take a superscript index by convention (ℝⁿ, Sⁿ, Dⁿ) rather than a
# subscript. Everything else (πₙ, Uₙ, x₀) defaults to a subscript.
def _is_superscript_base(base: str) -> bool:
    return base.startswith("\\mathbb") or base in {"S", "D"}


def attach_index(base: str, rest: list[str]) -> str:
    """Attach a base atom's trailing index atoms as a sub/superscript."""
    if not rest:
        return base
    if rest == ["c"]:  # set complement is a superscript by convention
        return f"{base}^{{c}}"
    op = "^" if _is_superscript_base(base) else "_"
    if len(rest) == 1 and (len(rest[0]) == 1 or rest[0].startswith("\\")):
        piece = rest[0]
    else:
        piece = "{" + " ".join(rest) + "}"
    return f"{base}{op}{piece}"


def convert_math_run(run: str) -> str:
    """Convert a run of math text (already known to contain strong math) to LaTeX,
    handling subscripts, combining accents, and inverse superscripts."""
    out: list[str] = []
    pending_accent: str | None = None  # accent that floated ahead of its base
    i = 0
    n = len(run)
    while i < n:
        ch = run[i]
        # Combining accent: normally applies to the previous atom; if it leads the
        # run (base wrapped to the previous line), defer it onto the next glyph.
        if ch in COMBINING:
            if out and out[-1].strip():
                prev = out[-1].strip()
                # An accent belongs on a variable, not on an operator/bracket that
                # the extraction happened to drop it after (e.g. "p◦̃g" = p∘g̃).
                if prev in OP_COMMANDS or prev in "()[]{}|*+-=/<>,;:":
                    pending_accent = COMBINING[ch]
                else:
                    out.append(f"\\{COMBINING[ch]}{{{out.pop()}}}")
            else:
                pending_accent = COMBINING[ch]
            i += 1
            continue
        is_letter = (ch in LETTERLIKE) or (decode_math_alnum(ch) is not None and decode_math_alnum(ch)[1])
        if is_letter:  # a letter: gather its index chain (no-space letters/digits)
            base = render_atom(ch)
            if pending_accent:
                base = f"\\{pending_accent}{{{base}}}"
                pending_accent = None
            j = i + 1
            # accent directly on the base (𝛼̂ → \hat{\alpha})
            while j < n and run[j] in COMBINING:
                base = f"\\{COMBINING[run[j]]}{{{base}}}"
                j += 1
            rest: list[str] = []
            while j < n:
                cj = run[j]
                if cj.isascii() and cj.isdigit():
                    rest.append(cj); j += 1; continue
                d2 = decode_math_alnum(cj)
                if d2 is not None:
                    atom = render_atom(cj)
                    # A greek constant followed by a latin letter is a product
                    # (2πt), not a subscript (π_t) — stop gathering.
                    if not rest and base in GREEK_COMMANDS and len(atom) == 1 and atom.isalpha():
                        break
                    while j + 1 < n and run[j + 1] in COMBINING:
                        atom = f"\\{COMBINING[run[j + 1]]}{{{atom}}}"
                        j += 1
                    rest.append(atom); j += 1; continue
                break
            out.append(attach_index(base, rest))
            i = j
            continue
        if ch in SUPERSCRIPTS:
            out.append(f"^{{{SUPERSCRIPTS[ch]}}}")
            i += 1
            continue
        if ch in SUBSCRIPTS:
            out.append(f"_{{{SUBSCRIPTS[ch]}}}")
            i += 1
            continue
        out.append(render_atom(ch))
        i += 1

    # Join atoms, inserting a space only where a control word (\cap, \alpha…) is
    # immediately followed by a letter — otherwise "\cap U" would glue into the
    # undefined macro "\capU". Acting between atoms can never split a command.
    parts: list[str] = []
    for atom in out:
        if parts and re.search(r"\\[a-zA-Z]+$", parts[-1]) and atom[:1].isalpha():
            parts.append(" ")
        parts.append(atom)
    s = "".join(parts)
    # Inverse superscript: "X -1" or "X)-1" -> X^{-1}.
    s = re.sub(r"([A-Za-z}\)\]])\s*-\s*1(?![0-9])", r"\1^{-1}", s)
    # A single-letter subscript immediately followed by "-1" is an index, not an
    # inverse: s_i^{-1} -> s_{i-1}, e_i^{-1} -> e_{i-1}.
    s = re.sub(r"([A-Za-z])_([A-Za-z0-9])\^\{-1\}", r"\1_{\2-1}", s)
    # Sphere / disk with a separated index: "S 1" -> S^{1}, "D 2" -> D^{2}.
    s = re.sub(r"\b([SD])\s+([0-9n])\b", r"\1^{\2}", s)
    # Set-complement superscript c: "K c" -> K^{c}.
    s = re.sub(r"\b([A-Z])\s+c\b", r"\1^{c}", s)
    # Positive part: ℤ+ / ℝ+ -> ℤ^{+}.
    s = re.sub(r"(\\mathbb\{[A-Z]\})\s*\+", r"\1^{+}", s)
    # Fold an empty accent (𝛼 ̂ extracted as "\alpha \hat{ }") back onto the
    # glyph that precedes it, then drop any accent left with an empty argument.
    accents = "hat|tilde|bar|vec|dot|ddot|check|breve|acute|grave"
    s = re.sub(rf"(\\?[A-Za-z]|\\[a-zA-Z]+)\s*\\({accents})\{{\s*\}}", r"\\\2{\1}", s)
    s = re.sub(rf"\\({accents})\{{\s*\}}", "", s)
    # Collapse spaces (KaTeX ignores them anyway).
    s = re.sub(r"\s+", " ", s).strip()
    return s


def tokenize(text: str):
    """Yield (kind, chunk) where kind is 'math' or 'text'. A chunk is 'math' if it
    contains a strong math glyph; neutral chars/spaces are absorbed greedily, but a
    run reverts to text at an ASCII word."""
    tokens = []
    buf = []
    mode = None  # 'math' | 'text'

    def flush():
        if buf:
            tokens.append((mode, "".join(buf)))

    for ch in text:
        c = classify(ch)
        if c == STRONG:
            if mode != "math":
                # Pull a trailing opener ( { [ — and any spaces around it — out of
                # the prose buffer into the math span (e.g. set-builder "{U_λ}").
                carried = ""
                while buf and buf[-1] in "([{":
                    carried = buf.pop() + carried
                while buf and buf[-1] == " " and carried[:1] in "([{":
                    # keep one space in prose, drop the rest before the opener
                    break
                flush(); buf.clear(); mode = "math"
                if carried:
                    buf.append(carried)
            buf.append(ch)
        elif c == PROSE:
            if mode != "text":
                flush(); buf.clear(); mode = "text"
            buf.append(ch)
        else:  # NEUTRAL: stick with current mode (default text)
            if mode is None:
                mode = "text"
            buf.append(ch)
    flush()
    return tokens


def latexify(proof: str) -> str:
    # Rejoin PDF column-wrap line breaks into flowing prose.
    text = re.sub(r"[ \t]*\n[ \t]*", " ", proof.replace("\r", "")).strip()

    out = []
    for kind, chunk in tokenize(text):
        if kind == "math":
            # Peel leading/trailing whitespace, trailing sentence punctuation, and
            # dangling brackets (a prose "(" or ")") so they sit outside the $...$.
            lead = chunk[:len(chunk) - len(chunk.lstrip())]
            trail_ws = chunk[len(chunk.rstrip()):]
            core = chunk.strip()
            head = ""
            m = re.match(r"^([)\]]+)", core)  # closer that belongs to prose before
            if m:
                head = m.group(1)
                core = core[len(head):].lstrip()
            tail = ""
            m = re.search(r"([.,;:([{]+)$", core)  # punct or dangling opener after
            if m:
                tail = m.group(1)
                core = core[: -len(tail)].rstrip()
            if not core:
                out.append(chunk)
                continue
            if tail[:1] in "([{":
                tail = " " + tail  # restore the space before a prose opener
            out.append(f"{lead}{head}${convert_math_run(core)}${tail}{trail_ws}")
        else:
            out.append(chunk)
    result = "".join(out)
    # Cosmetic clean-up — keep prose/math boundary spacing intact.
    result = re.sub(r"\$\s*\$", "", result)         # drop empty math spans
    result = re.sub(r"\$([^$]*)\$", lambda m: "$" + m.group(1).strip() + "$", result)
    result = re.sub(r" {2,}", " ", result)
    result = re.sub(r"\s+([.,;:])", r"\1", result)   # no space before sentence punct
    return result.strip()


def main():
    write = "--write" in sys.argv
    data = json.loads(JSON_PATH.read_text())
    items = data["graph"]["items"]
    changed = 0
    for item in items:
        proof = item.get("proof")
        if not proof:
            continue
        new = latexify(proof)
        if not write:
            print("=" * 70)
            print(item["id"])
            print("-" * 70)
            print(new)
            print()
        if new != proof:
            item["proof"] = new
            changed += 1
    if write:
        JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        print(f"Wrote {changed} converted proofs to {JSON_PATH}")
    else:
        print(f"[preview] {changed} proofs would change. Re-run with --write to apply.")


if __name__ == "__main__":
    main()
