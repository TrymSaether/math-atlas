# Chapter 3 — Complete Solutions with Setup

## Exercise 3.1

### Setup and Definitions

**Setting.** Let $X = \{a, b, c, d\}$ be a finite set. We work with Definition 3.1 throughout.

**Definition 3.1 (Topological space).** A topology on $X$ is a collection $\mathcal{T}$ of subsets of $X$, called _open sets_, satisfying:

- **T1.** $\emptyset \in \mathcal{T}$ and $X \in \mathcal{T}$.
- **T2.** The union of any subcollection of $\mathcal{T}$ lies in $\mathcal{T}$.
- **T3.** The intersection of any **finite** subcollection of $\mathcal{T}$ lies in $\mathcal{T}$.

**The candidate collection.**

$$\mathcal{T} = \bigl\{\emptyset,\, \{a\},\, \{a,b\},\, \{a,b,c\},\, \{b,c,d\},\, X\bigr\}.$$

**Goal.** (i) Identify which axiom $\mathcal{T}$ violates. (ii) Exhibit a topology $\mathcal{T}' \supsetneq \mathcal{T}$ with $\mathcal{T}' \neq \mathcal{T}_{\mathrm{disc}}$.

---

**Proof.** _We show $\mathcal{T}$ violates T3, then construct a valid extension._

**Step 1 [T3 fails].** Consider the two open sets $\{a,b,c\}, \{b,c,d\} \in \mathcal{T}$. Their intersection is

$$\{a,b,c\} \cap \{b,c,d\} = \{b,c\}.$$

Inspecting $\mathcal{T}$ directly: $\{b,c\}$ does not appear in $\mathcal{T}$. By T3, the intersection of any finite subcollection must lie in $\mathcal{T}$. This is violated, so $\mathcal{T}$ is **not** a topology.

**Step 2 [Repairing $\mathcal{T}$].** We must include $\{b,c\}$ in any extension. Set

$$\mathcal{T}^{(1)} = \mathcal{T} \cup \{\{b,c\}\} = \bigl\{\emptyset,\, \{a\},\, \{a,b\},\, \{b,c\},\, \{a,b,c\},\, \{b,c,d\},\, X\bigr\}.$$

Check whether $\mathcal{T}^{(1)}$ is now closed under finite intersections. The new element $\{b,c\}$ produces:

$$\{a,b\} \cap \{b,c\} = \{b\}.$$

But $\{b\} \notin \mathcal{T}^{(1)}$, so T3 still fails. We must add $\{b\}$ as well. Set

$$\mathcal{T}' = \bigl\{\emptyset,\, \{a\},\, \{b\},\, \{a,b\},\, \{b,c\},\, \{a,b,c\},\, \{b,c,d\},\, X\bigr\}.$$

