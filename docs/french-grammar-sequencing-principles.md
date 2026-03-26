# French Grammar Sequencing Principles

This document defines the rules and constraints for ordering grammar topics into weekly curriculum cycles. Given the topic inventory (`french-grammar-curriculum.md`) and these principles, the sequencing should be reproducible — the same inputs should yield the same (or very similar) output.

---

## 1. Scope

Each CEFR sublevel (Pre-A1, A1, A2, A2+, B1, B1+, B2, B2+, C1, C2) gets its own independent cycle. A cycle is a fixed-length sequence of weeks, where each week has a primary grammar focus and optionally a secondary grammar focus.

---

## 2. Cycle Structure

### 2.1 Week types

Each cycle contains three types of weeks:

- **Introduction weeks** — a new grammar topic is the primary focus for the first time.
- **Reinforcement weeks** — a previously introduced topic returns as the primary focus, in a new context or with added complexity.
- **Review weeks** — no new primary topic. The week recycles 2–3 recent topics lightly, with emphasis on natural use rather than explicit instruction.

### 2.2 Cycle length

The cycle length for a sublevel is determined by:

```
cycle_length = number_of_topics + review_weeks
```

Where:
- `review_weeks = floor(number_of_topics / 4)` — one review week for every 4 introduction weeks, minimum 1.
- This means a sublevel with 10 topics gets a cycle of ~12–13 weeks.

### 2.3 Review week placement

Review weeks are evenly distributed through the cycle, not clustered at the end:

- Place the first review week after the 4th introduction week.
- Place subsequent review weeks every 4 introduction weeks thereafter.
- If the final review week would be the last week of the cycle, move it to the second-to-last position so the cycle ends on an introduction week (which feels more forward-moving).

### 2.4 Cycle repetition

When a cycle ends, it restarts from week 1. Learners who stay in the same level see the same grammar sequence again but with different news content and stories. The repetition is intentional — spaced repetition at the cycle level.

---

## 3. Ordering Rules

These rules determine in what order topics are introduced within a cycle. They are listed in priority order — if two rules conflict, the higher-numbered rule wins.

### 3.1 Prerequisite dependencies (highest priority)

Some topics require prior topics to be meaningful. These are hard constraints — a topic cannot appear before its prerequisite has been introduced, either earlier in the same cycle or in a lower sublevel.

**The prerequisite graph is defined in `french-grammar-curriculum.md`** — each topic lists its prerequisites inline. This principles file does not duplicate the graph; it defines how prerequisites are used during sequencing.

Rules:
- **Within-level prerequisites** — if topic A and topic B are in the same sublevel and B lists A as a prerequisite, A must appear earlier in the cycle.
- **Cross-level prerequisites** — if topic B lists a prerequisite from a lower sublevel, that prerequisite is assumed to have been covered. No within-cycle ordering is needed; it is satisfied implicitly.
- **Transitive closure** — prerequisites are transitive. If C requires B and B requires A, then C requires both A and B.

### 3.2 Pedagogical clustering

Topics that share a conceptual family should appear near each other (within 1–2 weeks), so the learner can compare and contrast. If clustering conflicts with prerequisites, prerequisites win.

**Cluster membership is defined in `french-grammar-curriculum.md`** — each topic lists its cluster name (if any) inline. Topics sharing the same cluster name within the same sublevel should be placed within 1–2 weeks of each other.

For clusters that span two sublevels (e.g., `reported-speech` spans B1 and B1+, `cause-consequence` spans B1 and B1+), clustering applies only within each sublevel — the cross-level portion is handled naturally by sublevel progression.

### 3.3 Difficulty gradient

Within a cycle, topics should progress from more concrete/frequent to more abstract/rare. This is a soft constraint — use it to break ties when prerequisites and clustering don't determine order.

Concreteness hierarchy (most concrete first):
1. High-frequency verb forms and tenses
2. Pronouns and determiners
3. Sentence-level constructions (questions, negation, exclamatives)
4. Clause-level constructions (relative clauses, reported speech, conditionals)
5. Discourse-level constructions (connectors, discourse markers, register)
6. Stylistic and pragmatic features

### 3.4 Alternation principle

Avoid placing more than 2 consecutive weeks on the same grammatical category (e.g., 3 verb tense weeks in a row). Interleave categories where possible.

**Categories are defined in `french-grammar-curriculum.md`** — each topic lists its category inline. The category definitions table is also in that file.

This prevents fatigue and allows implicit reinforcement of earlier topics through natural use in the story content.

