export type AtlasKind =
  | "definition"
  | "theorem"
  | "lemma"
  | "example"
  | "proposition"
  | "corollary";

export type RouteKind = "statement" | "proof" | "illustration";

export interface AtlasNode {
  id: string;
  kind: AtlasKind;
  title: string;
  cluster: string;
  x: number;
  y: number;
  dependencies: string[];
  illustratedBy: string[];
  description: string;
  formalStatement: string;
  proofSketch: string;
  notes: string[];
}

export interface AtlasRoute {
  id: string;
  from: string;
  to: string;
  kind: RouteKind;
  path: string;
  active?: boolean;
}

export const NODE_KIND_META: Record<
  AtlasKind,
  { label: string; color: string; short: string }
> = {
  definition: { label: "Definition", color: "#2F5D8C", short: "D" },
  theorem: { label: "Theorem", color: "#8A3B3B", short: "T" },
  lemma: { label: "Lemma", color: "#47715D", short: "L" },
  example: { label: "Example", color: "#9A6B16", short: "E" },
  proposition: { label: "Proposition", color: "#7A4E7A", short: "P" },
  corollary: { label: "Corollary", color: "#A05A2C", short: "C" },
};

export const ROUTE_META: Record<RouteKind, { label: string; color: string }> = {
  statement: { label: "Statement depends on", color: "#006BA6" },
  proof: { label: "Used in proof", color: "#7A4D98" },
  illustration: { label: "Illustrates / Example of", color: "#D97904" },
};