**Step 3 [Verify T1 for $\mathcal{T}'$].** $\emptyset, X \in \mathcal{T}'$. ✓

**Step 4 [Verify T2 for $\mathcal{T}'$ — selected unions].**

$$\{a\} \cup \{b\} = \{a,b\} \in \mathcal{T}', \quad \{b\} \cup \{b,c,d\} = \{b,c,d\} \in \mathcal{T}',$$
$$\{a\} \cup \{b,c,d\} = X \in \mathcal{T}', \quad \{b,c\} \cup \{a,b\} = \{a,b,c\} \in \mathcal{T}'.$$

All remaining unions either equal $X$ or a set already listed. ✓

**Step 5 [Verify T3 for $\mathcal{T}'$ — all pairwise intersections of non-trivial pairs].**

| $U$         | $V$         | $U \cap V$  | In $\mathcal{T}'$? |
| ----------- | ----------- | ----------- | ------------------ |
| $\{a\}$     | $\{b\}$     | $\emptyset$ | ✓                  |
| $\{a\}$     | $\{b,c\}$   | $\emptyset$ | ✓                  |
| $\{a\}$     | $\{b,c,d\}$ | $\emptyset$ | ✓                  |
| $\{a\}$     | $\{a,b\}$   | $\{a\}$     | ✓                  |
| $\{b\}$     | $\{b,c\}$   | $\{b\}$     | ✓                  |
| $\{b\}$     | $\{a,b,c\}$ | $\{b\}$     | ✓                  |
| $\{b\}$     | $\{b,c,d\}$ | $\{b\}$     | ✓                  |
| $\{a,b\}$   | $\{b,c\}$   | $\{b\}$     | ✓                  |
| $\{a,b\}$   | $\{b,c,d\}$ | $\{b\}$     | ✓                  |
| $\{a,b,c\}$ | $\{b,c,d\}$ | $\{b,c\}$   | ✓                  |

All further intersections reduce to previously verified cases. ✓

**Step 6 [$\mathcal{T} \subseteq \mathcal{T}' \subsetneq \mathcal{T}_{\mathrm{disc}}$].** Every element of $\mathcal{T}$ appears in $\mathcal{T}'$ by construction. The singleton $\{c\} \notin \mathcal{T}'$, but $\{c\} \in \mathcal{T}_{\mathrm{disc}} = \mathcal{P}(X)$, so $\mathcal{T}' \neq \mathcal{T}_{\mathrm{disc}}$.

**Conclusion.** $\mathcal{T}$ fails T3 because $\{a,b,c\} \cap \{b,c,d\} = \{b,c\} \notin \mathcal{T}$. The collection

$$\mathcal{T}' = \bigl\{\emptyset,\, \{a\},\, \{b\},\, \{a,b\},\, \{b,c\},\, \{a,b,c\},\, \{b,c,d\},\, X\bigr\}$$

is a topology on $X$ with $\mathcal{T} \subsetneq \mathcal{T}' \subsetneq \mathcal{T}_{\mathrm{disc}}$. $\blacksquare$

---

## Exercise 3.2

### Setup and Definitions

**Setting.** $X$ is a non-empty set and $x_0 \in X$ is a fixed element. We consider the collection

$$\mathcal{T} = \{U \subseteq X \mid x_0 \notin U \;\text{ or }\; X \setminus U \text{ is finite}\}.$$

**Unpacking the membership condition.** A set $U \subseteq X$ belongs to $\mathcal{T}$ if at least one of the following holds:

- **(C1)** $x_0 \notin U$ (the distinguished point is absent), or
- **(C2)** $X \setminus U$ is finite (the complement is finite).

Note that C1 and C2 are not mutually exclusive: $\emptyset$ satisfies C1, and $X$ satisfies C2 (since $X \setminus X = \emptyset$ is finite).

**Assumption.** No assumption on the cardinality of $X$ is needed; the argument works for all non-empty sets.

**Goal.** Show $\mathcal{T}$ satisfies T1, T2, T3 of Definition 3.1, hence is a topology on $X$.

---

**Proof.**

**Step 1 [T1].** We verify $\emptyset, X \in \mathcal{T}$.

For $\emptyset$: since $x_0 \notin \emptyset$, condition C1 holds. Thus $\emptyset \in \mathcal{T}$.

For $X$: we have $X \setminus X = \emptyset$, which is finite, so condition C2 holds. Thus $X \in \mathcal{T}$.

**Step 2 [T2 — arbitrary unions].** Let $\{U_\lambda\}_{\lambda \in \Lambda}$ be any subcollection of $\mathcal{T}$, and let $V = \bigcup_{\lambda \in \Lambda} U_\lambda$. We show $V \in \mathcal{T}$ by splitting into two cases according to whether $x_0 \in V$.

**Case A: $x_0 \notin V$.** Then C1 holds for $V$ directly, so $V \in \mathcal{T}$.

**Case B: $x_0 \in V$.** Then $x_0 \in U_{\lambda_0}$ for some $\lambda_0 \in \Lambda$. Since $U_{\lambda_0} \in \mathcal{T}$ and C1 fails for $U_{\lambda_0}$ (as $x_0 \in U_{\lambda_0}$), condition C2 must hold: $X \setminus U_{\lambda_0}$ is finite. Now observe

$$X \setminus V \;=\; X \setminus \bigcup_{\lambda} U_\lambda \;=\; \bigcap_{\lambda} (X \setminus U_\lambda) \;\subseteq\; X \setminus U_{\lambda_0}.$$

A subset of a finite set is finite, so $X \setminus V$ is finite, and C2 holds for $V$. Thus $V \in \mathcal{T}$.

**Step 3 [T3 — finite intersections].** Let $U_1, \ldots, U_n \in \mathcal{T}$ and $W = \bigcap_{i=1}^n U_i$.

**Case A: $x_0 \notin U_i$ for some $i$.** Then $x_0 \notin W$ (since $W \subseteq U_i$), so C1 holds and $W \in \mathcal{T}$.

**Case B: $x_0 \in U_i$ for all $i$.** Since each $U_i \in \mathcal{T}$ and C1 fails for each, C2 must hold for each: $X \setminus U_i$ is finite for all $i$. Then

$$X \setminus W \;=\; X \setminus \bigcap_{i=1}^n U_i \;=\; \bigcup_{i=1}^n (X \setminus U_i),$$

which is a finite union of finite sets, hence finite. So C2 holds and $W \in \mathcal{T}$.

**Conclusion.** All three axioms of Definition 3.1 are satisfied, so $\mathcal{T}$ is a topology on $X$. $\blacksquare$

---

## Exercise 3.3

### Setup and Definitions

**Setting.** $X$ is any set and $A \subseteq X$ is a fixed subset.

**Definition 3.7 (Coarser/finer).** Given two topologies $\mathcal{T}_1, \mathcal{T}_2$ on $X$, we say $\mathcal{T}_1$ is _coarser_ than $\mathcal{T}_2$ (and $\mathcal{T}_2$ is _finer_ than $\mathcal{T}_1$) if $\mathcal{T}_1 \subseteq \mathcal{T}_2$.

**What the exercise asks.** We must find the topology $\mathcal{T}_A$ on $X$ that (i) contains $A$ as an open set, and (ii) is contained in every other topology with this property — i.e., is the _minimum_ element, under inclusion, of all topologies making $A$ open.

**Necessary constraints.** Any topology $\mathcal{T}$ on $X$ with $A \in \mathcal{T}$ must satisfy:

- By T1: $\emptyset, X \in \mathcal{T}$.
- By assumption: $A \in \mathcal{T}$.

So $\{\emptyset, A, X\} \subseteq \mathcal{T}$ is necessary for any such topology.

---

**Proof.** _We show $\mathcal{T}_A = \{\emptyset, A, X\}$ is the coarsest topology on $X$ in which $A$ is open._

**Step 1 [Candidate].** Define $\mathcal{T}_A = \{\emptyset, A, X\}$.

**Step 2 [Verify $\mathcal{T}_A$ is a topology].**

**T1:** $\emptyset, X \in \mathcal{T}_A$ by definition. ✓

**T2:** The only non-trivial unions are $\emptyset \cup A = A$, $\emptyset \cup X = X$, $A \cup X = X$, all in $\mathcal{T}_A$. ✓

**T3:** The only non-trivial intersections are $A \cap X = A$, $\emptyset \cap A = \emptyset$, $\emptyset \cap X = \emptyset$, all in $\mathcal{T}_A$. ✓

Thus $\mathcal{T}_A$ is a topology, and $A \in \mathcal{T}_A$ as required.

**Step 3 [Coarseness].** Let $\mathcal{T}$ be any topology on $X$ with $A \in \mathcal{T}$. By T1, $\emptyset, X \in \mathcal{T}$. By assumption, $A \in \mathcal{T}$. Therefore

$$\mathcal{T}_A = \{\emptyset, A, X\} \subseteq \mathcal{T}.$$

By Definition 3.7, $\mathcal{T}_A$ is coarser than $\mathcal{T}$. Since $\mathcal{T}$ was arbitrary, $\mathcal{T}_A$ is coarser than _every_ topology in which $A$ is open.

**Conclusion.** The coarsest topology on $X$ such that $A$ is open is $\mathcal{T}_A = \{\emptyset, A, X\}$. $\blacksquare$

_Remark._ The three-element collection $\{\emptyset, A, X\}$ is sometimes called the **Sierpiński topology** generated by $A$. The special case $X = \{0,1\}$, $A = \{1\}$ is the classical Sierpiński space.

---

## Exercise 3.4

### Setup and Definitions

**Setting.** $X$ is any set.

**Definition 3.4 (Discrete topology).** $\mathcal{T}_{\mathrm{disc}} = \mathcal{P}(X)$, the collection of all subsets of $X$.

**Example 3.8 (Cofinite topology).**

$$\mathcal{T}_{\mathrm{cof}} = \{U \subseteq X \mid X \setminus U \text{ is finite}\} \cup \{\emptyset\}.$$

A set $U$ is open in the cofinite topology iff $U = \emptyset$ or $X \setminus U$ is finite.

**Definition 3.7 (Finer topology).** $\mathcal{T}_{\mathrm{disc}}$ is finer than $\mathcal{T}_{\mathrm{cof}}$ iff $\mathcal{T}_{\mathrm{cof}} \subseteq \mathcal{T}_{\mathrm{disc}}$.

**Goal.** Show $\mathcal{T}_{\mathrm{cof}} \subseteq \mathcal{T}_{\mathrm{disc}}$, i.e., every set open in the cofinite topology is also open in the discrete topology.

---

**Proof.**

**Step 1 [Element-wise containment].** Let $U \in \mathcal{T}_{\mathrm{cof}}$ be arbitrary. By definition of $\mathcal{T}_{\mathrm{cof}}$, $U$ is a subset of $X$. By definition of $\mathcal{T}_{\mathrm{disc}} = \mathcal{P}(X)$, every subset of $X$ is in $\mathcal{T}_{\mathrm{disc}}$. Hence $U \in \mathcal{T}_{\mathrm{disc}}$.

Since $U \in \mathcal{T}_{\mathrm{cof}}$ was arbitrary, $\mathcal{T}_{\mathrm{cof}} \subseteq \mathcal{T}_{\mathrm{disc}}$.

**Step 2 [Strictness when $X$ is infinite].** When $X$ is infinite, the singleton $\{x_0\} \in \mathcal{T}_{\mathrm{disc}}$ for any $x_0 \in X$, but $X \setminus \{x_0\}$ is infinite, so $\{x_0\} \notin \mathcal{T}_{\mathrm{cof}}$. Thus $\mathcal{T}_{\mathrm{cof}} \subsetneq \mathcal{T}_{\mathrm{disc}}$ when $X$ is infinite. When $X$ is finite, every subset has finite complement, so $\mathcal{T}_{\mathrm{cof}} = \mathcal{T}_{\mathrm{disc}}$, as noted in Example 3.8.

**Conclusion.** For any set $X$, $\mathcal{T}_{\mathrm{cof}} \subseteq \mathcal{T}_{\mathrm{disc}}$, so the discrete topology is finer than the cofinite topology. $\blacksquare$

---

## Exercise 3.5

### Setup and Definitions

**Setting.** $X = \{a, b, c, d\}$.

**Definition 3.19 (Homeomorphism).** A bijection $f \colon (X, \mathcal{T}_1) \to (X, \mathcal{T}_2)$ is a _homeomorphism_ if both $f$ and $f^{-1}$ are continuous. Continuity of $f$ means: for every $V \in \mathcal{T}_2$, the preimage $f^{-1}(V) \in \mathcal{T}_1$.

**Definition 3.11 (Continuous map).** $f \colon X \to Y$ is continuous if $f^{-1}(V)$ is open in $X$ for every open $V$ in $Y$.

**Strategy.** We will construct $\mathcal{T}_1$ and $\mathcal{T}_2$ by choosing a bijection $f \colon X \to X$ first, then defining $\mathcal{T}_2$ as the _pushforward_ of $\mathcal{T}_1$ along $f$: $\mathcal{T}_2 = \{f(U) \mid U \in \mathcal{T}_1\}$. This guarantees $f$ is a homeomorphism by construction, and $\mathcal{T}_1 \neq \mathcal{T}_2$ iff $f$ is not a topological automorphism of $\mathcal{T}_1$.

**Assumption.** We choose $f$ to be the transposition $a \leftrightarrow b$ (fixing $c$ and $d$), and $\mathcal{T}_1$ an asymmetric topology distinguishing $a$ from $b$.

---

**Proof.** _We exhibit explicit $\mathcal{T}_1$, $\mathcal{T}_2$, and verify all conditions._

**Step 1 [Define $f$ and $\mathcal{T}_1$].** Let $f \colon X \to X$ be

$$f(a) = b,\quad f(b) = a,\quad f(c) = c,\quad f(d) = d,$$

so $f = f^{-1}$ (it is an involution). Let

$$\mathcal{T}_1 = \{\emptyset,\, \{a\},\, \{a,c\},\, \{a,b,c\},\, X\}.$$

**Step 2 [Define $\mathcal{T}_2$].** Apply $f$ to each member of $\mathcal{T}_1$:

$$\mathcal{T}_2 = \{\emptyset,\, \{b\},\, \{b,c\},\, \{a,b,c\},\, X\}.$$

Since $\{a\} \in \mathcal{T}_1$ but $\{a\} \notin \mathcal{T}_2$, and $\{b\} \in \mathcal{T}_2$ but $\{b\} \notin \mathcal{T}_1$, we have $\mathcal{T}_1 \neq \mathcal{T}_2$.

**Step 3 [Verify $\mathcal{T}_1$ is a topology].**

_T1:_ $\emptyset, X \in \mathcal{T}_1$. ✓

_T2:_ $\{a\} \cup \{a,c\} = \{a,c\}$; $\{a\} \cup \{a,b,c\} = \{a,b,c\}$; $\{a,c\} \cup \{a,b,c\} = \{a,b,c\}$. All in $\mathcal{T}_1$. ✓

_T3:_ $\{a,c\} \cap \{a,b,c\} = \{a,c\}$; $\{a\} \cap \{a,c\} = \{a\}$; $\{a\} \cap \{a,b,c\} = \{a\}$. All in $\mathcal{T}_1$. ✓

**Step 4 [Verify $\mathcal{T}_2$ is a topology].** By identical reasoning with $a$ and $b$ swapped, $\mathcal{T}_2$ satisfies T1–T3. ✓

**Step 5 [Verify $f \colon (X,\mathcal{T}_1) \to (X,\mathcal{T}_2)$ is continuous].** We compute $f^{-1}(V)$ for each $V \in \mathcal{T}_2$ (using $f^{-1} = f$):

$$f^{-1}(\emptyset) = \emptyset \in \mathcal{T}_1, \quad f^{-1}(\{b\}) = \{a\} \in \mathcal{T}_1,$$
$$f^{-1}(\{b,c\}) = \{a,c\} \in \mathcal{T}_1, \quad f^{-1}(\{a,b,c\}) = \{a,b,c\} \in \mathcal{T}_1, \quad f^{-1}(X) = X \in \mathcal{T}_1.$$

All preimages lie in $\mathcal{T}_1$, so $f$ is continuous. ✓

**Step 6 [Verify $f^{-1} = f \colon (X,\mathcal{T}_2) \to (X,\mathcal{T}_1)$ is continuous].** By the identical computation with $\mathcal{T}_1$ and $\mathcal{T}_2$ exchanged, all preimages under $f$ of elements of $\mathcal{T}_1$ lie in $\mathcal{T}_2$. ✓

**Conclusion.** $f$ is a bijection with both $f$ and $f^{-1}$ continuous, hence a homeomorphism $(X, \mathcal{T}_1) \xrightarrow{\sim} (X, \mathcal{T}_2)$ by Definition 3.19, and $\mathcal{T}_1 \neq \mathcal{T}_2$. $\blacksquare$

---

## Exercise 3.6

### Setup and Definitions

**Setting.** $(X, \mathcal{T})$ is a topological space and $A, B \subseteq X$.

**Definition 3.24 (Closed set).** $K \subseteq X$ is _closed_ iff $X \setminus K \in \mathcal{T}$ (its complement is open).

**Definition 3.29 (Closure).** The _closure_ of $A$, written $\overline{A}$, is

$$\overline{A} = \bigcap \{C \subseteq X \mid A \subseteq C,\; C \text{ is closed in } X\}.$$

It is the smallest closed set containing $A$. In particular: $A \subseteq \overline{A}$, and $\overline{A}$ is closed.

**Theorem 3.28(3)** (used in part (b)). The union of finitely many closed sets is closed.

---

### Part (a): $A \subseteq B \Rightarrow \overline{A} \subseteq \overline{B}$

**Proof.** _We show every closed set witnessing $\overline{B}$ also witnesses $\overline{A}$._

Let $C$ be any closed subset of $X$ with $B \subseteq C$. Since $A \subseteq B$ by hypothesis and $B \subseteq C$, we have $A \subseteq C$. Thus $C$ appears in the family over which $\overline{A}$ is defined, so $\overline{A} \subseteq C$.

This holds for every closed $C \supseteq B$. Taking the intersection over all such $C$:

$$\overline{A} \;\subseteq\; \bigcap_{\substack{C \text{ closed}\\ B \subseteq C}} C \;=\; \overline{B}.$$

$\blacksquare$

---

### Part (b): $\overline{A \cup B} = \overline{A} \cup \overline{B}$

**Proof.** _We prove both inclusions separately._

**($\supseteq$)**

Since $A \subseteq A \cup B$, part (a) gives $\overline{A} \subseteq \overline{A \cup B}$.

Since $B \subseteq A \cup B$, part (a) gives $\overline{B} \subseteq \overline{A \cup B}$.

Taking the union of both:

$$\overline{A} \cup \overline{B} \;\subseteq\; \overline{A \cup B}.$$

**($\subseteq$)**

We exhibit a closed set containing $A \cup B$ that is contained in $\overline{A} \cup \overline{B}$, then appeal to minimality of $\overline{A \cup B}$.

$\overline{A}$ is closed and $\overline{B}$ is closed (by Definition 3.29). By Theorem 3.28(3), their union $\overline{A} \cup \overline{B}$ is closed.

Moreover, $A \subseteq \overline{A}$ and $B \subseteq \overline{B}$ imply

$$A \cup B \;\subseteq\; \overline{A} \cup \overline{B}.$$

So $\overline{A} \cup \overline{B}$ is a closed set containing $A \cup B$. Since $\overline{A \cup B}$ is the _smallest_ such set (Definition 3.29):

$$\overline{A \cup B} \;\subseteq\; \overline{A} \cup \overline{B}.$$

**Conclusion.** Both inclusions hold, so $\overline{A \cup B} = \overline{A} \cup \overline{B}$. $\blacksquare$

---

## Exercise 3.7

### Setup and Definitions

**Setting.** $(X, \mathcal{T})$ is a topological space and $A \subseteq X$.

**Definition 3.9 (Neighbourhood).** $U \subseteq X$ is a _neighbourhood_ of $x \in X$ if $x \in U$ and $U \in \mathcal{T}$ (i.e., $U$ is open).

**Definition 3.29 (Closure).** $\overline{A} = \bigcap\{C \mid A \subseteq C,\; C \text{ closed}\}$, the smallest closed set containing $A$.

**Definition 3.24.** $C$ is closed iff $X \setminus C$ is open.

**Key equivalence used in the proof.** Unwinding definitions:

$$x \notin \overline{A} \iff \exists \text{ closed } C \supseteq A \text{ with } x \notin C \iff \exists \text{ open } U \ni x \text{ with } U \cap A = \emptyset,$$

where in the last step we set $U = X \setminus C$ (which is open, contains $x$, and is disjoint from $A$ since $A \subseteq C$).

**Goal.** Prove: $x \in \overline{A} \iff \forall$ neighbourhoods $U$ of $x$, $U \cap A \neq \emptyset$.

---

**Proof.** _We prove the contrapositive of each direction._

**($\Rightarrow$): Contrapositive.** Assume there exists a neighbourhood $U$ of $x$ with $U \cap A = \emptyset$.

Since $U$ is open and $U \cap A = \emptyset$, we have $A \subseteq X \setminus U$. The set $X \setminus U$ is closed (as the complement of the open set $U$) and contains $A$. Since $x \in U$, we have $x \notin X \setminus U$. Because $\overline{A}$ is the _smallest_ closed set containing $A$ and $X \setminus U$ is one such closed set:

$$\overline{A} \subseteq X \setminus U,$$

and since $x \notin X \setminus U$, it follows $x \notin \overline{A}$.

**($\Leftarrow$): Contrapositive.** Assume $x \notin \overline{A}$.

By Definition 3.29, $\overline{A} = \bigcap\{C \mid A \subseteq C,\; C \text{ closed}\}$. Since $x$ does not belong to this intersection, there exists a closed set $C \supseteq A$ with $x \notin C$.

Set $U = X \setminus C$. Then:

- $U$ is open (complement of the closed set $C$),
- $x \in U$ (since $x \notin C$),

so $U$ is a neighbourhood of $x$ by Definition 3.9. Moreover

$$U \cap A = (X \setminus C) \cap A \subseteq (X \setminus C) \cap C = \emptyset,$$

so $U$ is a neighbourhood of $x$ that does not meet $A$.

**Conclusion.** By contrapositive on both sides, $x \in \overline{A}$ if and only if every neighbourhood of $x$ intersects $A$. $\blacksquare$

---

## Exercise 3.8

### Setup and Definitions

**Setting.** $X = \{a, b, c, d, e\}$ with topology

$$\mathcal{T} = \{\emptyset,\; \{b\},\; \{d,e\},\; \{a,b\},\; \{b,c\},\; \{b,d,e\},\; \{a,b,c\},\; \{a,b,d,e\},\; \{b,c,d,e\},\; X\}.$$

The subset of interest is $S = \{a, b\}$.

**Definition 3.32 (Dense).** $A \subseteq X$ is _dense_ in $X$ if $\overline{A} = X$.

**Equivalent characterisation** (from the notes, following Definition 3.32). $A$ is dense in $X$ iff every non-empty open set $U \in \mathcal{T}$ satisfies $U \cap A \neq \emptyset$.

**Definition 3.29 (Closure).** $\overline{S}$ is the intersection of all closed sets containing $S$.

**Definition 3.24 (Closed sets).** $K$ is closed iff $X \setminus K$ is open, i.e., $X \setminus K \in \mathcal{T}$.

**Plan.** We compute all closed sets by complementing every element of $\mathcal{T}$, identify those that contain $S$, and intersect them to find $\overline{S}$.

---

**Proof.**

**Step 1 [Enumerate all closed sets].** For each $U \in \mathcal{T}$, the set $X \setminus U$ is closed:

| Open set $U \in \mathcal{T}$ | Closed set $X \setminus U$ |
| ---------------------------- | -------------------------- |
| $\emptyset$                  | $X = \{a,b,c,d,e\}$        |
| $\{b\}$                      | $\{a,c,d,e\}$              |
| $\{d,e\}$                    | $\{a,b,c\}$                |
| $\{a,b\}$                    | $\{c,d,e\}$                |
| $\{b,c\}$                    | $\{a,d,e\}$                |
| $\{b,d,e\}$                  | $\{a,c\}$                  |
| $\{a,b,c\}$                  | $\{d,e\}$                  |
| $\{a,b,d,e\}$                | $\{c\}$                    |
| $\{b,c,d,e\}$                | $\{a\}$                    |
| $X$                          | $\emptyset$                |

**Step 2 [Identify closed sets containing $S = \{a,b\}$].** A closed set $C$ contains $S$ iff $a \in C$ and $b \in C$. Checking each closed set:

| Closed set $C$ | $a \in C$? | $b \in C$? | $S \subseteq C$? |
| -------------- | ---------- | ---------- | ---------------- |
| $X$            | ✓          | ✓          | **Yes**          |
| $\{a,c,d,e\}$  | ✓          | ✗          | No               |
| $\{a,b,c\}$    | ✓          | ✓          | **Yes**          |
| $\{c,d,e\}$    | ✗          | ✗          | No               |
| $\{a,d,e\}$    | ✓          | ✗          | No               |
| $\{a,c\}$      | ✓          | ✗          | No               |
| $\{d,e\}$      | ✗          | ✗          | No               |
| $\{c\}$        | ✗          | ✗          | No               |
| $\{a\}$        | ✓          | ✗          | No               |
| $\emptyset$    | ✗          | ✗          | No               |

The closed sets containing $S$ are exactly $\{a,b,c\}$ and $X$.

**Step 3 [Compute $\overline{S}$].** By Definition 3.29,

$$\overline{S} = \{a,b,c\} \cap X = \{a,b,c\}.$$

**Step 4 [Density check].** We have $\overline{S} = \{a,b,c\} \neq X$. By Definition 3.32, $S$ is dense iff $\overline{S} = X$. This fails.

**Step 5 [Explicit witness via the equivalent characterisation].** The non-empty open set $\{d,e\} \in \mathcal{T}$ satisfies

$$\{d,e\} \cap \{a,b\} = \emptyset,$$

confirming directly that $S$ does not meet every non-empty open set, hence is not dense.

**Conclusion.** $\overline{\{a,b\}} = \{a,b,c\} \subsetneq X$, so the subset $\{a,b\}$ is **not** dense in $X$. $\blacksquare$

# Chapter 4 — Exercises: Complete Solutions

---

## Exercise 4.1

### Setup

**Space.** $X = \{a, b, c, d, e\}$.

**Given topology.**

$$\mathcal{T} = \bigl\{\emptyset,\; \{b\},\; \{d,e\},\; \{a,b\},\; \{b,d,e\},\; \{b,c,d,e\},\; \{a,b,d,e\},\; \{c,d,e\},\; X\bigr\}.$$

### Definitions

**Definition 4.12 (Subbasis).** A collection \( \mathcal{S} \) of subsets of \( X \) is a _subbasis_ for a topology on \( X \) if \( \bigcup\_{S \in \mathcal{S}} S = X \).

**Definition 4.6 (Basis).** A collection $\mathcal{B}$ is a _basis_ for a topology on $X$ if: **(B1)** every $x \in X$ belongs to some $B \in \mathcal{B}$; **(B2)** if $B_1, B_2 \in \mathcal{B}$ and $x \in B_1 \cap B_2$, then some $B_3 \in \mathcal{B}$ satisfies $x \in B_3 \subseteq B_1 \cap B_2$.

**Lemma 4.13.** Given a subbasis $\mathcal{S}$, the collection $\mathcal{B}_\mathcal{S}$ of all finite intersections of elements of $\mathcal{S}$ is a basis. It is called the _basis associated to $\mathcal{S}$_.

**Theorem 4.10.** The topology $\mathcal{T}_\mathcal{B}$ generated by a basis $\mathcal{B}$ equals the collection of all unions of elements of $\mathcal{B}$.

**Subbasis for $\mathcal{T}$.** $\mathcal{S}$ is a subbasis _for $\mathcal{T}$_ if $\mathcal{S}$ is a subbasis and the topology generated by $\mathcal{S}$ equals $\mathcal{T}$.

### What to Show

**(Part 1.)** $\mathcal{S} = \bigl\{\{a,b\},\; \{b,d,e\},\; \{c,d,e\}\bigr\}$ is a subbasis for $\mathcal{T}$.

That is, show:
$$\bigcup_{S \in \mathcal{S}} S = X \qquad \text{and} \qquad \langle \mathcal{S} \rangle = \mathcal{T}.$$

**(Part 2.)** $\mathcal{S}' = \bigl\{\{a,b\},\; \{b,c,d,e\},\; \{d,e\}\bigr\}$ is **not** a subbasis for $\mathcal{T}$.

That is, show $\langle \mathcal{S}' \rangle \neq \mathcal{T}$.

---

### Proof — Part 1

**Step 1 [Union covers $X$].**

$$\{a,b\} \cup \{b,d,e\} \cup \{c,d,e\} = \{a,b,c,d,e\} = X.$$

So $\mathcal{S}$ satisfies Definition 4.12. ✓

**Step 2 [Compute the associated basis $\mathcal{B}_\mathcal{S}$].**

By Lemma 4.13, we take all finite intersections of elements of $\mathcal{S}$. Writing $S_1 = \{a,b\}$, $S_2 = \{b,d,e\}$, $S_3 = \{c,d,e\}$:

| Intersection            | Value                              |
| ----------------------- | ---------------------------------- |
| $S_1$                   | $\{a,b\}$                          |
| $S_2$                   | $\{b,d,e\}$                        |
| $S_3$                   | $\{c,d,e\}$                        |
| $S_1 \cap S_2$          | $\{b\}$                            |
| $S_1 \cap S_3$          | $\emptyset$                        |
| $S_2 \cap S_3$          | $\{d,e\}$                          |
| $S_1 \cap S_2 \cap S_3$ | $\{b\} \cap \{c,d,e\} = \emptyset$ |

Discarding $\emptyset$ (it is covered as a trivial open set by T1), the non-empty basis elements are

$$\mathcal{B}_\mathcal{S} = \bigl\{\{a,b\},\; \{b,d,e\},\; \{c,d,e\},\; \{b\},\; \{d,e\}\bigr\}.$$

**Step 3 [Compute $\langle \mathcal{S} \rangle$ as all unions of basis elements].**

By Theorem 4.10, $\langle \mathcal{S} \rangle$ consists of $\emptyset$, $X$, and all non-empty unions of elements of $\mathcal{B}_\mathcal{S}$. We enumerate:

| Union of elements from $\mathcal{B}_\mathcal{S}$ | Result                       |
| ------------------------------------------------ | ---------------------------- |
| $\{b\}$                                          | $\{b\}$                      |
| $\{d,e\}$                                        | $\{d,e\}$                    |
| $\{a,b\}$                                        | $\{a,b\}$                    |
| $\{b,d,e\}$                                      | $\{b,d,e\}$                  |
| $\{c,d,e\}$                                      | $\{c,d,e\}$                  |
| $\{b\} \cup \{d,e\}$                             | $\{b,d,e\}$ (already listed) |
| $\{b\} \cup \{c,d,e\}$                           | $\{b,c,d,e\}$                |
| $\{d,e\} \cup \{a,b\}$                           | $\{a,b,d,e\}$                |
| $\{a,b\} \cup \{b,d,e\}$                         | $\{a,b,d,e\}$ (same)         |
| $\{a,b\} \cup \{c,d,e\}$                         | $\{a,b,c,d,e\} = X$          |
| $\{b,d,e\} \cup \{c,d,e\}$                       | $\{b,c,d,e\}$ (same)         |
| All three generating elements                    | $X$                          |

Collecting with $\emptyset$ and $X$:

$$\langle \mathcal{S} \rangle = \bigl\{\emptyset,\; \{b\},\; \{d,e\},\; \{a,b\},\; \{b,d,e\},\; \{c,d,e\},\; \{b,c,d,e\},\; \{a,b,d,e\},\; X\bigr\} = \mathcal{T}.$$

Therefore $\mathcal{S}$ is a subbasis for $\mathcal{T}$. $\square$

---

### Proof — Part 2

**Step 1 [Union covers $X$].**

$$\{a,b\} \cup \{b,c,d,e\} \cup \{d,e\} = X.$$

So $\mathcal{S}'$ is a subbasis for _some_ topology. The question is whether it generates $\mathcal{T}$.

**Step 2 [Compute the associated basis $\mathcal{B}_{\mathcal{S}'}$].**

Write $T_1 = \{a,b\}$, $T_2 = \{b,c,d,e\}$, $T_3 = \{d,e\}$:

| Intersection            | Value                     |
| ----------------------- | ------------------------- |
| $T_1$                   | $\{a,b\}$                 |
| $T_2$                   | $\{b,c,d,e\}$             |
| $T_3$                   | $\{d,e\}$                 |
| $T_1 \cap T_2$          | $\{b\}$                   |
| $T_1 \cap T_3$          | $\emptyset$               |
| $T_2 \cap T_3$          | $\{d,e\}$ (same as $T_3$) |
| $T_1 \cap T_2 \cap T_3$ | $\emptyset$               |

Non-empty basis elements: $\mathcal{B}_{\mathcal{S}'} = \bigl\{\{a,b\},\; \{b,c,d,e\},\; \{d,e\},\; \{b\}\bigr\}$.

**Step 3 [Compute $\langle \mathcal{S}' \rangle$].**

All non-empty unions:

| Union                      | Result        |
| -------------------------- | ------------- |
| $\{b\}$                    | $\{b\}$       |
| $\{d,e\}$                  | $\{d,e\}$     |
| $\{a,b\}$                  | $\{a,b\}$     |
| $\{b,c,d,e\}$              | $\{b,c,d,e\}$ |
| $\{b\} \cup \{d,e\}$       | $\{b,d,e\}$   |
| $\{b\} \cup \{b,c,d,e\}$   | $\{b,c,d,e\}$ |
| $\{d,e\} \cup \{a,b\}$     | $\{a,b,d,e\}$ |
| $\{d,e\} \cup \{b,c,d,e\}$ | $\{b,c,d,e\}$ |
| $\{a,b\} \cup \{b,c,d,e\}$ | $X$           |
| $\{a,b\} \cup \{b\}$       | $\{a,b\}$     |
| Larger combinations        | $X$           |

So $\langle \mathcal{S}' \rangle = \bigl\{\emptyset,\; \{b\},\; \{d,e\},\; \{a,b\},\; \{b,d,e\},\; \{b,c,d,e\},\; \{a,b,d,e\},\; X\bigr\}$.

**Step 4 [Compare with $\mathcal{T}$].**

The set $\{c,d,e\} \in \mathcal{T}$ but $\{c,d,e\} \notin \langle \mathcal{S}' \rangle$ (it does not appear in the table above, and every union of elements of $\mathcal{B}_{\mathcal{S}'}$ that contains $c$ must also contain $b$, since $c$ only appears in $T_2 = \{b,c,d,e\}$).

Therefore $\langle \mathcal{S}' \rangle \neq \mathcal{T}$, and $\mathcal{S}'$ is **not** a subbasis for $\mathcal{T}$. $\blacksquare$

---

## Exercise 4.2

### Setup

**Space.** $\mathbb{R}$ with the absolute-value metric $d(x,y) = |x - y|$.

**Candidate collection.**

$$\mathcal{B} = \bigl\{(a,b) \;\big|\; a, b \in \mathbb{R},\; a < b\bigr\}, \quad \text{where } (a,b) = \{x \in \mathbb{R} \mid a < x < b\}.$$

### Definitions

**Definition 4.6 (Basis).** See Exercise 4.1.

**Theorem 3.2 / Theorem 3.3.** The metric topology $\mathcal{T}_d$ consists of all sets $U$ such that for every $x \in U$ there exists $r > 0$ with the open ball $B(x;r) = \{y \in \mathbb{R} \mid |x - y| < r\} \subseteq U$.

**Theorem 4.10.** A topology generated by basis $\mathcal{B}$ consists of all unions of elements of $\mathcal{B}$.

**Theorem 4.11.** Given bases $\mathcal{B}_1, \mathcal{B}_2$ generating topologies $\mathcal{T}_1, \mathcal{T}_2$, we have $\mathcal{T}_1 \subseteq \mathcal{T}_2$ iff for every $B_1 \in \mathcal{B}_1$ and every $x \in B_1$, there exists $B_2 \in \mathcal{B}_2$ with $x \in B_2 \subseteq B_1$.

### What to Show

**(a)** $\mathcal{B}$ satisfies B1 and B2, hence is a basis for a topology $\mathcal{T}_{\mathrm{std}}$ on $\mathbb{R}$.

**(b)** The standard topology and the metric topology coincide: $\mathcal{T}_{\mathrm{std}} = \mathcal{T}_d$.

That is:

$$\forall\, U \in \mathcal{T}_{\mathrm{std}}: U \in \mathcal{T}_d, \qquad \text{and} \qquad \forall\, U \in \mathcal{T}_d: U \in \mathcal{T}_{\mathrm{std}}.$$

---

### Proof — Part (a)

**B1:** Let $x \in \mathbb{R}$. Then $(x - 1, x + 1) \in \mathcal{B}$ and $x \in (x-1, x+1)$. ✓

**B2:** Let $(a,b), (c,d) \in \mathcal{B}$ and let $x \in (a,b) \cap (c,d)$. Then

$$\max(a,c) < x < \min(b,d),$$

since $x > a$, $x > c$ gives $x > \max(a,c)$, and $x < b$, $x < d$ gives $x < \min(b,d)$.

Set $B_3 = \bigl(\max(a,c),\, \min(b,d)\bigr)$. This is a non-empty open interval (since $\max(a,c) < x < \min(b,d)$), so $B_3 \in \mathcal{B}$. By construction, $x \in B_3$ and

$$B_3 = (\max(a,c), \min(b,d)) = (a,b) \cap (c,d).$$

So $B_3 \subseteq (a,b) \cap (c,d)$. ✓

Both axioms hold, so $\mathcal{B}$ is a basis. The topology it generates is called $\mathcal{T}_{\mathrm{std}}$. $\square$

---

### Proof — Part (b)

The metric $d(x,y) = |x-y|$ has open balls $B(x;r) = (x-r, x+r)$. Let $\mathcal{B}_d = \{B(x;r) \mid x \in \mathbb{R},\, r > 0\}$ be the standard basis for $\mathcal{T}_d$ (Example 4.8 of the notes).

We apply Theorem 4.11 in both directions.

**Step 1 [$\mathcal{T}_{\mathrm{std}} \subseteq \mathcal{T}_d$].**

Let $(a,b) \in \mathcal{B}$ and let $x \in (a,b)$. Set $r = \min(x - a,\, b - x) > 0$. Then

$$B(x; r) = (x - r, x + r) \subseteq (a, b),$$

because $x - r \geq a$ (since $r \leq x - a$) and $x + r \leq b$ (since $r \leq b - x$). Moreover $B(x;r) \in \mathcal{B}_d$ and $x \in B(x;r)$.

By Theorem 4.11, $\mathcal{T}_{\mathrm{std}} \subseteq \mathcal{T}_d$.

**Step 2 [$\mathcal{T}_d \subseteq \mathcal{T}_{\mathrm{std}}$].**

Let $B(x;r) \in \mathcal{B}_d$ and let $y \in B(x;r)$. Then $B(x;r) = (x-r, x+r) \in \mathcal{B}$, and trivially $y \in (x-r, x+r) \subseteq B(x;r)$.

By Theorem 4.11, $\mathcal{T}_d \subseteq \mathcal{T}_{\mathrm{std}}$.

**Conclusion.** $\mathcal{T}_{\mathrm{std}} = \mathcal{T}_d$. $\blacksquare$

---

## Exercise 4.3

### Setup

**Space.** $\mathbb{R}$ with the standard topology $\mathcal{T}_{\mathrm{std}}$ generated by open intervals (Exercise 4.2).

**Candidate subbasis.**

$$\mathcal{S} = \bigl\{(a, \infty) \;\big|\; a \in \mathbb{R}\bigr\} \;\cup\; \bigl\{(-\infty, b) \;\big|\; b \in \mathbb{R}\bigr\}.$$

### Definitions

**Definition 4.12 (Subbasis).** $\mathcal{S}$ is a subbasis for a topology on $X$ if $\bigcup_{S \in \mathcal{S}} S = X$.

**Lemma 4.13.** The basis $\mathcal{B}_\mathcal{S}$ associated to $\mathcal{S}$ consists of all finite intersections of elements of $\mathcal{S}$.

**Theorem 4.10.** The topology generated by a basis = all unions of its elements.

**Theorem 4.11.** Comparison criterion for topologies generated by bases.

### What to Show

$$\langle \mathcal{S} \rangle = \mathcal{T}_{\mathrm{std}}.$$

Equivalently: the basis $\mathcal{B}_\mathcal{S}$ associated to $\mathcal{S}$ generates the same topology as $\mathcal{B} = \{(a,b) \mid a < b\}$.

---

### Proof

**Step 1 [Union covers $\mathbb{R}$].**

For any $x \in \mathbb{R}$, $x \in (x - 1, \infty) \in \mathcal{S}$. Hence $\bigcup_{S \in \mathcal{S}} S = \mathbb{R}$, confirming $\mathcal{S}$ is a subbasis. ✓

**Step 2 [Compute $\mathcal{B}_\mathcal{S}$].**

All finite intersections of elements of $\mathcal{S}$. The possible types are:

- Single ray: $(a, \infty)$ or $(-\infty, b)$.
- Intersection of two rays of the same type: $(a_1, \infty) \cap (a_2, \infty) = (\max(a_1, a_2), \infty)$; similarly for $(-\infty, \cdot)$. These reduce to single rays.
- Intersection of opposite rays: $(a, \infty) \cap (-\infty, b)$.
  - If $a < b$: result is $(a, b)$, an open interval. $(a,b) \in \mathcal{B}$.
  - If $a \geq b$: result is $\emptyset$.
- Any longer intersection further reduces to one of the above cases.

So the non-empty elements of $\mathcal{B}_\mathcal{S}$ are: all open intervals $(a, b)$ with $a < b$, and all rays $(a, \infty)$, $(-\infty, b)$.

In particular, $\mathcal{B} = \{(a,b) \mid a < b\} \subseteq \mathcal{B}_\mathcal{S}$.

**Step 3 [$\langle \mathcal{S} \rangle \subseteq \mathcal{T}_{\mathrm{std}}$].**

It suffices to show every element of $\mathcal{B}_\mathcal{S}$ is open in $\mathcal{T}_{\mathrm{std}}$ (then unions of them are too, by T2).

Every $(a,b) \in \mathcal{B}_\mathcal{S}$ is open in $\mathcal{T}_{\mathrm{std}}$ by definition (it is a basis element of $\mathcal{B}$).

For rays: $(a, \infty) = \bigcup_{n=1}^\infty (a,\, a + n)$, a union of open intervals, hence open in $\mathcal{T}_{\mathrm{std}}$. Similarly $(-\infty, b) = \bigcup_{n=1}^\infty (b - n,\, b)$, open in $\mathcal{T}_{\mathrm{std}}$.

So every element of $\mathcal{B}_\mathcal{S}$ is in $\mathcal{T}_{\mathrm{std}}$, giving $\langle \mathcal{S} \rangle \subseteq \mathcal{T}_{\mathrm{std}}$.

**Step 4 [$\mathcal{T}_{\mathrm{std}} \subseteq \langle \mathcal{S} \rangle$].**

Every open interval $(a, b) \in \mathcal{B}$ is already in $\mathcal{B}_\mathcal{S}$ (from Step 2), hence in $\langle \mathcal{S} \rangle$. By Theorem 4.10, every element of $\mathcal{T}_{\mathrm{std}}$ is a union of open intervals, hence a union of elements of $\mathcal{B}_\mathcal{S}$, hence in $\langle \mathcal{S} \rangle$.

**Conclusion.** $\langle \mathcal{S} \rangle = \mathcal{T}_{\mathrm{std}}$, so $\mathcal{S}$ is a subbasis for the standard topology on $\mathbb{R}$. $\blacksquare$

---

## Exercise 4.4

### Setup

**Space.** $\mathbb{R}$ with the standard topology $\mathcal{T}_{\mathrm{std}}$.

**Candidate collection.**

$$\mathcal{B}_\mathbb{Q} = \bigl\{(a, b) \;\big|\; a, b \in \mathbb{Q},\; a < b\bigr\}, \quad \text{where } (a,b) = \{x \in \mathbb{R} \mid a < x < b\}.$$

### Definitions

**Definition 4.6 (Basis).** As before.

**Density of $\mathbb{Q}$ in $\mathbb{R}$.** For any $a < b$ in $\mathbb{R}$, there exist $p, q \in \mathbb{Q}$ with $a \leq p < q \leq b$ (Archimedean property / density of rationals).

**Theorem 4.11.** Comparison criterion for topologies from bases.

### What to Show

First that $\mathcal{B}_\mathbb{Q}$ is a basis for a topology on $\mathbb{R}$, and then that it generates $\mathcal{T}_{\mathrm{std}}$:

$$\mathcal{T}_{\mathrm{std}} = \mathcal{T}_{\mathcal{B}_\mathbb{Q}} \quad\text{(same topology)}.$$

---

### Proof

**Part 1: $\mathcal{B}_\mathbb{Q}$ is a basis.**

**B1:** Let $x \in \mathbb{R}$. Choose any $a, b \in \mathbb{Q}$ with $a < x < b$ (possible by density of $\mathbb{Q}$ in $\mathbb{R}$). Then $(a,b) \in \mathcal{B}_\mathbb{Q}$ and $x \in (a,b)$. ✓

**B2:** Let $(a,b), (c,d) \in \mathcal{B}_\mathbb{Q}$ with $a,b,c,d \in \mathbb{Q}$, and let $x \in (a,b) \cap (c,d)$. Then

$$(a,b) \cap (c,d) = \bigl(\max(a,c),\, \min(b,d)\bigr).$$

Since $a,b,c,d \in \mathbb{Q}$, we have $\max(a,c), \min(b,d) \in \mathbb{Q}$, and $\max(a,c) < x < \min(b,d)$, so $\max(a,c) < \min(b,d)$. Thus $B_3 = (\max(a,c), \min(b,d)) \in \mathcal{B}_\mathbb{Q}$ with $x \in B_3 = (a,b) \cap (c,d)$. ✓

So $\mathcal{B}_\mathbb{Q}$ is a basis. $\square$

**Part 2: $\mathcal{T}_{\mathcal{B}_\mathbb{Q}} = \mathcal{T}_{\mathrm{std}}$.**

Let $\mathcal{B} = \{(a,b) \mid a,b \in \mathbb{R},\, a < b\}$ be the standard basis from Exercise 4.2.

We apply Theorem 4.11 in both directions.

**Step 1 [$\mathcal{T}_{\mathcal{B}_\mathbb{Q}} \subseteq \mathcal{T}_{\mathrm{std}}$].**

Let $(a,b) \in \mathcal{B}_\mathbb{Q}$ (so $a, b \in \mathbb{Q}$) and let $x \in (a,b)$. Since $(a,b)$ is also an open interval with real endpoints, $(a,b) \in \mathcal{B}$. So $x \in (a,b) \subseteq (a,b)$ witnesses the condition of Theorem 4.11. Hence $\mathcal{T}_{\mathcal{B}_\mathbb{Q}} \subseteq \mathcal{T}_{\mathrm{std}}$.

**Step 2 [$\mathcal{T}_{\mathrm{std}} \subseteq \mathcal{T}_{\mathcal{B}_\mathbb{Q}}$].**

Let $(a,b) \in \mathcal{B}$ (with $a, b \in \mathbb{R}$) and let $x \in (a,b)$. We need to find $(p,q) \in \mathcal{B}_\mathbb{Q}$ with $x \in (p,q) \subseteq (a,b)$.

By density of $\mathbb{Q}$ in $\mathbb{R}$, choose $p \in \mathbb{Q}$ with $a < p < x$ and $q \in \mathbb{Q}$ with $x < q < b$. (Such rationals exist: for $p$, apply density to the interval $(a,x)$; for $q$, to $(x, b)$.) Then:

$$p, q \in \mathbb{Q},\quad p < x < q,\quad a < p \text{ and } q < b,$$

so $(p,q) \in \mathcal{B}_\mathbb{Q}$, $x \in (p,q)$, and $(p,q) \subseteq (a,b)$.

By Theorem 4.11, $\mathcal{T}_{\mathrm{std}} \subseteq \mathcal{T}_{\mathcal{B}_\mathbb{Q}}$.

**Conclusion.** $\mathcal{B}_\mathbb{Q}$ is a basis that generates $\mathcal{T}_{\mathrm{std}}$. $\blacksquare$

---

## Exercise 4.5

### Setup

**Space.** $\mathbb{R}$.

**Candidate basis.**

$$\mathcal{B}_\ell = \bigl\{[a, b) \;\big|\; a, b \in \mathbb{R},\; a < b\bigr\}, \quad \text{where } [a,b) = \{x \in \mathbb{R} \mid a \leq x < b\}.$$

**Lower limit topology.** The topology $\mathcal{T}_\ell$ generated by $\mathcal{B}_\ell$.

### Definitions

**Definition 4.6 (Basis).** B1 and B2 as before.

**Definition 3.29 (Closure).** $\overline{A}$ = smallest closed set containing $A$.

**Definition 3.24 (Closed).** $C$ is closed iff $\mathbb{R} \setminus C \in \mathcal{T}_\ell$.

**Exercise 3.7 (Characterisation of closure).** $x \in \overline{A}$ iff every neighbourhood of $x$ intersects $A$.

### What to Show

**(a)** $\mathcal{B}_\ell$ satisfies B1 and B2, hence is a basis.

$$\forall x \in \mathbb{R},\; \exists\, [a,b) \in \mathcal{B}_\ell : x \in [a,b),$$
$$\forall\, [a,b),\, [c,d) \in \mathcal{B}_\ell,\; \forall\, x \in [a,b) \cap [c,d),\; \exists\, [e,f) \in \mathcal{B}_\ell : x \in [e,f) \subseteq [a,b) \cap [c,d).$$

**(b)** The closure of $(0,1)$ in $\mathcal{T}_\ell$ is $[0,1)$.

That is: $\overline{(0,1)} = [0,1)$ in $(\mathbb{R}, \mathcal{T}_\ell)$.

---

### Proof — Part (a)

**B1:** For any $x \in \mathbb{R}$, take $a = x$ and $b = x + 1$. Then $[x, x+1) \in \mathcal{B}_\ell$ and $x \in [x, x+1)$. ✓

**B2:** Let $[a,b), [c,d) \in \mathcal{B}_\ell$ and let $x \in [a,b) \cap [c,d)$. Then

$$[a,b) \cap [c,d) = [\max(a,c),\, \min(b,d)).$$

Since $x \in [a,b) \cap [c,d)$, we have $x \geq \max(a,c)$ and $x < \min(b,d)$, so $\max(a,c) \leq x < \min(b,d)$, which gives $\max(a,c) < \min(b,d)$.

Set $B_3 = [\max(a,c), \min(b,d)) \in \mathcal{B}_\ell$. Then $x \in B_3$ and $B_3 = [a,b) \cap [c,d) \subseteq [a,b) \cap [c,d)$. ✓

So $\mathcal{B}_\ell$ is a basis. $\square$

---

### Proof — Part (b)

**Step 1 [The topology $\mathcal{T}_\ell$ is strictly finer than $\mathcal{T}_{\mathrm{std}}$].**

Every open interval $(a,b) = \bigcup_{n=1}^\infty [a + \tfrac{1}{n}, b)$, a union of basis elements of $\mathcal{B}_\ell$, so $(a,b) \in \mathcal{T}_\ell$. This means $\mathcal{T}_{\mathrm{std}} \subseteq \mathcal{T}_\ell$.

**Step 2 [Closed sets in $\mathcal{T}_\ell$].**

A set $C \subseteq \mathbb{R}$ is closed in $\mathcal{T}_\ell$ iff $\mathbb{R} \setminus C \in \mathcal{T}_\ell$.

**Claim:** $[0, 1)$ is closed in $\mathcal{T}_\ell$.

_Proof of Claim._ We show $\mathbb{R} \setminus [0,1) = (-\infty, 0) \cup [1, \infty)$ is open in $\mathcal{T}_\ell$.

- $(-\infty, 0) = \bigcup_{n=1}^\infty [-n, 0)$, a union of basis elements, so $(-\infty, 0) \in \mathcal{T}_\ell$. ✓
- $[1, \infty) = \bigcup_{n=1}^\infty [1, 1+n)$, a union of basis elements, so $[1, \infty) \in \mathcal{T}_\ell$. ✓

Thus $(-\infty, 0) \cup [1, \infty) \in \mathcal{T}_\ell$, and $[0,1)$ is closed. $\square$

**Step 3 [$\overline{(0,1)} \subseteq [0,1)$].**

Since $[0,1)$ is closed and $(0,1) \subseteq [0,1)$, the closure $\overline{(0,1)}$ — being the smallest closed set containing $(0,1)$ (Definition 3.29) — satisfies $\overline{(0,1)} \subseteq [0,1)$.

**Step 4 [$0 \in \overline{(0,1)}$].**

By Exercise 3.7, $0 \in \overline{(0,1)}$ iff every neighbourhood of $0$ intersects $(0,1)$. A neighbourhood of $0$ in $\mathcal{T}_\ell$ contains some basis element $[0, \varepsilon)$ with $\varepsilon > 0$. For any such $\varepsilon$:

$$[0, \varepsilon) \cap (0,1) = (0, \min(\varepsilon, 1)) \neq \emptyset$$

(since $\min(\varepsilon,1) > 0$). So every neighbourhood of $0$ meets $(0,1)$, giving $0 \in \overline{(0,1)}$. ✓

**Step 5 [$1 \notin \overline{(0,1)}$].**

By Exercise 3.7, $1 \notin \overline{(0,1)}$ iff some neighbourhood of $1$ misses $(0,1)$. The basis element $[1, 2) \in \mathcal{T}_\ell$ is a neighbourhood of $1$, and

$$[1, 2) \cap (0, 1) = \emptyset,$$

since $[1,2)$ starts at $1 \notin (0,1)$. So $1 \notin \overline{(0,1)}$. ✓

**Step 6 [Conclusion].**

From Step 3: $\overline{(0,1)} \subseteq [0,1)$. From Step 4: $0 \in \overline{(0,1)}$. The set $(0,1) \subseteq \overline{(0,1)}$ trivially (closure contains the set). So $(0,1) \cup \{0\} = [0,1) \subseteq \overline{(0,1)}$. Combined with Step 3:

$$\overline{(0,1)} = [0,1). \qquad \blacksquare$$

---

## Exercise 4.6

### Setup

**Space.** $\mathbb{Z}$, the integers.

**Basis elements.** For each $n \in \mathbb{Z}$, define

$$B(n) = \begin{cases} \{n\} & \text{if } n \text{ is odd,} \\ \{n-1,\, n,\, n+1\} & \text{if } n \text{ is even.} \end{cases}$$

**Candidate basis.** $\mathcal{B} = \{B(n) \mid n \in \mathbb{Z}\}$.

### Definitions

**Definition 4.6 (Basis).** $\mathcal{B}$ is a basis if:

- **B1.** $\forall x \in \mathbb{Z},\, \exists\, B \in \mathcal{B} : x \in B$.
- **B2.** $\forall\, B_1, B_2 \in \mathcal{B},\, \forall\, x \in B_1 \cap B_2,\, \exists\, B_3 \in \mathcal{B} : x \in B_3 \subseteq B_1 \cap B_2$.

### Assumptions

Every integer is either odd or even. Odd integers are those not divisible by 2. Note that the neighbours $n \pm 1$ of any even integer $n$ are both odd.

### What to Show

$$\mathcal{B} \text{ satisfies B1 and B2, hence is a basis for a topology on } \mathbb{Z}.$$

---

### Proof

**Step 1 [B1].**

Let $n \in \mathbb{Z}$. By definition $n \in B(n) \in \mathcal{B}$. ✓

**Step 2 [B2].**

Let $B(m), B(n) \in \mathcal{B}$ with $B(m) \cap B(n) \neq \emptyset$, and let $x \in B(m) \cap B(n)$. We need $B_3 \in \mathcal{B}$ with $x \in B_3 \subseteq B(m) \cap B(n)$. We case-split on the parity of $m$ and $n$.

**Case 1: $m$ and $n$ both odd.**

$B(m) = \{m\}$ and $B(n) = \{n\}$. Non-empty intersection forces $m = n$, so $B(m) \cap B(n) = \{m\}$ and $x = m$. Since $m$ is odd, $B(x) = B(m) = \{m\}$, and $x \in B(x) \subseteq B(m) \cap B(n)$. ✓

**Case 2: $m$ odd, $n$ even** (the case $m$ even, $n$ odd is symmetric).

$B(m) = \{m\}$ and $B(n) = \{n-1, n, n+1\}$. Since $m \in B(m) \cap B(n)$, we have $m \in \{n-1, n, n+1\}$.

Since $n$ is even and $m$ is odd, $m \neq n$. So $m \in \{n-1, n+1\}$. In either case $m$ is odd, and

$$B(m) \cap B(n) \supseteq \{m\} \ni x = m.$$

But in fact $B(m) = \{m\}$, so $B(m) \cap B(n) = \{m\}$ (the singleton is the entire smaller set). Take $B_3 = B(x) = B(m) = \{m\}$; then $x \in B_3 \subseteq B(m) \cap B(n)$. ✓

**Case 3: $m$ and $n$ both even.**

$B(m) = \{m-1, m, m+1\}$ and $B(n) = \{n-1, n, n+1\}$. For the intersection to be non-empty, the two sets of three consecutive integers must overlap. The possible sub-cases are:

- **$m = n$:** $B(m) \cap B(n) = B(m)$. Take $B_3 = B(x)$ for any $x \in B(m)$. If $x$ is odd (i.e., $x = m \pm 1$), then $B(x) = \{x\} \subseteq B(m)$. If $x = m$ (even), $B(x) = B(m) \subseteq B(m)$. ✓

- **$|m - n| = 2$:** WLOG $n = m + 2$. Then $B(m) = \{m-1, m, m+1\}$ and $B(n) = \{m+1, m+2, m+3\}$, so

  $$B(m) \cap B(n) = \{m+1\}.$$

  Since $m$ is even, $m+1$ is odd, so $x = m+1$ and $B(x) = \{m+1\}$. Then $x \in B(x) \subseteq \{m+1\} = B(m) \cap B(n)$. ✓

- **$|m - n| \geq 4$:** The sets $\{m-1,m,m+1\}$ and $\{n-1,n,n+1\}$ are disjoint (their nearest elements are $m+1$ and $n-1 \geq m+3$), so $B(m) \cap B(n) = \emptyset$. This case does not arise by assumption. ✓

  (Note: $|m - n|$ cannot equal $1$ since both are even.)

All cases are exhausted. B2 holds. ✓

**Conclusion.** $\mathcal{B}$ satisfies B1 and B2, hence is a basis for a topology on $\mathbb{Z}$, called the digital line topology. $\blacksquare$

---

## Exercise 4.7

### Setup

**Space.** $\mathbb{Z}$, the integers.

**Arithmetic progressions.** For $a, b \in \mathbb{Z}$ with $a \neq 0$, define

$$A_{a,b} = \{az + b \mid z \in \mathbb{Z}\} = \{\ldots,\, b - 2a,\, b - a,\, b,\, b + a,\, b + 2a,\, \ldots\}.$$

This is the set of all integers congruent to $b$ modulo $|a|$, i.e., $A_{a,b} = \{n \in \mathbb{Z} \mid n \equiv b \pmod{|a|}\}$.

**Candidate basis.** $\mathcal{B} = \{A_{a,b} \mid a, b \in \mathbb{Z},\, a \neq 0\}$.

### Definitions

**Definition 4.6 (Basis).** B1 and B2 as before.

**Theorem 4.10.** Topology generated by $\mathcal{B}$ = all unions of elements of $\mathcal{B}$.

**Number theory.** $\gcd(a,c)$ denotes the greatest common divisor. The system $n \equiv b \pmod{|a|}$, $n \equiv d \pmod{|c|}$ is solvable iff $\gcd(|a|, |c|) \mid (b - d)$; if solvable, the solution set is $A_{\mathrm{lcm}(|a|,|c|),\, n_0}$ for any particular solution $n_0$.

### What to Show

**(a)** $\mathcal{B}$ is a basis for a topology on $\mathbb{Z}$.

$$\text{B1: } \forall n \in \mathbb{Z},\; \exists A_{a,b} \in \mathcal{B} : n \in A_{a,b}.$$
$$\text{B2: } \forall A_{a,b}, A_{c,d} \in \mathcal{B},\; \forall n \in A_{a,b} \cap A_{c,d},\; \exists A_{e,f} \in \mathcal{B} : n \in A_{e,f} \subseteq A_{a,b} \cap A_{c,d}.$$

**(b)** There are infinitely many prime numbers.

The argument: assume finitely many primes $\{p_1, \ldots, p_k\}$, derive a contradiction using the topology generated by $\mathcal{B}$.

---

### Proof — Part (a)

**B1:** For any $n \in \mathbb{Z}$, take $a = 1, b = n$. Then $A_{1,n} = \{z + n \mid z \in \mathbb{Z}\} = \mathbb{Z}$, so $n \in A_{1,n} \in \mathcal{B}$. ✓

_(Equivalently, $A_{1,0} = \mathbb{Z}$ contains every integer.)\_

**B2:** Let $A_{a,b}, A_{c,d} \in \mathcal{B}$ and let $n \in A_{a,b} \cap A_{c,d}$.

$n \in A_{a,b}$ means $n \equiv b \pmod{|a|}$.

$n \in A_{c,d}$ means $n \equiv d \pmod{|c|}$.

**Claim:** $A_{a,b} \cap A_{c,d} = A_{\ell, n}$ where $\ell = \mathrm{lcm}(|a|, |c|)$.

_Proof of Claim._ An integer $m$ lies in $A_{a,b} \cap A_{c,d}$ iff $m \equiv b \pmod{|a|}$ and $m \equiv d \pmod{|c|}$. Since $n$ is a particular solution (by hypothesis), $m$ is in $A_{a,b} \cap A_{c,d}$ iff $|a| \mid (m - n)$ and $|c| \mid (m - n)$, iff $\mathrm{lcm}(|a|, |c|) \mid (m - n)$, iff $m \equiv n \pmod{\ell}$, iff $m \in A_{\ell, n}$. $\square$

Now $A_{\ell, n} \in \mathcal{B}$ (since $\ell = \mathrm{lcm}(|a|,|c|) \geq 1 > 0$, so $\ell \neq 0$). Moreover $n \in A_{\ell,n}$ and $A_{\ell,n} = A_{a,b} \cap A_{c,d} \subseteq A_{a,b} \cap A_{c,d}$.

So B2 holds. ✓

**Conclusion of Part (a).** $\mathcal{B}$ is a basis for a topology on $\mathbb{Z}$, called the arithmetic progression topology. $\square$

---

### Proof — Part (b): Infinitely Many Primes

Let $\mathcal{T}$ denote the topology on $\mathbb{Z}$ generated by $\mathcal{B}$.

**Step 1 [Every basis element is clopen].**

We show each $A_{a,b} \in \mathcal{B}$ is both open and closed.

_Open:_ $A_{a,b} \in \mathcal{B} \subseteq \mathcal{T}$ by definition. ✓

_Closed:_ We show $\mathbb{Z} \setminus A_{a,b}$ is open. The set $\mathbb{Z}$ decomposes into $|a|$ disjoint arithmetic progressions with common difference $|a|$:

$$\mathbb{Z} = A_{a,\, b} \;\cup\; A_{a,\, b+1} \;\cup\; \cdots \;\cup\; A_{a,\, b+|a|-1}$$

(where the union is over distinct residues modulo $|a|$, taken without loss of generality as $b, b+1, \ldots, b+|a|-1$). Therefore

$$\mathbb{Z} \setminus A_{a,b} = \bigcup_{j=1}^{|a|-1} A_{a,\, b+j},$$

a finite union of basis elements, hence open. So $A_{a,b}$ is closed. ✓

**Step 2 [Every non-empty open set is infinite].**

Every basis element $A_{a,b}$ is a bi-infinite arithmetic progression (since $a \neq 0$), hence infinite. Any non-empty open set contains a basis element (by Definition 4.6 B1 and Theorem 4.9), hence is infinite.

In particular: **no non-empty finite subset of $\mathbb{Z}$ is open in $\mathcal{T}$.**

**Step 3 [Every integer $\neq \pm 1$ lies in $A_{p,0}$ for some prime $p$].**

Let $n \in \mathbb{Z}$ with $n \neq \pm 1$. Since $|n| > 1$, $|n|$ has a prime factor $p$, meaning $p \mid n$, i.e., $n \in A_{p,0} = p\mathbb{Z}$. Therefore

$$\mathbb{Z} \setminus \{-1, 1\} \;\subseteq\; \bigcup_{p \text{ prime}} A_{p,0}.$$

Conversely, $\pm 1$ have no prime factors, so $\pm 1 \notin A_{p,0}$ for any prime $p$. Hence

$$\mathbb{Z} \setminus \{-1, 1\} \;=\; \bigcup_{p \text{ prime}} A_{p,0}.$$

**Step 4 [Furstenberg's argument].**

Suppose for contradiction that there are only finitely many primes $p_1, p_2, \ldots, p_k$. Then

$$\mathbb{Z} \setminus \{-1, 1\} = \bigcup_{i=1}^k A_{p_i,\, 0}.$$

Each $A_{p_i, 0}$ is closed by Step 1. A finite union of closed sets is closed (Theorem 3.28(3)). Hence $\bigcup_{i=1}^k A_{p_i, 0}$ is closed, which means its complement

$$\{-1, 1\} = \mathbb{Z} \setminus \bigcup_{i=1}^k A_{p_i,\, 0}$$

is **open** in $\mathcal{T}$.

But $\{-1, 1\}$ is a non-empty finite set. By Step 2, no such set is open in $\mathcal{T}$.

**Contradiction.** The assumption that there are finitely many primes is false.

**Conclusion.** There are infinitely many prime numbers. $\blacksquare$

---

## Exercise 4.8

### Setup

**Space.** $(X, \mathcal{T})$ an arbitrary topological space.

**Basis.** $\mathcal{B}$ is a basis for $\mathcal{T}$, meaning $\mathcal{B}$ satisfies B1–B2 and $\mathcal{T} = \mathcal{T}_\mathcal{B}$ (Theorem 4.9/4.10).

**Subset.** $A \subseteq X$.

### Definitions

**Definition 3.32 (Dense).** $A$ is _dense_ in $X$ if $\overline{A} = X$.

**Equivalent characterisation** (notes, following Def. 3.32). $A$ is dense in $X$ if and only if $A \cap U \neq \emptyset$ for every non-empty $U \in \mathcal{T}$.

**Definition 4.6 (Basis).** B1 and B2.

**Theorem 4.9.** $U \in \mathcal{T}$ iff for every $x \in U$ there exists $B \in \mathcal{B}$ with $x \in B \subseteq U$.

### What to Show

$$A \text{ is dense in } X \;\iff\; \forall\, B \in \mathcal{B},\; B \neq \emptyset \;\Rightarrow\; B \cap A \neq \emptyset.$$

---

### Proof

**($\Rightarrow$) If $A$ is dense, every non-empty basis element meets $A$.**

Assume $\overline{A} = X$. By the equivalent characterisation, every non-empty open set meets $A$. Each non-empty $B \in \mathcal{B}$ is open in $\mathcal{T}$ (by Theorem 4.10, every basis element is a union of itself, hence open). Therefore $B \cap A \neq \emptyset$.

**($\Leftarrow$) If every non-empty basis element meets $A$, then $A$ is dense.**

Assume every non-empty $B \in \mathcal{B}$ satisfies $B \cap A \neq \emptyset$. We use the equivalent characterisation: we show every non-empty open set $U \in \mathcal{T}$ meets $A$.

Let $U \in \mathcal{T}$ be non-empty and pick any $x \in U$. By Theorem 4.9, there exists $B \in \mathcal{B}$ with

$$x \in B \subseteq U.$$

In particular $B \neq \emptyset$. By hypothesis, $B \cap A \neq \emptyset$. Since $B \subseteq U$, it follows that $U \cap A \supseteq B \cap A \neq \emptyset$.

Since $U$ was an arbitrary non-empty open set, the equivalent characterisation gives $\overline{A} = X$, i.e., $A$ is dense.

**Conclusion.** $A$ is dense in $X$ if and only if every non-empty basis element intersects $A$. $\blacksquare$