### 3.5 News-relevance boost

For levels B1 and above, topics that naturally appear in news text should be placed earlier in the cycle, all else being equal. These topics will get organic reinforcement from the news stories.

**News-relevant topics are marked in `french-grammar-curriculum.md`** with `News relevance: high`. This field is only present on topics where it is notably high; absence means standard/low relevance.

This is a tie-breaker, not a hard constraint.

---

## 4. Secondary Grammar Focus

Each introduction week may optionally carry a **secondary grammar focus** — a lighter touch on a second topic.

### 4.1 Selection rules for secondary focus

The secondary focus must be:
- A topic from a **previous cycle week** (reinforcement) or from a **lower sublevel** (assumed known).
- **Not** a new introduction — new topics only appear as primary.
- **Conceptually compatible** with the primary focus, so the story can plausibly use both. If no compatible secondary exists, the week has no secondary focus.

### 4.2 Compatibility is defined by shared context

Two topics are compatible if they can co-occur naturally in the same short story. Examples:
- Primary: passé composé with avoir → Secondary: negation (natural: "il n'a pas mangé")
- Primary: conditional present → Secondary: question formation (natural: "est-ce que tu voudrais...?")
- Primary: reported speech → Secondary: imparfait (natural: "il a dit qu'il était fatigué")

Anti-examples (incompatible):
- Primary: imperative → Secondary: plus-que-parfait (unlikely to co-occur naturally in a short story)

### 4.3 Recency preference

When multiple candidates are compatible, prefer the most recently introduced topic as secondary — this creates tighter spaced repetition.

---

## 5. Week Specification Format

Each week in a cycle should be specified as:

```
week: <number>
type: introduction | reinforcement | review
primary_topic: <topic name from inventory>
primary_mode: introduce | reinforce | deepen
secondary_topic: <topic name or null>
secondary_mode: reinforce | deepen | null
review_topics: [<topic>, <topic>, ...] (only for review weeks)
```

Where:
- `introduce` = first time the learner encounters this topic in this sublevel's cycle.
- `reinforce` = the topic was introduced earlier in this cycle and is now being practised in a new context.
- `deepen` = the topic was covered in a lower sublevel and is now being extended (e.g., basic negation → expanded negation).

---

## 6. Validation Checks

After generating a sequence, verify:

1. **All topics covered.** Every topic in the sublevel's inventory appears as a primary focus in at least one introduction week.
2. **No prerequisite violations.** No topic appears before its prerequisites (per §3.1).
3. **Cluster proximity.** Clustered topics (per §3.2) appear within 2 weeks of each other, unless prerequisites force separation.
4. **Alternation respected.** No more than 2 consecutive weeks in the same grammatical category (per §3.4).
5. **Review week spacing.** Review weeks are distributed per §2.3.
6. **Difficulty gradient.** Topics generally progress from concrete to abstract within the cycle (per §3.3), with allowances for clustering and prerequisites.
7. **Secondary focus validity.** Every secondary topic is either from a prior week in the cycle or from a lower sublevel (per §4.1).
8. **Cycle length.** The cycle length matches the formula in §2.2.

---

## 7. Determinism

Given the same topic inventory and these principles, the sequencing algorithm should be deterministic:

1. Start with the topic list for the sublevel.
2. Build the dependency graph (§3.1).
3. Topologically sort the topics, respecting dependencies.
4. Within each topological tier (topics with equal dependency depth), apply clustering (§3.2) to group related topics.
5. Within each cluster, apply the difficulty gradient (§3.3) to order from concrete to abstract.
6. Apply the alternation principle (§3.4) as a post-processing pass — if 3+ consecutive weeks are in the same category, swap the 3rd with the nearest topic from a different category that doesn't violate dependencies.
7. Apply the news-relevance boost (§3.5) as a final tie-breaker for any remaining ambiguity.
8. Insert review weeks per §2.3.
9. Assign secondary topics per §4.

If two topics are still tied after all rules, order alphabetically by topic name (arbitrary but deterministic).

---

## 8. Adaptation Notes

- These principles are designed for French but should generalise to other languages by replacing the dependency graph and cluster definitions.
- The principles assume the news story generation system can target a specific grammar focus. If the generator cannot reliably produce stories featuring certain grammar points, those points may need special handling (e.g., dedicated non-news exercises).
- Pre-A1 may not need full sequencing — its topics are mostly independent vocabulary chunks and can be presented in any order.