export const atlasNodes: AtlasNode[] = [
  {
    id: "D1",
    kind: "definition",
    title: "Set",
    cluster: "Foundations",
    x: 450,
    y: 42,
    dependencies: [],
    illustratedBy: [],
    description: "The ambient language for collecting mathematical objects.",
    formalStatement:
      "A set is a collection of distinct objects, regarded as elements.",
    proofSketch:
      "This item is a primitive definition in the atlas and serves as notation for later constructions.",
    notes: ["Introduces membership notation and subset language."],
  },
  {
    id: "D2",
    kind: "definition",
    title: "Topological Space",
    cluster: "Foundations",
    x: 420,
    y: 146,
    dependencies: ["D1", "D3"],
    illustratedBy: [],
    description:
      "A set equipped with a distinguished collection of open subsets.",
    formalStatement:
      "A topological space is a pair $(X,\\tau)$ where $\\tau$ is closed under arbitrary unions and finite intersections.",
    proofSketch:
      "The definition packages the open-set axioms into a structure that can support continuity and compactness.",
    notes: ["Central interchange for the foundations route."],
  },
  {
    id: "D3",
    kind: "definition",
    title: "Open Set",
    cluster: "Foundations",
    x: 184,
    y: 182,
    dependencies: ["D1"],
    illustratedBy: ["E1"],
    description: "A subset declared to be locally accessible in the topology.",
    formalStatement: "Members of the topology $\\tau$ are called open sets.",
    proofSketch:
      "Open sets encode local information and generate neighborhoods, bases, and continuity tests.",
    notes: ["Used by basis and neighborhood stations."],
  },
  {
    id: "D4",
    kind: "definition",
    title: "Basis",
    cluster: "Foundations",
    x: 450,
    y: 286,
    dependencies: ["D2", "D3"],
    illustratedBy: [],
    description:
      "A small collection of opens from which a topology is generated.",
    formalStatement:
      "A basis $\\mathcal{B}$ for $X$ is a collection whose unions form the open sets of a topology.",
    proofSketch:
      "Basis elements reduce topological arguments to controlled local neighborhoods.",
    notes: ["A frequent shortcut for constructing examples."],
  },
  {
    id: "D5",
    kind: "definition",
    title: "Neighborhood",
    cluster: "Foundations",
    x: 688,
    y: 290,
    dependencies: ["D2", "D3"],
    illustratedBy: ["E1"],
    description: "A set that contains an open set around a point.",
    formalStatement:
      "A neighborhood of $x$ is a set $N$ containing an open set $U$ with $x \\in U \\subseteq N$.",
    proofSketch:
      "Neighborhoods translate open-set structure into pointwise local statements.",
    notes: ["Often paired with continuity."],
  },
  {
    id: "D6",
    kind: "definition",
    title: "Continuous Function",
    cluster: "Maps",
    x: 882,
    y: 166,
    dependencies: ["D2", "D3"],
    illustratedBy: [],
    description:
      "A map preserving the topological structure by inverse images of open sets.",
    formalStatement:
      "A function $f:X\\to Y$ is continuous when $f^{-1}(U)$ is open in $X$ for every open $U\\subseteq Y$.",
    proofSketch:
      "Continuity is the bridge from topology to fixed-point statements and compactness arguments.",
    notes: ["One of the direct dependencies of T12."],
  },
  {
    id: "L5",
    kind: "lemma",
    title: "Compact Subcover Lemma",
    cluster: "Compactness",
    x: 170,
    y: 382,
    dependencies: ["D3", "D8"],
    illustratedBy: ["E2"],
    description: "A cover argument distilled into a reusable compactness step.",
    formalStatement:
      "Every open cover of a compact space has a finite subcover.",
    proofSketch:
      "The compactness hypothesis is applied to pass from local cover data to finitely many witnesses.",
    notes: ["A compactness side route used by Heine-Borel-style cover arguments."],
  },
  {
    id: "T7",
    kind: "theorem",
    title: "Heine-Borel Theorem",
    cluster: "Compactness",
    x: 402,
    y: 500,
    dependencies: ["L5", "D8"],
    illustratedBy: ["E2"],
    description:
      "The Euclidean criterion connecting compactness with closed and bounded subsets.",
    formalStatement:
      "A subset of $\\mathbb{R}^n$ is compact if and only if it is closed and bounded.",
    proofSketch:
      "The proof combines finite subcover extraction with Euclidean boundedness and closedness.",
    notes: [
      "Acts as a transfer station between examples and fixed-point tools.",
    ],
  },
  {
    id: "T8",
    kind: "theorem",
    title: "Intermediate Value Theorem",
    cluster: "Continuity",
    x: 690,
    y: 438,
    dependencies: ["D6", "T7"],
    illustratedBy: ["E1"],
    description:
      "A connectedness-flavored consequence of continuity on intervals.",
    formalStatement:
      "If $f:[a,b]\\to\\mathbb{R}$ is continuous and $y$ lies between $f(a)$ and $f(b)$, then $f(c)=y$ for some $c\\in[a,b]$.",
    proofSketch:
      "The statement depends on continuity and interval structure to force a crossing value.",
    notes: ["A readable stop before the fixed-point route bends downward."],
  },
  {
    id: "D8",
    kind: "definition",
    title: "Compact Space",
    cluster: "Compactness",
    x: 414,
    y: 626,
    dependencies: ["D2", "D3"],
    illustratedBy: ["E2"],
    description: "A space where every open cover admits a finite subcover.",
    formalStatement:
      "A topological space $X$ is compact if every open cover of $X$ has a finite subcover.",
    proofSketch:
      "Compactness makes infinite local data controllable by finite selections.",
    notes: ["Directly cited in the Brouwer note."],
  },
  {
    id: "P10",
    kind: "proposition",
    title: "Schauder Fixed Point Proposition",
    cluster: "Fixed Point Theory",
    x: 676,
    y: 598,
    dependencies: ["D6", "D8"],
    illustratedBy: [],
    description:
      "A fixed-point bridge from compact convex geometry to self maps.",
    formalStatement:
      "A continuous self-map of a suitable compact convex set admits a fixed point.",
    proofSketch:
      "Approximation and compactness reduce the fixed-point claim to a finite-dimensional construction.",
    notes: ["One of the named dependencies for T12."],
  },
  {
    id: "L9",
    kind: "lemma",
    title: "Homotopy Extension Lemma",
    cluster: "Fixed Point Theory",
    x: 914,
    y: 516,
    dependencies: ["D5", "D6"],
    illustratedBy: [],
    description: "A deformation tool used to control continuous extensions.",
    formalStatement:
      "Under appropriate hypotheses, a homotopy defined on a subspace extends to the ambient space.",
    proofSketch:
      "The lemma organizes local extension data into a global homotopy argument.",
    notes: ["The final transfer station before Brouwer."],
  },
  {
    id: "T12",
    kind: "theorem",
    title: "Brouwer Fixed Point Theorem",
    cluster: "Fixed Point Theory",
    x: 838,
    y: 674,
    dependencies: ["L9", "P10", "D6", "D8"],
    illustratedBy: ["E2"],
    description:
      "Every continuous function from a compact convex set to itself has a fixed point.",
    formalStatement:
      "Let $K \\subseteq \\mathbb{R}^n$ be a nonempty compact convex set, and let $f : K \\to K$ be continuous. Then there exists $x \\in K$ such that $f(x)=x$.",
    proofSketch:
      "The proof uses a fixed-point approximation argument and depends on compactness, continuity, and an intermediate construction. Keep the text readable and formatted like a mathematical reference note.",
    notes: [
      "Selected as the active theorem in this atlas view.",
      "The highlighted route shows one compact dependency path from D2 to T12.",
    ],
  },
  {
    id: "C11",
    kind: "corollary",
    title: "Closed in Compact is Compact",
    cluster: "Compactness",
    x: 578,
    y: 742,
    dependencies: ["D8"],
    illustratedBy: ["E2"],
    description:
      "Closed subspaces inherit compactness from a compact ambient space.",
    formalStatement:
      "If $A$ is closed in a compact space $X$, then $A$ is compact.",
    proofSketch:
      "Extend an open cover of $A$ by adding the complement of $A$ and use compactness of $X$.",
    notes: ["A downstream compactness consequence."],
  },
  {
    id: "C13",
    kind: "corollary",
    title: "Fixed Point in $\\mathbb{R}^n$",
    cluster: "Fixed Point Theory",
    x: 892,
    y: 746,
    dependencies: ["T12"],
    illustratedBy: [],
    description: "A Euclidean fixed-point consequence of Brouwer's theorem.",
    formalStatement:
      "Every continuous self-map of a closed ball in $\\mathbb{R}^n$ has a fixed point.",
    proofSketch:
      "Apply Brouwer to the closed ball, which is nonempty, compact, and convex.",
    notes: ["A terminal stop on the selected theorem line."],
  },
  {
    id: "E1",
    kind: "example",
    title: "Open Interval in $\\mathbb{R}$",
    cluster: "Examples",
    x: 160,
    y: 660,
    dependencies: ["D3"],
    illustratedBy: [],
    description:
      "The interval $(a,b)$ as the standard local model for openness.",
    formalStatement:
      "$(a,b)=\\{x\\in\\mathbb{R}:a<x<b\\}$ is open in the usual topology on $\\mathbb{R}$.",
    proofSketch:
      "Every point in the interval has a smaller interval around it still contained in $(a,b)$.",
    notes: ["Illustrates open-set and IVT intuition."],
  },
  {
    id: "E2",
    kind: "example",
    title: "Heine-Borel Example",
    cluster: "Examples",
    x: 138,
    y: 534,
    dependencies: ["E1", "L5"],
    illustratedBy: [],
    description:
      "A concrete compact interval used to read Heine-Borel geometrically.",
    formalStatement:
      "The interval $[a,b]\\subset\\mathbb{R}$ is compact by Heine-Borel.",
    proofSketch:
      "The interval is closed and bounded, so the theorem supplies compactness.",
    notes: ["Used as the illustration chip for T12."],
  },
];

