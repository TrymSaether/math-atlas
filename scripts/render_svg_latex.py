#!/usr/bin/env python3
"""Render selected static SVG labels from LaTeX into path-backed SVG groups.

The static atlas diagrams are raw SVG files fetched by `ThemedDiagram`, so KaTeX
does not run inside them. This script pre-renders math labels with the local TeX
toolchain and replaces the matching `<text>` elements with SVG glyph paths.
"""
from __future__ import annotations

import html
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIAGRAM_DIR = ROOT / "public" / "atlas-assets" / "fourier" / "diagrams"


@dataclass(frozen=True)
class Label:
    old: str
    tex: str
    x: float
    y: float
    anchor: str = "middle"
    scale: float = 1.0
    fill: str = "var(--dia-ink,#2a2520)"


LABELS: dict[str, list[Label]] = {
    "complex-exponential.svg": [
        Label("nx", r"nx", 101, 57, scale=0.82, fill="var(--dia-acc,#a8431d)"),
        Label("e^(i n x)", r"e^{inx}", 92, 152, scale=0.96),
    ],
    "dft-matrix.svg": [
        Label("a0", r"a_0", 68, 57, scale=0.86),
        Label("a1", r"a_1", 68, 85, scale=0.86),
        Label("a2", r"a_2", 68, 113, scale=0.86),
        Label("1", r"1", 240, 58, scale=0.86),
        Label("w", r"\omega", 240, 85, scale=0.86),
        Label("w^2", r"\omega^2", 240, 112, scale=0.86),
        Label("DFT", r"\mathcal F_N", 160, 66, scale=0.9, fill="var(--dia-acc,#a8431d)"),
    ],
    "dirac-delta.svg": [
        Label("delta", r"\delta", 85, 129, scale=0.98),
        Label("F delta = 1", r"\mathcal F\delta=1", 235, 128, scale=0.9),
        Label("F", r"\mathcal F", 160, 71, scale=0.86),
    ],
    "fourier-transform.svg": [
        Label("F", r"\mathcal F", 160, 53, scale=0.95),
        Label("f(x)", r"f(x)", 78, 133, scale=0.95),
        Label("fhat(xi)", r"\hat f(\xi)", 242, 133, scale=0.95),
    ],
    "heat-kernel-line.svg": [
        Label("small t", r"t\downarrow0", 111, 38, scale=0.78, fill="var(--dia-acc,#a8431d)"),
        Label("larger t", r"t>0", 222, 75, scale=0.78),
    ],
    "orthonormal-system.svg": [
        Label("e_1", r"e_1", 252, 47, scale=0.84),
        Label("e_2", r"e_2", 76, 46, scale=0.84),
        Label("e_3", r"e_3", 73, 127, scale=0.84),
    ],
    "poisson-summation.svg": [
        Label("sample f on Z", r"f|_{\mathbb Z}", 80, 132, scale=0.82),
        Label("sample fhat on dual Z", r"\hat f|_{\mathbb Z}", 248, 132, scale=0.82),
    ],
    "roots-of-unity.svg": [
        Label("1", r"1", 228, 75, anchor="start", scale=0.82),
        Label("omega", r"\omega", 205, 33, scale=0.82),
    ],
    "sinc-bandlimited.svg": [
        Label("sinc(t)", r"\operatorname{sinc}(t)", 84, 136, scale=0.86),
        Label("support in [-W,W]", r"\operatorname{supp}\hat f\subset[-W,W]", 226, 136, scale=0.78),
    ],
    "translation-modulation.svg": [
        Label("shift x", r"x\mapsto x-a", 160, 45, scale=0.75),
        Label("multiply by phase", r"e^{2\pi ibx}f(x)", 160, 101, scale=0.75),
    ],
    "wave-modes.svg": [
        Label("n=1", r"n=1", 24, 49, anchor="start", scale=0.8),
        Label("n=2", r"n=2", 24, 86, anchor="start", scale=0.8),
        Label("n=3", r"n=3", 24, 123, anchor="start", scale=0.8),
    ],
}


