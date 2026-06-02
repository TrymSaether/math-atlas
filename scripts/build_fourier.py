#!/usr/bin/env python3
"""Build a curated Fourier-analysis knowledge graph -> src/data/maps/fourier_analysis.json.

This is a *conceptual* graph authored from domain knowledge (not tied to any single
textbook's numbering). Nodes are named concepts/results with clean labels, LaTeX,
and intuition; edges form a real prerequisite DAG.

Edge relations are restricted to the two whose dependency semantics are
unambiguous (see normalizeFieldGraph.ts):
  * requires     -- source depends on target (the backbone)
  * instance_of  -- a special case / example depends on the general concept
Soft, non-prerequisite links use each node's `related[]` (panel-only, no DAG edge).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "maps" / "fourier_analysis.json"

# (id, label, order, color, description)
DOMAINS = [
    ("foundations", "Foundations & Function Spaces", 1, "#2563EB",
     "Periodic functions, inner-product geometry, and the function spaces (L^1, L^2, Schwartz) where Fourier analysis lives."),
    ("series", "Fourier Series", 2, "#0D9488",
     "Decomposing periodic functions into harmonics: coefficients, partial sums, and the basic identities."),
    ("convergence", "Convergence & Summability", 3, "#16A34A",
     "When and how Fourier series converge: kernels, summability methods, and the classical convergence theorems."),
    ("transform", "The Fourier Transform", 4, "#DC2626",
     "Fourier analysis on the line and R^d: inversion, convolution, Plancherel, and the uncertainty principle."),
    ("distributions", "Distributions", 5, "#9333EA",
     "Generalized functions: tempered distributions, the Dirac delta, and Fourier analysis beyond classical functions."),
    ("discrete", "Discrete & Computational", 6, "#0891B2",
     "Finite and sampled Fourier analysis: the DFT, the FFT, and the sampling theorem."),
    ("applications", "Applications", 7, "#CA8A04",
     "Where it all pays off: PDEs, signal processing, and probability."),
    ("dirichlet", "Dirichlet's Theorem & Number Theory", 8, "#BE123C",
     "Characters, L-functions, the Euler product, and primes in arithmetic progressions."),
]

DIAGRAM_PATHS = {
    "complex_exponential": "/atlas-assets/fourier/diagrams/complex-exponential.svg",
    "orthonormal_system": "/atlas-assets/fourier/diagrams/orthonormal-system.svg",
    "fourier_transform": "/atlas-assets/fourier/diagrams/fourier-transform.svg",
    "fourier_transform_convention": "/atlas-assets/fourier/diagrams/fourier-transform.svg",
    "translation_modulation": "/atlas-assets/fourier/diagrams/translation-modulation.svg",
    "sinc_function": "/atlas-assets/fourier/diagrams/sinc-bandlimited.svg",
    "band_limited": "/atlas-assets/fourier/diagrams/sinc-bandlimited.svg",
    "roots_of_unity": "/atlas-assets/fourier/diagrams/roots-of-unity.svg",
    "cyclic_group": "/atlas-assets/fourier/diagrams/roots-of-unity.svg",
    "finite_fourier": "/atlas-assets/fourier/diagrams/dft-matrix.svg",
    "dft": "/atlas-assets/fourier/diagrams/dft-matrix.svg",
    "fft": "/atlas-assets/fourier/diagrams/fft-butterfly.svg",
    "dirac_delta": "/atlas-assets/fourier/diagrams/dirac-delta.svg",
    "poisson_summation": "/atlas-assets/fourier/diagrams/poisson-summation.svg",
    "wave_equation": "/atlas-assets/fourier/diagrams/wave-modes.svg",
    "separation_of_variables": "/atlas-assets/fourier/diagrams/wave-modes.svg",
    "heat_kernel_line": "/atlas-assets/fourier/diagrams/heat-kernel-line.svg",
    "diffraction": "/atlas-assets/fourier/diagrams/diffraction.svg",
}

# Each node: id, label, kind, domain, statement, formal, intuition, notation, tags, priority, related
N = []
def node(id, label, kind, domain, statement, formal="", intuition="", notation="",
         tags=None, priority="medium", related=None, diagram_path=""):
    N.append({
        "id": id, "label": label, "kind": kind, "domain": domain,
        "statement": statement, "formal": formal, "intuition": intuition,
        "notation": notation, "tags": tags or [], "priority": priority,
        "related": related or [], "diagram_path": diagram_path or DIAGRAM_PATHS.get(id, ""),
    })

# ---------------------------------------------------------------- foundations
node("periodic_function", "Periodic Function", "definition", "foundations",
     "A function repeating after a fixed period; equivalently a function on the circle.",
     r"$f:\mathbb{R}\to\mathbb{C}$ is periodic of period $T$ if $f(x+T)=f(x)$ for all $x$. We work with $2\pi$-periodic functions, i.e. functions on the circle $\mathbb{T}=\mathbb{R}/2\pi\mathbb{Z}$.",
     "The natural domain of Fourier series: gluing the ends of an interval into a loop.",
     r"$f:\mathbb{T}\to\mathbb{C}$", ["foundation"], "core")
node("complex_exponential", "Complex Exponential", "object", "foundations",
     "The pure harmonics $e^{inx}$ that serve as the building blocks of Fourier analysis.",
     r"$e_n(x)=e^{inx}$, $n\in\mathbb{Z}$. By Euler's formula $e^{inx}=\cos nx+i\sin nx$.",
     "Each $e_n$ is a single frequency; Fourier analysis writes every function as a superposition of these.",
     r"$e_n(x)=e^{inx}$", ["foundation"], "core", related=["periodic_function"])
node("inner_product_space", "Inner Product Space", "structure", "foundations",
     "A vector space with an inner product, giving lengths and angles.",
     r"A complex vector space $V$ with $\langle\cdot,\cdot\rangle:V\times V\to\mathbb{C}$ that is linear, conjugate-symmetric, and positive-definite. For functions, $\langle f,g\rangle=\frac{1}{2\pi}\int_{-\pi}^{\pi} f\overline{g}\,dx$.",
     "Provides the geometry — orthogonality and projection — behind Fourier coefficients.",
     r"$\langle f,g\rangle$", ["foundation"], "core")
node("orthonormal_system", "Orthonormal System", "definition", "foundations",
     "A family of mutually orthogonal unit vectors; the exponentials $e^{inx}$ form one.",
     r"$\{\varphi_k\}$ with $\langle\varphi_j,\varphi_k\rangle=\delta_{jk}$. The system $\{e^{inx}\}_{n\in\mathbb{Z}}$ is orthonormal on $\mathbb{T}$.",
     "An orthonormal basis lets you read off coordinates by projection — exactly what a Fourier coefficient is.",
     r"$\langle\varphi_j,\varphi_k\rangle=\delta_{jk}$", ["foundation"], "core",
     related=["inner_product_space", "complex_exponential"])
node("lp_space", "L^p Space", "structure", "foundations",
     "Functions whose $p$-th power is integrable, normed by the $L^p$ norm.",
     r"$L^p(\mathbb{T})=\{f:\|f\|_p=(\frac{1}{2\pi}\int|f|^p)^{1/p}<\infty\}$, $1\le p\le\infty$.",
     "The scale of spaces in which different convergence results live; $L^1$ and $L^2$ are the key cases.",
     r"$\|f\|_p$", ["foundation"], "medium")
node("l1_space", "L^1 (Integrable Functions)", "structure", "foundations",
     "Absolutely integrable functions — the minimal home where Fourier coefficients exist.",
     r"$L^1(\mathbb{T})=\{f:\frac{1}{2\pi}\int_{-\pi}^{\pi}|f|\,dx<\infty\}$.",
     "Integrability is all you need to define $\\hat f(n)$; convergence questions need more.",
     r"$\|f\|_1<\infty$", ["foundation"], "core", related=["lp_space"])
node("l2_space", "L^2 (Square-Integrable)", "structure", "foundations",
     "The Hilbert space of finite-energy functions, where Fourier theory is cleanest.",
     r"$L^2(\mathbb{T})$ with $\langle f,g\rangle=\frac{1}{2\pi}\int f\overline g$ is a Hilbert space, and $\{e^{inx}\}$ is an orthonormal basis.",
     "Square-integrability turns Fourier analysis into orthogonal geometry: Parseval and mean-square convergence hold here.",
     r"$\|f\|_2^2=\langle f,f\rangle$", ["foundation"], "core",
     related=["lp_space", "inner_product_space"])
node("hilbert_space", "Hilbert Space", "structure", "foundations",
     "A complete inner-product space — the abstract setting that makes $L^2$ work.",
     r"An inner-product space that is complete in the induced norm. $L^2(\mathbb{T})$ and $\ell^2(\mathbb{Z})$ are the central examples.",
     "Completeness guarantees that orthogonal expansions actually converge to a limit in the space.",
     r"$H$", ["foundation"], "medium", related=["inner_product_space"])
node("schwartz_space", "Schwartz Space", "structure", "foundations",
     "Smooth functions that, with all derivatives, decay faster than any polynomial.",
     r"$\mathcal{S}(\mathbb{R})=\{f\in C^\infty:\sup_x|x^\alpha\partial^\beta f|<\infty\ \forall\alpha,\beta\}$.",
     "The ideal playground for the Fourier transform: it maps $\\mathcal S$ to itself bijectively.",
     r"$\mathcal{S}(\mathbb{R})$", ["foundation"], "core")
node("convolution", "Convolution", "construction", "foundations",
     "An averaging product of two functions that becomes multiplication after Fourier transform.",
     r"$(f*g)(x)=\frac{1}{2\pi}\int_{-\pi}^{\pi} f(y)g(x-y)\,dy$ (circle); on $\mathbb{R}$, $(f*g)(x)=\int f(y)g(x-y)\,dy$.",
     "Smoothing by a kernel; the operation Fourier analysis is built to diagonalize.",
     r"$f*g$", ["foundation"], "core")

# --------------------------------------------------------------------- series
node("fourier_coefficient", "Fourier Coefficient", "definition", "series",
     "The amount of frequency $n$ present in $f$, obtained by projecting onto $e^{inx}$.",
     r"$\hat f(n)=\frac{1}{2\pi}\int_{-\pi}^{\pi} f(x)e^{-inx}\,dx=\langle f,e_n\rangle$.",
     "The coordinate of $f$ along the $n$-th harmonic — a single complex number per frequency.",
     r"$\hat f(n)$", ["series"], "core",
     related=["complex_exponential", "inner_product_space"])
node("fourier_series", "Fourier Series", "object", "series",
     "The infinite sum of harmonics reconstructing a function from its coefficients.",
     r"$f(x)\sim\sum_{n=-\infty}^{\infty}\hat f(n)e^{inx}$.",
     "The candidate reconstruction of $f$; whether it equals $f$ is the convergence question.",
     r"$\sum_n \hat f(n)e^{inx}$", ["series"], "core", related=["fourier_coefficient"])
node("trigonometric_polynomial", "Trigonometric Polynomial", "object", "series",
     "A finite sum of harmonics; the dense, well-behaved functions used for approximation.",
     r"$p(x)=\sum_{|n|\le N} c_n e^{inx}$.",
     "Finite Fourier series — the simple objects everything is approximated by.",
     r"$\sum_{|n|\le N}c_n e^{inx}$", ["series"], "medium", related=["complex_exponential"])
node("partial_sum", "Partial Sum", "definition", "series",
     "The truncation of a Fourier series to frequencies $|n|\\le N$.",
     r"$S_N f(x)=\sum_{|n|\le N}\hat f(n)e^{inx}=(D_N*f)(x)$, where $D_N$ is the Dirichlet kernel.",
     "The finite approximation whose limit (if any) defines convergence of the series.",
     r"$S_N f$", ["series"], "core", related=["fourier_series"])
node("bessel_inequality", "Bessel's Inequality", "theorem", "series",
     "The energy of the Fourier coefficients never exceeds the energy of the function.",
     r"$\sum_{n}|\hat f(n)|^2\le\|f\|_2^2$ for $f\in L^2(\mathbb{T})$.",
     "Projections can only lose energy; equality (Parseval) signals a complete basis.",
     r"$\sum|\hat f(n)|^2\le\|f\|_2^2$", ["series"], "core")
node("parseval_identity", "Parseval's Identity", "theorem", "series",
     "Energy is exactly conserved between a function and its Fourier coefficients.",
     r"$\sum_{n}|\hat f(n)|^2=\|f\|_2^2$, and $\langle f,g\rangle=\sum_n\hat f(n)\overline{\hat g(n)}$, for $f,g\in L^2(\mathbb{T})$.",
     "Bessel becomes equality because $\\{e^{inx}\\}$ is a complete orthonormal basis — Fourier is an isometry.",
     r"$\sum|\hat f(n)|^2=\|f\|_2^2$", ["series"], "core",
     related=["bessel_inequality", "plancherel_theorem"])
node("riemann_lebesgue", "Riemann–Lebesgue Lemma", "theorem", "series",
     "Fourier coefficients of an integrable function vanish at high frequency.",
     r"If $f\in L^1(\mathbb{T})$ then $\hat f(n)\to 0$ as $|n|\to\infty$.",
     "Rapid oscillation averages out: no integrable signal has energy concentrated at infinitely high frequency.",
     r"$\hat f(n)\to 0$", ["series"], "core")
node("uniqueness_series", "Uniqueness Theorem", "theorem", "series",
     "A function is determined by its Fourier coefficients.",
     r"If $f$ is continuous on $\mathbb{T}$ and $\hat f(n)=0$ for all $n$, then $f\equiv 0$.",
     "The Fourier transform loses no information — distinct functions have distinct spectra.",
     r"$\hat f\equiv 0\Rightarrow f\equiv 0$", ["series"], "medium")
node("best_approximation", "Best Approximation Property", "theorem", "series",
     "Among all trig polynomials of degree $N$, the partial sum is the closest in $L^2$.",
     r"$\|f-S_N f\|_2=\min\{\|f-p\|_2:\deg p\le N\}$; the error is orthogonal to the span of $\{e^{inx}\}_{|n|\le N}$.",
     "Truncating the Fourier series is exactly orthogonal projection onto the low frequencies.",
     r"$\|f-S_Nf\|_2\le\|f-p\|_2$", ["series"], "medium",
     related=["partial_sum", "orthonormal_system"])
node("decay_smoothness", "Decay–Smoothness Duality", "property", "series",
     "The smoother a function, the faster its Fourier coefficients decay.",
     r"If $f\in C^k(\mathbb{T})$ then $\hat f(n)=O(|n|^{-k})$; conversely fast decay forces smoothness.",
     "Regularity in $x$ and decay in frequency are two sides of one coin — a recurring theme.",
     r"$\hat f(n)=O(|n|^{-k})$", ["series"], "medium")

# ---------------------------------------------------------------- convergence
node("good_kernel", "Good Kernel (Approximate Identity)", "definition", "convergence",
     "A family of kernels concentrating at the origin, so convolution recovers $f$.",
     r"$\{K_n\}$ with $\frac{1}{2\pi}\int K_n=1$, $\int|K_n|\le M$, and $\int_{|x|>\delta}|K_n|\to0$. Then $K_n*f\to f$.",
     "A sequence of smoothing bumps shrinking to a spike: convolving with them undoes the smoothing in the limit.",
     r"$K_n*f\to f$", ["convergence"], "core", related=["convolution"])
node("dirichlet_kernel", "Dirichlet Kernel", "object", "convergence",
     "The kernel of the partial-sum operator — and the source of convergence trouble.",
     r"$D_N(x)=\sum_{|n|\le N}e^{inx}=\dfrac{\sin((N+\tfrac12)x)}{\sin(x/2)}$, so $S_N f=D_N*f$.",
     "Not a good kernel: $\\|D_N\\|_1\\sim\\log N$ grows, which is why pointwise convergence can fail.",
     r"$D_N(x)$", ["convergence"], "core", related=["partial_sum"])
node("fejer_kernel", "Fejér Kernel", "object", "convergence",
     "The Cesàro average of Dirichlet kernels — a genuine good kernel.",
     r"$F_N(x)=\frac{1}{N+1}\sum_{n=0}^{N}D_n(x)=\frac{1}{N+1}\left(\frac{\sin(\frac{N+1}{2}x)}{\sin(x/2)}\right)^2\ge0$.",
     "Averaging tames the oscillation of $D_N$; non-negativity makes it an approximate identity.",
     r"$F_N(x)\ge 0$", ["convergence"], "core", related=["dirichlet_kernel", "good_kernel"])
node("poisson_kernel", "Poisson Kernel", "object", "convergence",
     "The good kernel behind Abel summation and harmonic extension to the disk.",
     r"$P_r(\theta)=\sum_{n}r^{|n|}e^{in\theta}=\dfrac{1-r^2}{1-2r\cos\theta+r^2}$, $0\le r<1$.",
     "Solves the Dirichlet problem on the disk; as $r\\to1$ it recovers boundary data.",
     r"$P_r(\theta)$", ["convergence"], "medium", related=["good_kernel"])
node("cesaro_summation", "Cesàro Summation", "method", "convergence",
     "Averaging partial sums to coax convergence out of a divergent series.",
     r"$\sigma_N f=\frac{1}{N+1}\sum_{n=0}^{N}S_n f=F_N*f$.",
     "A gentler limit: many series that diverge converge once you average their partial sums.",
     r"$\sigma_N f$", ["convergence"], "medium", related=["partial_sum"])
node("abel_summation", "Abel Summation", "method", "convergence",
     "Summation by radial limits $r\\to1$, smoother still than Cesàro.",
     r"$A_r f=\sum_n r^{|n|}\hat f(n)e^{inx}=P_r*f$.",
     "Weights high frequencies by $r^{|n|}<1$, then lets $r\\to1$ — connects series to the disk.",
     r"$A_r f$", ["convergence"], "medium", related=["partial_sum"])
node("fejer_theorem", "Fejér's Theorem", "theorem", "convergence",
     "Cesàro means of the Fourier series of a continuous function converge uniformly.",
     r"If $f$ is continuous on $\mathbb{T}$, then $\sigma_N f=F_N*f\to f$ uniformly.",
     "Even when the series itself misbehaves, its averages always reconstruct a continuous $f$ — and prove Weierstrass approximation.",
     r"$\sigma_N f\to f$", ["convergence"], "core",
     related=["fejer_kernel", "good_kernel"])
node("mean_square_convergence", "Mean-Square Convergence", "theorem", "convergence",
     "Fourier series converge in $L^2$ for every square-integrable function.",
     r"For $f\in L^2(\mathbb{T})$, $\|f-S_N f\|_2\to 0$.",
     "In the energy norm there is no subtlety: the series always converges — a direct consequence of completeness.",
     r"$\|f-S_N f\|_2\to0$", ["convergence"], "core",
     related=["l2_space", "parseval_identity"])
node("pointwise_convergence", "Pointwise Convergence Problem", "property", "convergence",
     "Whether $S_N f(x)\\to f(x)$ at a point — delicate and not automatic.",
     r"$S_N f(x_0)\to f(x_0)$? True under regularity hypotheses; can fail for merely continuous $f$.",
     "The hardest classical question: convergence at individual points needs local smoothness.",
     r"$S_N f(x_0)\to f(x_0)$", ["convergence"], "core", related=["dirichlet_kernel"])
node("dini_criterion", "Dini's Criterion", "theorem", "convergence",
     "A local integrability condition guaranteeing pointwise convergence.",
     r"If $\int_{-\pi}^{\pi}\left|\frac{f(x_0+t)-f(x_0)}{t}\right|dt<\infty$, then $S_N f(x_0)\to f(x_0)$.",
     "Mild Hölder-type regularity at a point is enough to force the series to converge there.",
     r"", ["convergence"], "medium", related=["pointwise_convergence"])
node("dirichlet_conditions", "Dirichlet's Convergence Theorem", "theorem", "convergence",
     "Piecewise-smooth functions converge to the midpoint of their jumps.",
     r"If $f$ is piecewise $C^1$, then $S_N f(x)\to\tfrac12\big(f(x^+)+f(x^-)\big)$.",
     "The classical sufficient condition: nice enough functions always converge, jumps splitting the difference.",
     r"$S_N f\to\tfrac12(f(x^+)+f(x^-))$", ["convergence"], "medium",
     related=["pointwise_convergence"])
node("gibbs_phenomenon", "Gibbs Phenomenon", "property", "convergence",
     "Persistent ~9% overshoot of partial sums near a jump discontinuity.",
     r"Near a jump, $S_N f$ overshoots by a fixed fraction ($\approx 0.0895$ of the jump) that does not vanish as $N\to\infty$.",
     "The ringing you see truncating a square wave: the overshoot narrows but never shrinks.",
     r"", ["convergence"], "medium", related=["partial_sum", "dirichlet_conditions"])
node("carleson_theorem", "Carleson's Theorem", "theorem", "convergence",
     "Fourier series of $L^2$ functions converge almost everywhere.",
     r"For $f\in L^2(\mathbb{T})$, $S_N f(x)\to f(x)$ for almost every $x$.",
     "The deep resolution of a 150-year-old question: a.e. pointwise convergence holds in $L^2$.",
     r"$S_N f\to f$ a.e.", ["convergence"], "medium",
     related=["pointwise_convergence", "l2_space"])
node("dubois_reymond", "Du Bois-Reymond Counterexample", "counterexample", "convergence",
     "A continuous function whose Fourier series diverges at a point.",
     r"There exists $f\in C(\mathbb{T})$ with $\limsup_N|S_N f(0)|=\infty$.",
     "Continuity alone does not guarantee pointwise convergence — the reason Fejér/Cesàro averaging matters.",
     r"", ["convergence"], "medium", related=["pointwise_convergence", "dirichlet_kernel"])

# ----------------------------------------------------------------- transform
node("fourier_transform", "Fourier Transform", "definition", "transform",
     "The continuous-frequency analogue of Fourier coefficients, for functions on $\\mathbb{R}$.",
     r"$\hat f(\xi)=\int_{-\infty}^{\infty} f(x)e^{-2\pi i x\xi}\,dx$.",
     "Replaces the discrete spectrum of a periodic function with a continuous one on the whole line.",
     r"$\hat f(\xi)$", ["transform"], "core",
     related=["fourier_coefficient", "fourier_series"])
node("fourier_inversion", "Fourier Inversion Theorem", "theorem", "transform",
     "The transform is invertible: $f$ is rebuilt from $\\hat f$ by the dual integral.",
     r"For $f\in\mathcal{S}(\mathbb{R})$, $f(x)=\int_{-\infty}^{\infty}\hat f(\xi)e^{2\pi i x\xi}\,d\xi$.",
     "Analysis and synthesis are symmetric — the inverse transform is the transform with a sign flip.",
     r"$f=(\hat f)^{\vee}$", ["transform"], "core",
     related=["fourier_transform", "schwartz_space"])
node("convolution_theorem", "Convolution Theorem", "theorem", "transform",
     "The Fourier transform turns convolution into pointwise multiplication.",
     r"$\widehat{f*g}=\hat f\cdot\hat g$, and dually $\widehat{fg}=\hat f*\hat g$.",
     "Why Fourier methods work: hard convolution integrals become easy products in frequency.",
     r"$\widehat{f*g}=\hat f\,\hat g$", ["transform"], "core",
     related=["convolution", "fourier_transform"])
node("plancherel_theorem", "Plancherel's Theorem", "theorem", "transform",
     "The Fourier transform is a unitary map on $L^2(\\mathbb{R})$ — energy is preserved.",
     r"$\|\hat f\|_{L^2}=\|f\|_{L^2}$, and the transform extends to a unitary operator on $L^2(\mathbb{R})$.",
     "The continuous counterpart of Parseval: Fourier is a rotation of the infinite-dimensional space $L^2$.",
     r"$\|\hat f\|_2=\|f\|_2$", ["transform"], "core",
     related=["l2_space", "parseval_identity"])
node("gaussian_transform", "Gaussian (Self-Dual)", "example", "transform",
     "The Gaussian is its own Fourier transform — the fixed point of the transform.",
     r"If $f(x)=e^{-\pi x^2}$ then $\hat f(\xi)=e^{-\pi\xi^2}$.",
     "The extremal, perfectly balanced function: minimal uncertainty, invariant under Fourier.",
     r"$\widehat{e^{-\pi x^2}}=e^{-\pi\xi^2}$", ["transform"], "core",
     related=["schwartz_space", "uncertainty_principle"])
node("uncertainty_principle", "Uncertainty Principle", "theorem", "transform",
     "A function and its transform cannot both be sharply localized.",
     r"$\left(\int x^2|f|^2\right)\left(\int \xi^2|\hat f|^2\right)\ge\frac{\|f\|_2^4}{16\pi^2}$, with equality for Gaussians.",
     "Concentration in time forces spread in frequency — the mathematics behind Heisenberg's principle.",
     r"$\Delta x\,\Delta\xi\ge\frac{1}{4\pi}$", ["transform"], "core",
     related=["gaussian_transform"])
node("poisson_summation", "Poisson Summation Formula", "theorem", "transform",
     "Summing a function over a lattice equals summing its transform over the dual lattice.",
     r"$\sum_{n\in\mathbb{Z}}f(n)=\sum_{n\in\mathbb{Z}}\hat f(n)$ (for nice $f$).",
     "The bridge between the Fourier transform and Fourier series — periodization in $x$ is sampling in $\\xi$.",
     r"$\sum f(n)=\sum\hat f(n)$", ["transform"], "core",
     related=["fourier_series", "fourier_transform"])
node("fourier_transform_rd", "Fourier Transform on R^d", "definition", "transform",
     "The multivariable transform, built from the one-dimensional one coordinatewise.",
     r"$\hat f(\xi)=\int_{\mathbb{R}^d} f(x)e^{-2\pi i x\cdot\xi}\,dx$, $x,\xi\in\mathbb{R}^d$.",
     "Same theory in higher dimensions; rotation-invariance makes radial functions especially clean.",
     r"$\hat f(\xi),\ \xi\in\mathbb{R}^d$", ["transform"], "medium",
     related=["fourier_transform"])
node("differentiation_rule", "Differentiation Rule", "property", "transform",
     "Differentiation becomes multiplication by frequency under the transform.",
     r"$\widehat{f'}(\xi)=2\pi i\xi\,\hat f(\xi)$ and $\widehat{xf}(\xi)=\frac{-1}{2\pi i}\frac{d}{d\xi}\hat f(\xi)$.",
     "Turns differential operators into algebra — the key to solving PDEs by Fourier methods.",
     r"$\widehat{f'}=2\pi i\xi\,\hat f$", ["transform"], "medium",
     related=["fourier_transform", "schwartz_space"])

# ------------------------------------------------------------- distributions
node("tempered_distribution", "Tempered Distribution", "structure", "distributions",
     "A continuous linear functional on Schwartz space — a generalized function.",
     r"$T\in\mathcal{S}'(\mathbb{R})$, the continuous dual of $\mathcal{S}(\mathbb{R})$; functions of moderate growth embed via $T_f(\varphi)=\int f\varphi$.",
     "Lets you Fourier-transform objects (like $1$, $\\delta$, polynomials) that aren't integrable.",
     r"$\mathcal{S}'(\mathbb{R})$", ["distributions"], "core",
     related=["schwartz_space"])
node("dirac_delta", "Dirac Delta", "object", "distributions",
     "The idealized unit spike: evaluation at a point, the identity for convolution.",
     r"$\delta(\varphi)=\varphi(0)$; $f*\delta=f$ and $\hat\delta\equiv 1$.",
     "Not a function but a distribution — the limit of any approximate identity.",
     r"$\delta$", ["distributions"], "core",
     related=["tempered_distribution", "good_kernel"])
node("weak_derivative", "Weak Derivative", "definition", "distributions",
     "Differentiation defined by moving the derivative onto the test function.",
     r"$T'(\varphi)=-T(\varphi')$, extending classical differentiation to all distributions.",
     "Every distribution is infinitely differentiable — discontinuities and spikes included.",
     r"$T'(\varphi)=-T(\varphi')$", ["distributions"], "medium",
     related=["tempered_distribution"])
node("distributional_ft", "Fourier Transform of Distributions", "theorem", "distributions",
     "The transform extends to all tempered distributions by duality.",
     r"$\hat T(\varphi)=T(\hat\varphi)$ for $\varphi\in\mathcal{S}$; consistent with the classical transform.",
     "Gives meaning to $\\hat 1=\\delta$ and the transform of every polynomially-bounded object.",
     r"$\hat T(\varphi)=T(\hat\varphi)$", ["distributions"], "core",
     related=["tempered_distribution", "fourier_transform"])

# ------------------------------------------------------------------- discrete
node("roots_of_unity", "Roots of Unity", "object", "discrete",
     "The $N$ equally-spaced points on the unit circle — discrete harmonics.",
     r"$\omega_N=e^{2\pi i/N}$; the characters of $\mathbb{Z}/N\mathbb{Z}$ are $k\mapsto\omega_N^{jk}$.",
     "The finite analogue of $e^{inx}$: the building blocks of the discrete transform.",
     r"$\omega_N=e^{2\pi i/N}$", ["discrete"], "medium",
     related=["complex_exponential"])
node("finite_fourier", "Fourier Analysis on Z(N)", "structure", "discrete",
     "Fourier theory on the cyclic group, where everything is a finite sum.",
     r"Functions on $\mathbb{Z}/N\mathbb{Z}$ expand in the orthogonal characters $\{\omega_N^{jk}\}$; the cleanest, fully finite Fourier theory.",
     "A finite-dimensional model where convergence is trivial and structure is transparent.",
     r"$L^2(\mathbb{Z}/N\mathbb{Z})$", ["discrete"], "medium",
     related=["roots_of_unity", "orthonormal_system"])
node("dft", "Discrete Fourier Transform", "definition", "discrete",
     "The Fourier transform of a length-$N$ sample vector.",
     r"$\hat a(k)=\sum_{j=0}^{N-1} a_j\,\omega_N^{-jk}$, $\omega_N=e^{2\pi i/N}$.",
     "What a computer actually evaluates: the finite, exact Fourier transform of sampled data.",
     r"$\hat a(k)$", ["discrete"], "core", related=["finite_fourier", "roots_of_unity"])
node("dtft", "Discrete-Time Fourier Transform", "definition", "discrete",
     "The transform of an infinite sequence — a periodic function of frequency.",
     r"$\hat a(\xi)=\sum_{n\in\mathbb{Z}} a_n e^{-2\pi i n\xi}$, periodic in $\xi$.",
     "The dual of Fourier series: discrete in time, continuous and periodic in frequency.",
     r"$\hat a(\xi)$", ["discrete"], "medium", related=["fourier_series"])
node("fft", "Fast Fourier Transform", "method", "discrete",
     "An $O(N\\log N)$ algorithm computing the DFT by recursive splitting.",
     r"Cooley–Tukey factorizes the DFT of size $N$ into two of size $N/2$, giving $O(N\log N)$ vs.\ $O(N^2)$.",
     "The algorithm that made Fourier methods computationally ubiquitous.",
     r"$O(N\log N)$", ["discrete"], "core", related=["dft"])
node("circular_convolution", "Circular Convolution", "construction", "discrete",
     "Convolution on $\\mathbb{Z}/N\\mathbb{Z}$, diagonalized by the DFT.",
     r"$(a\circledast b)_k=\sum_j a_j b_{k-j\bmod N}$, and $\widehat{a\circledast b}=\hat a\cdot\hat b$.",
     "The discrete convolution theorem — why fast filtering goes through the FFT.",
     r"$a\circledast b$", ["discrete"], "medium",
     related=["dft", "convolution"])
node("sampling_theorem", "Nyquist–Shannon Sampling", "theorem", "discrete",
     "A band-limited signal is perfectly reconstructed from samples at twice its bandwidth.",
     r"If $\hat f$ is supported in $[-W,W]$, then $f(x)=\sum_n f\!\left(\tfrac{n}{2W}\right)\mathrm{sinc}(2Wx-n)$.",
     "Bridges continuous and discrete: sampling fast enough loses nothing.",
     r"$f_s\ge 2W$", ["discrete"], "core",
     related=["fourier_transform", "fourier_inversion"])
node("aliasing", "Aliasing", "property", "discrete",
     "Undersampling makes high frequencies masquerade as low ones.",
     r"Sampling below the Nyquist rate folds frequencies outside $[-f_s/2,f_s/2]$ back into that band.",
     "The failure mode of sampling — why anti-alias filtering precedes digitization.",
     r"", ["discrete"], "medium", related=["sampling_theorem"])

# --------------------------------------------------------------- applications
node("heat_equation", "Heat Equation", "application", "applications",
     "Fourier's original problem: diffusion solved by decaying harmonics.",
     r"$u_t=u_{xx}$ with $u(x,0)=f(x)$ is solved by $u(x,t)=\sum_n\hat f(n)e^{-n^2 t}e^{inx}$.",
     "Each harmonic decays at its own rate $e^{-n^2 t}$ — the problem that launched Fourier analysis.",
     r"$u_t=u_{xx}$", ["applications", "pde"], "core",
     related=["fourier_series", "good_kernel"])
node("wave_equation", "Wave Equation", "application", "applications",
     "Vibrating strings as superpositions of standing harmonic waves.",
     r"$u_{tt}=u_{xx}$ solved by $u(x,t)=\sum_n\big(a_n\cos nt+b_n\sin nt\big)e^{inx}$.",
     "The physical origin of harmonics — d'Alembert and Bernoulli's standing waves.",
     r"$u_{tt}=u_{xx}$", ["applications", "pde"], "medium",
     related=["fourier_series"])
node("isoperimetric", "Isoperimetric Inequality", "application", "applications",
     "Among curves of fixed length, the circle encloses the most area — via Parseval.",
     r"For a simple closed curve of length $L$ enclosing area $A$: $A\le\frac{L^2}{4\pi}$, equality iff a circle.",
     "A geometry theorem proved by expanding the boundary curve in a Fourier series.",
     r"$A\le L^2/4\pi$", ["applications"], "medium",
     related=["parseval_identity", "fourier_series"])
node("weyl_equidistribution", "Weyl Equidistribution", "application", "applications",
     "Irrational rotations fill the circle uniformly — detected by Fourier coefficients.",
     r"$\{n\gamma\bmod 1\}$ is equidistributed iff $\frac1N\sum_{n\le N}e^{2\pi i k n\gamma}\to0$ for all $k\ne0$ (Weyl's criterion).",
     "A number-theory equidistribution test reduced to the decay of exponential sums.",
     r"$\frac1N\sum e^{2\pi i kn\gamma}\to0$", ["applications", "number-theory"], "medium",
     related=["fejer_theorem", "fourier_coefficient"])
node("central_limit", "Central Limit Theorem (Fourier proof)", "application", "applications",
     "Sums of independent variables become Gaussian — convolution of densities seen in frequency.",
     r"Characteristic functions $\varphi(\xi)=\hat\mu(\xi)$ multiply under convolution; $\varphi^n$ converges to the Gaussian transform $e^{-\xi^2/2}$.",
     "The Fourier transform diagonalizes convolution, turning the CLT into a limit of products.",
     r"$\hat\mu^{\,n}\to e^{-\xi^2/2}$", ["applications", "probability"], "medium",
     related=["convolution_theorem", "gaussian_transform"])
node("signal_filtering", "Filtering & Signal Processing", "application", "applications",
     "Designing systems that pass or reject frequency bands via multiplication of spectra.",
     r"A linear time-invariant filter acts by $\widehat{(h*x)}=\hat h\cdot\hat x$; the transfer function $\hat h$ shapes the spectrum.",
     "All of audio/image processing: convolve in time = multiply in frequency, computed by the FFT.",
     r"$\hat y=\hat h\,\hat x$", ["applications", "signal"], "core",
     related=["convolution_theorem", "fft", "dft"])
node("dirichlet_primes", "Primes in Arithmetic Progressions", "theorem", "dirichlet",
     "Infinitely many primes in each valid progression — proved with Fourier analysis on $(\\mathbb{Z}/q)^\\times$.",
     r"If $\gcd(a,q)=1$ there are infinitely many primes $\equiv a\pmod q$; the proof expands an indicator in Dirichlet characters and uses $L(1,\chi)\ne0$.",
     "Finite Fourier analysis on a group of units, combined with $L$-functions, cracks a number-theory landmark.",
     r"$p\equiv a\ (q)$", ["dirichlet", "number-theory"], "core",
     related=["dirichlet_l_function", "characters_finite_abelian"])

# =========================================================== deepening (v2.1)
# Fills the hidden measure-theory roots, adds the real-form/half-range series
# branch, connects terminal leaves onward (Poisson kernel -> disk problem,
# Poisson summation -> sampling/theta, R^d transform -> diffraction), and grows
# the distribution/discrete/application frontiers.

# -- foundations: the measure-theoretic floor everything silently assumed
node("lebesgue_integral", "Lebesgue Integral", "structure", "foundations",
     "The integral that makes the Fourier function spaces complete.",
     r"$\int f\,d\mu$ defined for measurable $f$; limits behave well (unlike the Riemann integral), making $L^p$ complete.",
     "The right notion of integration — without it $L^1$ and $L^2$ would have holes.",
     r"$\int f\,d\mu$", ["foundation"], "core")
node("almost_everywhere", "Almost Everywhere", "definition", "foundations",
     "A property holding except on a set of measure zero.",
     r"$P$ holds a.e. if $\mu(\{x:\neg P(x)\})=0$. Functions equal a.e. are identified in $L^p$.",
     "The equivalence that lets us treat $L^p$ elements as functions; the natural mode of Fourier convergence (cf. Carleson).",
     r"\text{a.e.}", ["foundation"], "medium", related=["lebesgue_integral"])
node("dominated_convergence", "Dominated Convergence", "theorem", "foundations",
     "Interchange of limit and integral under a dominating function.",
     r"If $f_n\to f$ a.e. and $|f_n|\le g\in L^1$, then $\int f_n\to\int f$.",
     "The workhorse that justifies swapping limits, sums, and integrals throughout Fourier analysis.",
     r"$\int f_n\to\int f$", ["foundation"], "medium", related=["lebesgue_integral"])
node("fubini_tonelli", "Fubini–Tonelli Theorem", "theorem", "foundations",
     "Iterated integrals may be swapped for (absolutely) integrable functions.",
     r"$\iint f(x,y)\,dx\,dy=\iint f(x,y)\,dy\,dx$ when $f\in L^1$ (Fubini) or $f\ge0$ (Tonelli).",
     "What makes convolution and the inversion formula well-defined — you reorder double integrals.",
     r"$\iint=\iint$", ["foundation"], "medium", related=["lebesgue_integral"])

# -- series: the classical real form and its convergence machinery
node("real_fourier_series", "Real (Sine–Cosine) Series", "object", "series",
     "The classical $a_n\\cos+b_n\\sin$ form, equivalent to the complex series.",
     r"$f(x)\sim\frac{a_0}{2}+\sum_{n\ge1}(a_n\cos nx+b_n\sin nx)$, with $a_n=\frac1\pi\int f\cos nx$, $b_n=\frac1\pi\int f\sin nx$.",
     "The original 19th-century form; real and imaginary parts of the complex coefficients.",
     r"$a_n\cos nx+b_n\sin nx$", ["series"], "medium", related=["fourier_series"])
node("half_range_expansion", "Half-Range Expansions", "construction", "series",
     "Expanding a function on $[0,L]$ in pure sines or pure cosines via even/odd extension.",
     r"Extend $f$ on $[0,\pi]$ evenly (cosine series) or oddly (sine series) to $[-\pi,\pi]$.",
     "How boundary conditions pick sine vs. cosine series when solving PDEs on an interval.",
     r"", ["series"], "medium", related=["real_fourier_series"])
node("localization_principle", "Riemann Localization Principle", "theorem", "series",
     "Convergence of a Fourier series at a point depends only on $f$ near that point.",
     r"If $f=g$ on a neighborhood of $x_0$, then $S_N f(x_0)$ and $S_N g(x_0)$ converge or diverge together.",
     "A striking fact: even though coefficients are global integrals, pointwise convergence is purely local.",
     r"", ["series"], "medium", related=["dirichlet_kernel"])
node("term_differentiation", "Term-by-Term Differentiation", "property", "series",
     "When the differentiated series still converges to the derivative.",
     r"If $\sum |n\,\hat f(n)|<\infty$, then $f'(x)=\sum_n in\,\hat f(n)e^{inx}$.",
     "Smoothness (fast coefficient decay) is exactly what licenses differentiating a series term by term.",
     r"$f'=\sum in\,\hat f(n)e^{inx}$", ["series"], "medium", related=["decay_smoothness"])

# -- convergence: where Fejér actually leads
node("weierstrass_approximation", "Weierstrass Approximation", "theorem", "convergence",
     "Every continuous periodic function is a uniform limit of trigonometric polynomials.",
     r"Trigonometric polynomials are dense in $C(\mathbb{T})$ — an immediate corollary of Fejér's theorem.",
     "The density result underpinning completeness of the exponential basis; Fejér's payoff.",
     r"\overline{\{\text{trig polys}\}}=C(\mathbb{T})", ["convergence"], "medium",
     related=["fejer_theorem", "trigonometric_polynomial"])
node("abel_theorem", "Abel's Theorem", "theorem", "convergence",
     "A convergent series is Abel summable to the same value — summability is consistent.",
     r"If $\sum a_n=s$ converges, then $\lim_{r\to1^-}\sum a_n r^n=s$.",
     "Guarantees the gentler summation methods don't change answers where ordinary convergence already holds.",
     r"$\lim_{r\to1}\sum a_n r^n=s$", ["convergence"], "medium", related=["abel_summation"])

# -- transform: localization, band-limiting, the heat semigroup
node("translation_modulation", "Translation & Modulation", "property", "transform",
     "Shifting in time is modulation in frequency, and vice versa.",
     r"$\widehat{f(\cdot-a)}(\xi)=e^{-2\pi ia\xi}\hat f(\xi)$ and $\widehat{e^{2\pi ibx}f}(\xi)=\hat f(\xi-b)$.",
     "The symmetry making the transform translation-covariant — the basis of time-frequency analysis.",
     r"$\widehat{f(\cdot-a)}=e^{-2\pi ia\xi}\hat f$", ["transform"], "medium",
     related=["fourier_transform"])
node("ft_continuity", "Transform of L^1 is Continuous & Decays", "property", "transform",
     "The Fourier transform of an integrable function is continuous and vanishes at infinity.",
     r"If $f\in L^1(\mathbb{R})$ then $\hat f\in C_0(\mathbb{R})$: continuous with $\hat f(\xi)\to0$ as $|\xi|\to\infty$.",
     "The Riemann–Lebesgue lemma on the line — integrability buys smoothness and decay of the spectrum.",
     r"$\hat f\in C_0(\mathbb{R})$", ["transform"], "medium",
     related=["fourier_transform", "riemann_lebesgue"])
node("band_limited", "Band-Limited Function", "definition", "transform",
     "A function whose Fourier transform vanishes outside a bounded frequency band.",
     r"$\hat f$ supported in $[-W,W]$; equivalently $f$ contains no frequencies above $W$.",
     "The signals that sampling reconstructs exactly — finite bandwidth, infinite smoothness.",
     r"\operatorname{supp}\hat f\subset[-W,W]", ["transform", "signal"], "medium",
     related=["fourier_transform"])
node("paley_wiener", "Paley–Wiener Theorem", "theorem", "transform",
     "Band-limited functions are exactly restrictions of entire functions of exponential type.",
     r"$f$ is band-limited to $[-W,W]$ iff $f$ extends to an entire function with $|f(z)|\le Ce^{2\pi W|z|}$.",
     "Trades a support condition in frequency for a growth condition in the complex plane.",
     r"", ["transform"], "medium", related=["band_limited"])
node("heat_kernel_line", "Heat Kernel on R", "object", "transform",
     "The Gaussian semigroup solving the heat equation on the whole line.",
     r"$H_t(x)=\frac{1}{\sqrt{4\pi t}}e^{-x^2/4t}$, with $\hat H_t(\xi)=e^{-4\pi^2 t\xi^2}$; $u=H_t*f$ solves $u_t=u_{xx}$.",
     "A good kernel that is also a Gaussian — convolving with it smooths data and solves diffusion.",
     r"$H_t(x)$", ["transform", "pde"], "medium",
     related=["gaussian_transform", "convolution_theorem"])

# -- distributions: test functions, convolution, fundamental solutions
node("test_function", "Test Function", "definition", "distributions",
     "A smooth, compactly supported function used to probe distributions.",
     r"$\varphi\in C_c^\infty(\mathbb{R})$; the space $\mathcal{D}$ of test functions sits inside $\mathcal{S}$.",
     "The 'measuring instruments' of distribution theory — you know a distribution by how it pairs with these.",
     r"\varphi\in C_c^\infty", ["distributions"], "medium", related=["schwartz_space"])
node("convolution_distributions", "Convolution of Distributions", "construction", "distributions",
     "Extending convolution to distributions, with the delta as identity.",
     r"$(T*\varphi)(x)=T(\tau_x\tilde\varphi)$; $\delta*T=T$ and $\widehat{T*S}=\hat T\hat S$ under support conditions.",
     "Lets you convolve spikes and generalized functions — essential for solving PDEs.",
     r"$\delta*T=T$", ["distributions"], "medium",
     related=["dirac_delta", "convolution"])
node("fundamental_solution", "Fundamental Solution", "construction", "distributions",
     "A distribution $E$ with $LE=\\delta$, giving solutions by convolution.",
     r"For a constant-coefficient operator $L$, if $LE=\delta$ then $u=E*f$ solves $Lu=f$.",
     "The Fourier transform finds $E$ by dividing by the symbol — the master template for linear PDEs.",
     r"$LE=\delta$", ["distributions", "pde"], "medium",
     related=["distributional_ft", "convolution_distributions"])

# -- discrete: energy identity and the cosine transform
node("parseval_dft", "Parseval for the DFT", "property", "discrete",
     "Energy is conserved by the discrete transform, up to a factor of $N$.",
     r"$\sum_{j=0}^{N-1}|a_j|^2=\frac1N\sum_{k=0}^{N-1}|\hat a(k)|^2$.",
     "The DFT is (a scaling of) a unitary matrix — the finite Plancherel identity.",
     r"$\sum|a_j|^2=\tfrac1N\sum|\hat a(k)|^2$", ["discrete"], "medium",
     related=["dft", "parseval_identity"])
node("dct", "Discrete Cosine Transform", "definition", "discrete",
     "A real, cosine-only transform of sampled data — the engine of JPEG/MP3.",
     r"$C_k=\sum_{j=0}^{N-1} a_j\cos\!\big[\tfrac{\pi}{N}(j+\tfrac12)k\big]$; a DFT of an even extension.",
     "Concentrates energy in few coefficients, which is why it dominates lossy compression.",
     r"$C_k$", ["discrete", "signal"], "medium",
     related=["dft", "half_range_expansion"])

# -- applications: the method, the disk, theta functions, optics, quantum
node("separation_of_variables", "Separation of Variables", "method", "applications",
     "Solving linear PDEs by expanding in eigenfunctions of the spatial operator.",
     r"Seek $u(x,t)=\sum_n c_n(t)e_n(x)$ where $e_n$ are eigenfunctions; the PDE decouples into ODEs for $c_n(t)$.",
     "The technique that turns Fourier series into PDE solutions — Fourier's original method.",
     r"u=\sum_n c_n(t)e_n(x)", ["applications", "pde"], "core",
     related=["fourier_series"])
node("dirichlet_problem_disk", "Dirichlet Problem on the Disk", "application", "applications",
     "Harmonic extension of boundary data, solved by the Poisson kernel.",
     r"$\Delta u=0$ in the disk with $u=f$ on the boundary is solved by $u(r,\theta)=(P_r*f)(\theta)$.",
     "Where the Poisson kernel earns its name — Abel summation is harmonic extension.",
     r"u=P_r*f", ["applications", "pde"], "medium",
     related=["poisson_kernel", "abel_summation"])
node("theta_function", "Theta Function & Functional Equation", "application", "applications",
     "The identity $\\theta(1/t)=\\sqrt{t}\\,\\theta(t)$, straight from Poisson summation.",
     r"$\theta(t)=\sum_{n}e^{-\pi n^2 t}$ satisfies $\theta(1/t)=\sqrt{t}\,\theta(t)$, via Poisson summation on the Gaussian.",
     "A bridge to number theory (the Riemann zeta functional equation) built on Poisson summation.",
     r"\theta(1/t)=\sqrt{t}\,\theta(t)", ["applications", "number-theory"], "medium",
     related=["poisson_summation", "gaussian_transform"])
node("schrodinger_equation", "Free Schrödinger Equation", "application", "applications",
     "Quantum free evolution diagonalized by the Fourier transform.",
     r"$i u_t=-u_{xx}$ solves via $\hat u(\xi,t)=e^{-4\pi^2 i\xi^2 t}\hat u_0(\xi)$ — multiplication in frequency.",
     "Like the heat equation but with imaginary time: dispersion instead of diffusion.",
     r"iu_t=-u_{xx}", ["applications", "pde"], "medium",
     related=["fourier_transform", "differentiation_rule"])
node("diffraction", "Fraunhofer Diffraction", "application", "applications",
     "The far-field light pattern of an aperture is the Fourier transform of its shape.",
     r"Far-field amplitude $\propto\hat{\mathbb{1}_A}(\xi)$, the Fourier transform of the aperture indicator.",
     "Optics computes Fourier transforms physically — a slit's pattern is a sinc, a circle's an Airy disk.",
     r"\propto\widehat{\mathbb{1}_A}", ["applications", "optics"], "medium",
     related=["fourier_transform_rd", "fourier_transform"])

# ================================================= full book coverage (v3)
# New nodes so every numbered Stein-Shakarchi result is represented (see
# BOOK_REFS + the coverage check in build()).

# -- series: the famous lacunary counterexample (SS Ch.4 §3)
node("weierstrass_function", "Weierstrass Function (Nowhere Differentiable)", "example", "series",
     "A continuous function with no derivative anywhere, built from a lacunary Fourier series.",
     r"$f_\alpha(x)=\sum_{n\ge0}2^{-n\alpha}e^{i2^n x}$ is continuous but nowhere differentiable for $0<\alpha<1$.",
     "Continuity does not imply differentiability — the gaps (lacunae) in the frequencies wreck smoothness everywhere.",
     r"$f_\alpha(x)=\sum 2^{-n\alpha}e^{i2^n x}$", ["series"], "medium",
     related=["fourier_series", "cesaro_summation"])

# -- transform: the half-plane Poisson kernel / steady-state heat (SS Ch.5 §2)
node("half_plane_poisson", "Poisson Kernel on the Half-Plane", "object", "transform",
     "The kernel solving the steady-state heat (Dirichlet) problem on the upper half-plane.",
     r"$P_y(x)=\frac{1}{\pi}\frac{y}{x^2+y^2}$, with $\hat P_y(\xi)=e^{-2\pi y|\xi|}$; $u=f*P_y$ is harmonic in $\mathbb{R}^2_+$ with boundary value $f$.",
     "The continuous analogue of Abel summation: harmonic extension off the boundary line.",
     r"$P_y(x)=\tfrac{1}{\pi}\tfrac{y}{x^2+y^2}$", ["transform", "pde"], "medium",
     related=["fourier_transform", "good_kernel", "dirichlet_problem_disk"])

# -- applications: R^d wave equation and the Radon transform (SS Ch.6)
node("wave_equation_rd", "Wave Equation in R^d (Huygens, Kirchhoff)", "application", "applications",
     "The d-dimensional wave equation solved by the Fourier transform, with energy conservation and Huygens' principle.",
     r"$\partial_t^2 u=\Delta u$ is solved via $\hat u(\xi,t)=\cos(2\pi|\xi|t)\hat f(\xi)+\frac{\sin(2\pi|\xi|t)}{2\pi|\xi|}\hat g(\xi)$; in $\mathbb{R}^3$ this gives Kirchhoff's formula and the sharp Huygens principle.",
     "Sound and light in space: in odd dimensions $\\ge3$ waves leave no wake — Huygens' principle.",
     r"$\partial_t^2 u=\Delta u$", ["applications", "pde"], "medium",
     related=["fourier_transform_rd", "wave_equation"])
node("radon_transform", "Radon Transform & Tomography", "application", "applications",
     "Reconstructing a function from its integrals over lines/planes — the math of CT scanning.",
     r"$R(f)(t,\gamma)=\int_{x\cdot\gamma=t}f$; the Fourier slice theorem $\widehat{R(f)}(s,\gamma)=\hat f(s\gamma)$ inverts it, and $\Delta(R^*Rf)=-8\pi^2 f$ in $\mathbb{R}^3$.",
     "X-ray projections are slices of the Fourier transform; inverting recovers the body's interior.",
     r"$\widehat{R(f)}(s,\gamma)=\hat f(s\gamma)$", ["applications", "imaging"], "medium",
     related=["fourier_transform_rd"])

# -- discrete: character theory of finite abelian groups (SS Ch.7 §2)
node("dual_group", "Dual Group", "structure", "discrete",
     "The group of characters of a finite abelian group, isomorphic to the group itself.",
     r"$\hat G=\operatorname{Hom}(G,\mathbb{C}^\times)$ with pointwise product; $\hat G\cong G$ for finite abelian $G$.",
     "The frequencies of a finite abelian group — its characters form a group in their own right.",
     r"$\hat G=\operatorname{Hom}(G,\mathbb{C}^\times)$", ["discrete"], "medium",
     related=["roots_of_unity"])
node("characters_finite_abelian", "Characters of Finite Abelian Groups", "theorem", "discrete",
     "The characters form an orthonormal basis, giving Fourier analysis on any finite abelian group.",
     r"The characters of $G$ are orthonormal and span all functions on $G$; hence Fourier inversion and Parseval hold on $G$.",
     "The cleanest, most general finite Fourier theory — $Z(N)$ is just the cyclic case.",
     r"$\{\chi\}$ an orthonormal basis of $L^2(G)$", ["discrete"], "medium",
     related=["dual_group", "orthonormal_system", "finite_fourier"])

# -- dirichlet: the number-theoretic machinery (SS Ch.8)
node("euclid_algorithm", "Euclidean Algorithm & Bézout", "theorem", "dirichlet",
     "Division with remainder, giving gcds as integer combinations $ax+by$.",
     r"For $b>0$ there are unique $q,r$ with $a=qb+r$, $0\le r<b$; iterating yields $\gcd(a,b)=ax+by$.",
     "The foundational algorithm of number theory — gcds are linear combinations.",
     r"$\gcd(a,b)=ax+by$", ["dirichlet", "number-theory"], "medium")
node("fundamental_arithmetic", "Fundamental Theorem of Arithmetic", "theorem", "dirichlet",
     "Every integer $>1$ factors uniquely into primes.",
     r"Each $n>1$ has a unique prime factorization $n=\prod p_i^{a_i}$.",
     "Primes are the multiplicative atoms — uniqueness is what makes them useful.",
     r"$n=\prod p_i^{a_i}$", ["dirichlet", "number-theory"], "medium",
     related=["euclid_algorithm"])
node("infinitude_primes", "Infinitude of Primes", "theorem", "dirichlet",
     "There are infinitely many primes (Euclid).",
     r"There is no largest prime: any finite list $p_1,\dots,p_k$ misses a prime dividing $p_1\cdots p_k+1$.",
     "The starting point; Dirichlet's theorem is the deep refinement to progressions.",
     r"$|\{\text{primes}\}|=\infty$", ["dirichlet", "number-theory"], "medium",
     related=["fundamental_arithmetic"])
node("euler_product", "Euler Product for the Zeta Function", "theorem", "dirichlet",
     "The zeta function factors over primes — analysis meets unique factorization.",
     r"$\zeta(s)=\sum_{n\ge1}n^{-s}=\prod_p(1-p^{-s})^{-1}$ for $s>1$.",
     "Encodes the fundamental theorem of arithmetic analytically; the seed of analytic number theory.",
     r"$\zeta(s)=\prod_p(1-p^{-s})^{-1}$", ["dirichlet", "number-theory"], "medium",
     related=["fundamental_arithmetic"])
node("primes_diverge", "Divergence of the Prime Sum", "theorem", "dirichlet",
     "The sum of reciprocals of the primes diverges — a quantitative infinitude.",
     r"$\sum_p \frac{1}{p}=\infty$, a consequence of $\zeta(s)\to\infty$ as $s\to1^+$.",
     "Primes are 'dense' enough that their reciprocals still diverge — far stronger than mere infinitude.",
     r"$\sum_p 1/p=\infty$", ["dirichlet", "number-theory"], "medium",
     related=["euler_product"])
node("dirichlet_character", "Dirichlet Character", "definition", "dirichlet",
     "A multiplicative, $q$-periodic character used to sieve arithmetic progressions.",
     r"$\chi:\mathbb{Z}\to\mathbb{C}$, $q$-periodic and completely multiplicative, induced by a character of $(\mathbb{Z}/q)^\times$; orthogonality gives $\frac{1}{\varphi(q)}\sum_\chi \bar\chi(\ell)\chi(m)=\delta_\ell(m)$.",
     "The characters of the unit group — the 'frequencies' that detect a residue class mod $q$.",
     r"$\chi \bmod q$", ["dirichlet", "number-theory"], "medium",
     related=["characters_finite_abelian"])
node("dirichlet_l_function", "Dirichlet L-Function", "structure", "dirichlet",
     "The character-twisted zeta function whose behavior at $s=1$ controls the primes.",
     r"$L(s,\chi)=\sum_{n\ge1}\frac{\chi(n)}{n^s}=\prod_p\big(1-\chi(p)p^{-s}\big)^{-1}$; for $\chi\ne\chi_0$ it extends past $s=1$.",
     "Generalizes $\\zeta$ with a character; its non-vanishing at $1$ is the crux of Dirichlet's theorem.",
     r"$L(s,\chi)$", ["dirichlet", "number-theory"], "core",
     related=["dirichlet_character", "euler_product"])
node("l_function_nonvanishing", "Non-Vanishing of L(1,χ)", "theorem", "dirichlet",
     "The key analytic fact: $L(1,\\chi)\\ne0$ for every non-trivial character.",
     r"If $\chi\ne\chi_0$ then $L(1,\chi)\ne0$; this prevents cancellation and forces $\sum_{p\equiv a}1/p=\infty$.",
     "The hard heart of the proof — without it the primes could avoid a progression.",
     r"$L(1,\chi)\ne0$", ["dirichlet", "number-theory"], "core",
     related=["dirichlet_l_function"])

# ----------------------------------------------------------------------- edges
# (source, relation, target): requires => source depends on target;
#                             instance_of => special case depends on general.
E = [
    # foundations
    ("complex_exponential", "requires", "periodic_function"),
    ("orthonormal_system", "requires", "inner_product_space"),
    ("orthonormal_system", "requires", "complex_exponential"),
    ("l1_space", "instance_of", "lp_space"),
    ("l2_space", "instance_of", "lp_space"),
    ("l2_space", "requires", "inner_product_space"),
    ("l2_space", "instance_of", "hilbert_space"),
    ("hilbert_space", "requires", "inner_product_space"),
    ("convolution", "requires", "l1_space"),
    # series
    ("fourier_coefficient", "requires", "complex_exponential"),
    ("fourier_coefficient", "requires", "l1_space"),
    ("fourier_coefficient", "requires", "inner_product_space"),
    ("fourier_series", "requires", "fourier_coefficient"),
    ("trigonometric_polynomial", "requires", "complex_exponential"),
    ("partial_sum", "requires", "fourier_series"),
    ("partial_sum", "requires", "trigonometric_polynomial"),
    ("bessel_inequality", "requires", "fourier_coefficient"),
    ("bessel_inequality", "requires", "orthonormal_system"),
    ("bessel_inequality", "requires", "l2_space"),
    ("parseval_identity", "requires", "bessel_inequality"),
    ("parseval_identity", "requires", "l2_space"),
    ("riemann_lebesgue", "requires", "fourier_coefficient"),
    ("riemann_lebesgue", "requires", "l1_space"),
    ("uniqueness_series", "requires", "fourier_coefficient"),
    ("best_approximation", "requires", "partial_sum"),
    ("best_approximation", "requires", "orthonormal_system"),
    ("best_approximation", "requires", "l2_space"),
    ("decay_smoothness", "requires", "fourier_coefficient"),
    # convergence
    ("good_kernel", "requires", "convolution"),
    ("dirichlet_kernel", "requires", "partial_sum"),
    ("fejer_kernel", "instance_of", "good_kernel"),
    ("fejer_kernel", "requires", "dirichlet_kernel"),
    ("poisson_kernel", "instance_of", "good_kernel"),
    ("cesaro_summation", "requires", "partial_sum"),
    ("abel_summation", "requires", "partial_sum"),
    ("fejer_kernel", "requires", "cesaro_summation"),
    ("poisson_kernel", "requires", "abel_summation"),
    ("fejer_theorem", "requires", "fejer_kernel"),
    ("fejer_theorem", "requires", "good_kernel"),
    ("mean_square_convergence", "requires", "parseval_identity"),
    ("mean_square_convergence", "requires", "partial_sum"),
    ("pointwise_convergence", "requires", "dirichlet_kernel"),
    ("dini_criterion", "requires", "pointwise_convergence"),
    ("dirichlet_conditions", "requires", "pointwise_convergence"),
    ("gibbs_phenomenon", "requires", "partial_sum"),
    ("gibbs_phenomenon", "requires", "dirichlet_conditions"),
    ("carleson_theorem", "requires", "pointwise_convergence"),
    ("carleson_theorem", "requires", "l2_space"),
    ("dubois_reymond", "requires", "pointwise_convergence"),
    ("dubois_reymond", "requires", "dirichlet_kernel"),
    # transform
    ("fourier_transform", "requires", "complex_exponential"),
    ("fourier_transform", "requires", "l1_space"),
    ("fourier_inversion", "requires", "fourier_transform"),
    ("fourier_inversion", "requires", "schwartz_space"),
    ("convolution_theorem", "requires", "fourier_transform"),
    ("convolution_theorem", "requires", "convolution"),
    ("plancherel_theorem", "requires", "fourier_transform"),
    ("plancherel_theorem", "requires", "l2_space"),
    ("gaussian_transform", "requires", "fourier_transform"),
    ("gaussian_transform", "instance_of", "schwartz_space"),
    ("uncertainty_principle", "requires", "fourier_transform"),
    ("uncertainty_principle", "requires", "gaussian_transform"),
    ("poisson_summation", "requires", "fourier_transform"),
    ("poisson_summation", "requires", "fourier_series"),
    ("fourier_transform_rd", "requires", "fourier_transform"),
    ("differentiation_rule", "requires", "fourier_transform"),
    ("differentiation_rule", "requires", "schwartz_space"),
    # distributions
    ("tempered_distribution", "requires", "schwartz_space"),
    ("dirac_delta", "instance_of", "tempered_distribution"),
    ("weak_derivative", "requires", "tempered_distribution"),
    ("distributional_ft", "requires", "tempered_distribution"),
    ("distributional_ft", "requires", "fourier_transform"),
    # discrete
    ("roots_of_unity", "requires", "complex_exponential"),
    ("finite_fourier", "requires", "roots_of_unity"),
    ("finite_fourier", "requires", "orthonormal_system"),
    ("dft", "requires", "finite_fourier"),
    ("dtft", "requires", "fourier_series"),
    ("fft", "requires", "dft"),
    ("circular_convolution", "requires", "dft"),
    ("circular_convolution", "requires", "convolution"),
    ("sampling_theorem", "requires", "fourier_transform"),
    ("sampling_theorem", "requires", "fourier_inversion"),
    ("aliasing", "requires", "sampling_theorem"),
    # applications
    ("heat_equation", "requires", "fourier_series"),
    ("heat_equation", "requires", "good_kernel"),
    ("wave_equation", "requires", "fourier_series"),
    ("isoperimetric", "requires", "parseval_identity"),
    ("weyl_equidistribution", "requires", "fejer_theorem"),
    ("weyl_equidistribution", "requires", "fourier_coefficient"),
    ("central_limit", "requires", "convolution_theorem"),
    ("central_limit", "requires", "gaussian_transform"),
    ("signal_filtering", "requires", "convolution_theorem"),
    ("signal_filtering", "requires", "fft"),
    # --- deepening (v2.1) ---
    # measure-theoretic floor (removes hidden roots)
    ("l1_space", "requires", "lebesgue_integral"),
    ("lp_space", "requires", "lebesgue_integral"),
    ("almost_everywhere", "requires", "lebesgue_integral"),
    ("dominated_convergence", "requires", "lebesgue_integral"),
    ("fubini_tonelli", "requires", "lebesgue_integral"),
    ("convolution", "requires", "fubini_tonelli"),
    ("carleson_theorem", "requires", "almost_everywhere"),
    ("riemann_lebesgue", "requires", "dominated_convergence"),
    # real/half-range series branch
    ("real_fourier_series", "requires", "fourier_series"),
    ("half_range_expansion", "requires", "real_fourier_series"),
    ("localization_principle", "requires", "dirichlet_kernel"),
    ("localization_principle", "requires", "pointwise_convergence"),
    ("dirichlet_conditions", "requires", "localization_principle"),
    ("dini_criterion", "requires", "localization_principle"),
    ("term_differentiation", "requires", "decay_smoothness"),
    ("term_differentiation", "requires", "fourier_series"),
    # convergence: Fejér's payoff and summability consistency
    ("weierstrass_approximation", "requires", "fejer_theorem"),
    ("weierstrass_approximation", "requires", "trigonometric_polynomial"),
    ("abel_theorem", "requires", "abel_summation"),
    ("inner_product_space", "requires", "lebesgue_integral"),
    # transform: localization, band-limiting, heat semigroup
    ("translation_modulation", "requires", "fourier_transform"),
    ("ft_continuity", "requires", "fourier_transform"),
    ("ft_continuity", "requires", "l1_space"),
    ("band_limited", "requires", "fourier_transform"),
    ("paley_wiener", "requires", "band_limited"),
    ("paley_wiener", "requires", "fourier_transform"),
    ("heat_kernel_line", "requires", "gaussian_transform"),
    ("heat_kernel_line", "requires", "convolution_theorem"),
    ("sampling_theorem", "requires", "band_limited"),
    ("sampling_theorem", "requires", "poisson_summation"),
    ("aliasing", "requires", "band_limited"),
    # distributions frontier
    ("test_function", "requires", "schwartz_space"),
    ("weak_derivative", "requires", "test_function"),
    ("convolution_distributions", "requires", "dirac_delta"),
    ("convolution_distributions", "requires", "convolution"),
    ("fundamental_solution", "requires", "distributional_ft"),
    ("fundamental_solution", "requires", "convolution_distributions"),
    # discrete frontier
    ("parseval_dft", "requires", "dft"),
    ("dct", "requires", "dft"),
    ("signal_filtering", "requires", "dct"),
    # applications: method + reduce transform leaves
    ("separation_of_variables", "requires", "fourier_series"),
    ("heat_equation", "requires", "separation_of_variables"),
    ("wave_equation", "requires", "separation_of_variables"),
    ("heat_equation", "requires", "heat_kernel_line"),
    ("dirichlet_problem_disk", "requires", "poisson_kernel"),
    ("dirichlet_problem_disk", "requires", "abel_summation"),
    ("theta_function", "requires", "poisson_summation"),
    ("theta_function", "requires", "gaussian_transform"),
    ("schrodinger_equation", "requires", "fourier_transform"),
    ("schrodinger_equation", "requires", "differentiation_rule"),
    ("diffraction", "requires", "fourier_transform_rd"),
    # --- full book coverage (v3) ---
    ("weierstrass_function", "requires", "fourier_series"),
    ("weierstrass_function", "requires", "cesaro_summation"),
    ("half_plane_poisson", "requires", "fourier_transform"),
    ("half_plane_poisson", "requires", "good_kernel"),
    ("wave_equation_rd", "requires", "fourier_transform_rd"),
    ("radon_transform", "requires", "fourier_transform_rd"),
    ("diffraction", "requires", "fourier_transform"),
    # character theory
    ("dual_group", "requires", "roots_of_unity"),
    ("characters_finite_abelian", "requires", "dual_group"),
    ("characters_finite_abelian", "requires", "orthonormal_system"),
    ("characters_finite_abelian", "requires", "finite_fourier"),
    # number theory / Dirichlet
    ("fundamental_arithmetic", "requires", "euclid_algorithm"),
    ("infinitude_primes", "requires", "fundamental_arithmetic"),
    ("euler_product", "requires", "fundamental_arithmetic"),
    ("primes_diverge", "requires", "euler_product"),
    ("dirichlet_character", "requires", "characters_finite_abelian"),
    ("dirichlet_l_function", "requires", "dirichlet_character"),
    ("dirichlet_l_function", "requires", "euler_product"),
    ("l_function_nonvanishing", "requires", "dirichlet_l_function"),
    ("dirichlet_primes", "requires", "l_function_nonvanishing"),
    ("dirichlet_primes", "requires", "dirichlet_character"),
    ("dirichlet_primes", "requires", "primes_diverge"),
]

REL_LABEL = {"requires": "requires", "instance_of": "is an instance of"}

# Every numbered Stein-Shakarchi result (content/ss_blocks.json) is claimed by
# exactly one node here. build() asserts the union covers all 116 results.
BOOK_REFS = {
    # Ch.2
    "uniqueness_series": ["c2_cor_2_2", "c2_cor_2_3", "c2_cor_5_3", "c2_thm_2_1"],
    "decay_smoothness": ["c2_cor_2_4"],
    "convolution": ["c2_lem_3_2", "c2_prop_3_1"],
    "fejer_kernel": ["c2_lem_5_1"],
    "poisson_kernel": ["c2_lem_5_5"],
    "good_kernel": ["c2_thm_4_1", "c5_cor_1_7", "c5_thm_1_6"],
    "fejer_theorem": ["c2_thm_5_2"],
    "abel_summation": ["c2_thm_5_6", "c3_lem_2_3"],
    "dirichlet_problem_disk": ["c2_thm_5_7"],
    "weierstrass_approximation": ["c2_cor_5_4", "c5_thm_1_13"],
    # Ch.3
    "best_approximation": ["c3_lem_1_2"],
    "parseval_identity": ["c3_lem_1_5", "c3_thm_1_3"],
    "mean_square_convergence": ["c3_lem_2_4", "c3_lem_3_2", "c3_thm_1_1"],
    "riemann_lebesgue": ["c3_thm_1_4"],
    "dini_criterion": ["c3_thm_2_1"],
    "localization_principle": ["c3_thm_2_2"],
    # Ch.4
    "weyl_equidistribution": ["c4_cor_2_3", "c4_lem_2_2", "c4_thm_2_1"],
    "weierstrass_function": ["c4_lem_3_2", "c4_lem_3_3", "c4_thm_3_1"],
    "isoperimetric": ["c4_thm_1_1"],
    # Ch.5
    "heat_kernel_line": ["c5_cor_1_5", "c5_cor_3_4", "c5_thm_3_3"],
    "fourier_inversion": ["c5_cor_1_10", "c5_thm_1_9"],
    "heat_equation": ["c5_cor_2_2", "c5_thm_2_1", "c5_thm_2_3"],
    "schwartz_space": ["c5_cor_2_4", "c5_prop_1_1", "c5_thm_1_3"],
    "half_plane_poisson": ["c5_lem_2_4", "c5_lem_2_5", "c5_lem_2_8", "c5_thm_2_6", "c5_thm_2_7", "c5_thm_3_5"],
    "translation_modulation": ["c5_prop_1_2"],
    "convolution_theorem": ["c5_prop_1_8", "c5_prop_1_11"],
    "gaussian_transform": ["c5_thm_1_4"],
    "plancherel_theorem": ["c5_thm_1_12"],
    "poisson_summation": ["c5_thm_3_1"],
    "theta_function": ["c5_thm_3_2"],
    "uncertainty_principle": ["c5_thm_4_1"],
    # Ch.6
    "fourier_transform_rd": ["c6_cor_2_2", "c6_cor_2_3", "c6_prop_2_1"],
    "wave_equation_rd": ["c6_lem_3_3", "c6_lem_3_4", "c6_lem_3_5", "c6_thm_2_4",
                          "c6_thm_3_1", "c6_thm_3_2", "c6_thm_3_6", "c6_thm_3_7"],
    "radon_transform": ["c6_cor_5_3", "c6_lem_5_2", "c6_prop_5_1", "c6_thm_5_4"],
    # Ch.7
    "finite_fourier": ["c7_lem_1_1"],
    "fft": ["c7_lem_1_4", "c7_thm_1_3"],
    "parseval_dft": ["c7_thm_1_2"],
    "dual_group": ["c7_lem_2_1"],
    "characters_finite_abelian": ["c7_lem_2_2", "c7_lem_2_4", "c7_lem_2_6",
                                   "c7_thm_2_3", "c7_thm_2_5", "c7_thm_2_7", "c7_thm_2_8"],
    # Ch.8
    "euclid_algorithm": ["c8_thm_1_1", "c8_thm_1_2", "c8_cor_1_3", "c8_cor_1_4"],
    "fundamental_arithmetic": ["c8_cor_1_5", "c8_thm_1_6"],
    "infinitude_primes": ["c8_thm_1_7"],
    "euler_product": ["c8_lem_1_8", "c8_prop_1_9", "c8_thm_1_10", "c8_prop_3_2"],
    "primes_diverge": ["c8_prop_1_11"],
    "dirichlet_character": ["c8_lem_2_2", "c8_prop_3_3"],
    "dirichlet_l_function": ["c8_thm_2_4", "c8_prop_3_1", "c8_prop_3_4", "c8_lem_3_5", "c8_prop_3_6"],
    "l_function_nonvanishing": ["c8_thm_3_7", "c8_thm_2_3", "c8_lem_3_8", "c8_lem_3_9",
                                 "c8_prop_3_10", "c8_prop_3_11", "c8_prop_3_13",
                                 "c8_thm_3_12", "c8_lem_3_14", "c8_lem_3_15"],
    "dirichlet_primes": ["c8_thm_2_1"],
}

_SS_KIND = {"thm": "Theorem", "lem": "Lemma", "cor": "Corollary", "prop": "Proposition"}


def format_ss_ref(ss_id: str) -> str:
    # cN_kind_a_b -> "Ch.N Kind a.b"
    chap, kind, a, b = ss_id.split("_")
    return f"Ch.{chap[1:]} {_SS_KIND.get(kind, kind)} {a}.{b}"


def check_book_coverage(node_ids: set[str]) -> None:
    ss_path = ROOT / "content" / "ss_blocks.json"
    if not ss_path.exists():
        print("! content/ss_blocks.json missing — skipping coverage check")
        return
    all_ss = {b["node_id"] for b in json.loads(ss_path.read_text(encoding="utf-8"))}
    claimed: dict[str, str] = {}
    problems = []
    for node_id, refs in BOOK_REFS.items():
        if node_id not in node_ids:
            problems.append(f"BOOK_REFS names unknown node '{node_id}'")
        for r in refs:
            if r not in all_ss:
                problems.append(f"{node_id} claims unknown book result '{r}'")
            elif r in claimed:
                problems.append(f"{r} claimed by both {claimed[r]} and {node_id}")
            else:
                claimed[r] = node_id
    unclaimed = sorted(all_ss - set(claimed))
    if problems:
        raise SystemExit("BOOK COVERAGE ERRORS:\n  " + "\n  ".join(problems))
    if unclaimed:
        raise SystemExit(f"BOOK COVERAGE INCOMPLETE: {len(unclaimed)} unclaimed results:\n  "
                         + "\n  ".join(unclaimed))
    print(f"Book coverage: {len(claimed)}/{len(all_ss)} numbered SS results claimed ✓")


def apply_diagram_paths(doc: dict) -> None:
    for item in doc["graph"]["items"]:
        path = DIAGRAM_PATHS.get(item["id"])
        if path:
            item["diagram_path"] = path
        else:
            item.pop("diagram_path", None)


def dumps_map(doc: dict) -> str:
    text = json.dumps(doc, indent=2, ensure_ascii=False)
    string_array = re.compile(r"\[\n((?:\s+\"(?:[^\"\\]|\\.)+\"(?:,\n|\n))+)\s+\]")

    def compact(match: re.Match[str]) -> str:
        values = [line.strip().rstrip(",") for line in match.group(1).splitlines() if line.strip()]
        return "[" + ", ".join(values) + "]"

    return string_array.sub(compact, text) + "\n"


def apply_diagram_paths_to_text(text: str) -> str:
    text = re.sub(r',\n        "diagram_path": "[^"]+"', "", text)
    for node_id, path in DIAGRAM_PATHS.items():
        id_marker = f'"id": "{node_id}"'
        id_index = text.find(id_marker)
        if id_index < 0:
            raise SystemExit(f"diagram path references missing node: {node_id}")
        metadata_index = text.find('"metadata": {', id_index)
        if metadata_index < 0:
            raise SystemExit(f"node {node_id} has no metadata block")
        brace_start = text.find("{", metadata_index)
        depth = 0
        brace_end = -1
        for index in range(brace_start, len(text)):
            if text[index] == "{":
                depth += 1
            elif text[index] == "}":
                depth -= 1
                if depth == 0:
                    brace_end = index
                    break
        if brace_end < 0:
            raise SystemExit(f"node {node_id} metadata block is not closed")
        text = text[: brace_end + 1] + f',\n        "diagram_path": "{path}"' + text[brace_end + 1 :]

    doc = json.loads(text)
    paths_by_id = {item["id"]: item.get("diagram_path", "") for item in doc["graph"]["items"]}
    for node_id, path in DIAGRAM_PATHS.items():
        if paths_by_id.get(node_id) != path:
            raise SystemExit(f"diagram path was not applied to {node_id}")
    stray = [node_id for node_id, path in paths_by_id.items() if path and node_id not in DIAGRAM_PATHS]
    if stray:
        raise SystemExit(f"unexpected diagram paths on nodes: {', '.join(stray)}")
    return text


def build():
    ids = {n["id"] for n in N}
    # integrity checks
    for n in N:
        for r in n["related"]:
            if r not in ids:
                raise SystemExit(f"node {n['id']} related -> missing {r}")
    check_book_coverage(ids)
    items = []
    for n in N:
        deps = [t for (s, rel, t) in E if s == n["id"] and rel in ("requires", "instance_of")]
        book_refs = BOOK_REFS.get(n["id"], [])
        ref = ("Stein–Shakarchi: " + "; ".join(format_ss_ref(r) for r in book_refs)
               if book_refs else "")
        item = {
            "id": n["id"], "label": n["label"], "kind": n["kind"], "domain": n["domain"],
            "statement": n["statement"], "formal_statement": n["formal"] or None,
            "definition": None, "intuition": n["intuition"] or None, "proof": None,
            "notation": n["notation"] or None,
            "proof_dependencies": [],
            "dependencies": {"logical_dependency": deps} if deps else {},
            "outgoing_relations": [], "related": n["related"], "assumptions": [],
            "ref": ref,
            "book_refs": book_refs,
            "metadata": {"tags": n["tags"], "syllabus_priority": n["priority"],
                         "source": ref or "Curated concept graph"},
        }
        if n["diagram_path"]:
            item["diagram_path"] = n["diagram_path"]
        items.append(item)
    edges = []
    seen = set()
    for (s, rel, t) in E:
        if s not in ids or t not in ids:
            raise SystemExit(f"edge {s} {rel} {t} references missing node")
        eid = f"e_{s}__{rel}__{t}"
        if eid in seen:
            raise SystemExit(f"duplicate edge {eid}")
        seen.add(eid)
        edges.append({
            "id": eid, "source": s, "target": t, "type": rel,
            "dependency_class": "logical_dependency", "label": REL_LABEL.get(rel, rel),
            "direction": "source_to_target", "confidence": "high", "notes": "",
        })
    domains = [{"id": i, "label": l, "order": o, "color": c, "description": d}
               for (i, l, o, c, d) in DOMAINS]
    generated_doc = {"graph": {
        "id": "fourier_analysis_curated_v2",
        "label": "Fourier Analysis",
        "field": "fourier_analysis",
        "model": "directed_typed_multigraph",
        "design_notes": [
            "Curated conceptual knowledge graph of Fourier analysis (not tied to a single text).",
            "Nodes are named concepts/results; edges form a prerequisite DAG via `requires`/`instance_of`.",
            "Soft associations live in each node's `related[]` (panel-only, not layout edges).",
        ],
        "domains": domains, "items": items, "edges": edges,
    }}
    doc = generated_doc
    output_text = ""
    if OUT.exists():
        existing_text = OUT.read_text(encoding="utf-8")
        existing_doc = json.loads(existing_text)
        existing_items = existing_doc.get("graph", {}).get("items", [])
        if len(existing_items) >= len(items):
            output_text = apply_diagram_paths_to_text(existing_text)
            doc = json.loads(output_text)
            print(
                "Preserving existing checked-in Fourier map "
                f"({len(existing_items)} nodes) and applying generated diagram paths."
            )
    if not output_text:
        apply_diagram_paths(doc)
        output_text = dumps_map(doc)
    OUT.write_text(output_text, encoding="utf-8")
    from collections import Counter
    written_items = doc["graph"]["items"]
    written_edges = doc["graph"]["edges"]
    print(f"Wrote {len(written_items)} nodes, {len(written_edges)} edges -> {OUT.relative_to(ROOT)}")
    print("per domain:", dict(Counter(it["domain"] for it in written_items)))
    print("edge types:", dict(Counter(e["type"] for e in written_edges)))
    print("kinds:", dict(Counter(it["kind"] for it in written_items)))


if __name__ == "__main__":
    build()