export const atlasNodesById = new Map(
  atlasNodes.map((node) => [node.id, node]),
);

export const activePathIds = ["D2", "D6", "D8", "P10"];

export const atlasRoutes: AtlasRoute[] = [
  {
    id: "D1-D2",
    from: "D1",
    to: "D2",
    kind: "statement",
    path: "M520 116 L520 146",
  },
  {
    id: "D3-D2",
    from: "D3",
    to: "D2",
    kind: "statement",
    path: "M324 214 C370 214 366 180 420 180",
  },
  {
    id: "D2-D4",
    from: "D2",
    to: "D4",
    kind: "statement",
    path: "M500 218 L500 286",
  },
  {
    id: "D3-D4",
    from: "D3",
    to: "D4",
    kind: "proof",
    path: "M264 254 C264 314 402 250 450 306",
  },
  {
    id: "D4-D5",
    from: "D4",
    to: "D5",
    kind: "statement",
    path: "M602 324 L688 324",
  },
  {
    id: "D5-D6",
    from: "D5",
    to: "D6",
    kind: "proof",
    path: "M842 324 C932 324 830 196 882 196",
  },
  {
    id: "D2-D6",
    from: "D2",
    to: "D6",
    kind: "statement",
    active: true,
    path: "M580 182 L770 182 C800 182 810 196 882 196",
  },
  {
    id: "D2-D8",
    from: "D2",
    to: "D8",
    kind: "statement",
    active: true,
    path: "M500 218 C500 350 470 500 494 626",
  },
  {
    id: "D4-L5",
    from: "D4",
    to: "L5",
    kind: "statement",
    path: "M450 346 C388 346 360 412 322 412",
  },
  {
    id: "L5-T7",
    from: "L5",
    to: "T7",
    kind: "proof",
    path: "M322 420 C362 420 344 530 402 530",
  },
  {
    id: "L5-T8",
    from: "L5",
    to: "T8",
    kind: "proof",
    path: "M322 420 C440 420 548 466 690 468",
  },
  {
    id: "L5-D8",
    from: "L5",
    to: "D8",
    kind: "proof",
    path: "M250 456 C250 592 360 562 414 650",
  },
  {
    id: "T7-D8",
    from: "T7",
    to: "D8",
    kind: "statement",
    path: "M482 572 L482 626",
  },
  {
    id: "T7-T8",
    from: "T7",
    to: "T8",
    kind: "statement",
    path: "M562 532 C612 532 612 468 690 468",
  },
  {
    id: "D6-T8",
    from: "D6",
    to: "T8",
    kind: "proof",
    path: "M960 238 C960 378 800 348 800 438",
  },
  {
    id: "D6-P10",
    from: "D6",
    to: "P10",
    kind: "statement",
    active: true,
    path: "M960 238 C994 384 874 570 836 628",
  },
  {
    id: "T8-P10",
    from: "T8",
    to: "P10",
    kind: "proof",
    path: "M770 510 C802 558 750 598 756 598",
  },
  {
    id: "D8-P10",
    from: "D8",
    to: "P10",
    kind: "statement",
    active: true,
    path: "M566 658 L676 628",
  },
  {
    id: "P10-L9",
    from: "P10",
    to: "L9",
    kind: "proof",
    path: "M836 628 C872 628 868 546 914 546",
  },
  {
    id: "D5-L9",
    from: "D5",
    to: "L9",
    kind: "proof",
    path: "M842 326 C990 326 1010 484 994 516",
  },
  {
    id: "L9-T12",
    from: "L9",
    to: "T12",
    kind: "proof",
    path: "M994 588 C1018 642 948 704 998 704",
  },
  {
    id: "P10-T12",
    from: "P10",
    to: "T12",
    kind: "proof",
    path: "M756 670 C756 722 846 640 838 704",
  },
  {
    id: "D8-T12",
    from: "D8",
    to: "T12",
    kind: "statement",
    path: "M566 674 C666 704 736 704 838 704",
  },
  {
    id: "E1-E2",
    from: "E1",
    to: "E2",
    kind: "illustration",
    path: "M218 660 L218 606",
  },
  {
    id: "E2-L5",
    from: "E2",
    to: "L5",
    kind: "illustration",
    path: "M218 534 C218 496 216 456 250 456",
  },
  {
    id: "E2-T7",
    from: "E2",
    to: "T7",
    kind: "illustration",
    path: "M298 566 C346 566 354 530 402 530",
  },
  {
    id: "E1-D8",
    from: "E1",
    to: "D8",
    kind: "statement",
    path: "M320 692 C374 692 366 656 414 656",
  },
  {
    id: "D8-C11",
    from: "D8",
    to: "C11",
    kind: "statement",
    path: "M494 698 L494 772 L578 772",
  },
  {
    id: "T12-C13",
    from: "T12",
    to: "C13",
    kind: "illustration",
    path: "M918 746 L918 776 L892 776",
  },
  {
    id: "E2-T12",
    from: "E2",
    to: "T12",
    kind: "illustration",
    path: "M218 606 C260 830 870 828 918 746",
  },
];