def run(cmd: list[str], cwd: Path) -> None:
    subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def render_formula(tex: str, prefix: str) -> tuple[float, str]:
    source = "\n".join(
        [
            r"\documentclass[12pt,border=0pt]{standalone}",
            r"\usepackage{amsmath,amssymb,mathrsfs}",
            r"\begin{document}",
            f"${tex}$",
            r"\end{document}",
            "",
        ]
    )
    with tempfile.TemporaryDirectory(prefix="math-atlas-latex-") as tmp_name:
        tmp = Path(tmp_name)
        (tmp / "formula.tex").write_text(source, encoding="utf-8")
        run(["latex", "-interaction=batchmode", "formula.tex"], tmp)
        run(["dvisvgm", "--no-fonts", "--exact", "--bbox=min", "-n", "formula.dvi"], tmp)
        svg = (tmp / "formula.svg").read_text(encoding="utf-8")

    match = re.search(r"<svg[^>]*viewBox='([^']+)'[^>]*>(.*)</svg>", svg, flags=re.S)
    if not match:
        raise RuntimeError(f"Could not parse rendered SVG for {tex!r}")
    min_x, min_y, width, _height = [float(value) for value in match.group(1).split()]
    body = match.group(2).strip()
    body = re.sub(r"\bid='([^']+)'", lambda m: f"id='{prefix}-{m.group(1)}'", body)
    body = re.sub(r"xlink:href='#([^']+)'", lambda m: f"xlink:href='#{prefix}-{m.group(1)}'", body)
    body = re.sub(r"(?<!xlink:)href='#([^']+)'", lambda m: f"href='#{prefix}-{m.group(1)}'", body)
    normalized = f"<g transform=\"translate({-min_x:.4f} {-min_y:.4f})\">\n{body}\n</g>"
    return width, normalized


def replacement(label: Label, prefix: str) -> str:
    width, body = render_formula(label.tex, prefix)
    if label.anchor == "middle":
        x = label.x - (width * label.scale) / 2
    elif label.anchor == "end":
        x = label.x - width * label.scale
    else:
        x = label.x
    tex_attr = html.escape(label.tex, quote=True)
    return (
        f'<g class="latex-svg" data-tex="{tex_attr}" fill="{label.fill}" '
        f'transform="translate({x:.2f} {label.y:.2f}) scale({label.scale:.4f})">\n'
        f"{body}\n"
        "</g>"
    )


def replace_one(svg: str, label: Label, prefix: str) -> str:
    new = replacement(label, prefix)
    old_pattern = re.compile(r"<text\b[^>]*>" + re.escape(label.old) + r"</text>")
    svg, count = old_pattern.subn(lambda _match: new, svg, count=1)
    if count == 1:
        return svg

    data_tex = f'data-tex="{html.escape(label.tex, quote=True)}"'
    start = svg.find('<g class="latex-svg"')
    while start >= 0:
        tag_end = svg.find(">", start)
        if tag_end < 0:
            break
        if data_tex in svg[start : tag_end + 1]:
            depth = 0
            for match in re.finditer(r"<g\b|</g>", svg[start:]):
                if match.group(0).startswith("<g"):
                    depth += 1
                else:
                    depth -= 1
                    if depth == 0:
                        end = start + match.end()
                        return svg[:start] + new + svg[end:]
            break
        start = svg.find('<g class="latex-svg"', tag_end)

    raise RuntimeError(f"Could not replace label {label.old!r} / {label.tex!r}")


def main() -> None:
    for file_name, labels in LABELS.items():
        path = DIAGRAM_DIR / file_name
        svg = path.read_text(encoding="utf-8")
        for index, label in enumerate(labels, start=1):
            prefix = f"ltx-{path.stem}-{index}".replace("_", "-")
            svg = replace_one(svg, label, prefix)
        path.write_text(svg, encoding="utf-8")
        print(f"updated {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
