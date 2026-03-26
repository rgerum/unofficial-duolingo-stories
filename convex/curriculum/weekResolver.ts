/**
 * Resolves the current grammar focus for a given level and date.
 *
 * Given a date, determines which week of the curriculum cycle we're in,
 * and returns the grammar focus for that week.
 */

import {
  FRENCH_SEQUENCES,
  CYCLE_ANCHOR_DATE,
  type CurriculumWeek,
  type LevelSequence,
} from "./frenchSequence";

export type GrammarFocus = {
  /** 1-based week number within the cycle */
  weekNumber: number;
  /** Total weeks in this level's cycle */
  cycleLength: number;
  /** Which repetition of the cycle we're in (0-based) */
  cycleIteration: number;
  /** The week's curriculum data */
  week: CurriculumWeek;
};

/**
 * Calculate the number of days between two YYYY-MM-DD date strings.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the current grammar focus for a level on a given date.
 *
 * @param language - Language code (currently only "fr" is supported)
 * @param level - CEFR level ("A1", "A2", "B1", "B2")
 * @param date - Date string in YYYY-MM-DD format
 * @returns The grammar focus for that week, or null if the level has no sequence
 */
export function getGrammarFocus(
  language: string,
  level: string,
  date: string,
): GrammarFocus | null {
  // Currently only French is supported
  if (language !== "fr") return null;

  const sequence: LevelSequence | undefined = FRENCH_SEQUENCES[level];
  if (!sequence) return null;

  const days = daysBetween(CYCLE_ANCHOR_DATE, date);

  // If the date is before the anchor, we still want a valid week.
  // Use modular arithmetic that handles negative values correctly.
  const totalWeeks = Math.floor(days / 7);
  const weekIndex =
    ((totalWeeks % sequence.cycleLength) + sequence.cycleLength) %
    sequence.cycleLength;
  const cycleIteration = Math.floor(totalWeeks / sequence.cycleLength);

  const week = sequence.weeks[weekIndex];
  if (!week) return null;

  return {
    weekNumber: week.week,
    cycleLength: sequence.cycleLength,
    cycleIteration,
    week,
  };
}

/**
 * Build a grammar instruction string for the LLM prompt.
 *
 * Returns a structured text block that tells the story generator
 * what grammar to focus on, how to use it, and what to avoid.
 */
export function buildGrammarInstruction(focus: GrammarFocus): string {
  const { week } = focus;

  if (week.type === "review") {
    const topics = week.reviewTopics ?? [];
    return `THIS WEEK IS A REVIEW WEEK (Week ${focus.weekNumber}/${focus.cycleLength})

Review the following grammar topics by using them naturally throughout the story.
Do NOT explicitly teach or explain them — just use them in context so the learner
encounters them again in a new setting.

Topics to review:
${topics.map((t) => `- ${t}`).join("\n")}

Distribute these topics across the story. Each should appear at least once.
The story should feel natural, not like a grammar exercise.`;
  }

  const lines: string[] = [];

  lines.push(
    `THIS WEEK'S GRAMMAR FOCUS (Week ${focus.weekNumber}/${focus.cycleLength}):`,
  );
  lines.push(`Primary: ${week.primary}`);

  if (week.primaryMode === "introduce") {
    lines.push(
      `Mode: INTRODUCE — This is the first time learners encounter this grammar point at this level.`,
    );
    lines.push(
      `Your story MUST feature 3-5 clear, natural examples of this grammar structure.`,
    );
    lines.push(
      `The examples should be varied (not just repeating the same pattern) so the learner`,
    );
    lines.push(`can start to infer the rule from context.`);
  } else if (week.primaryMode === "reinforce") {
    lines.push(
      `Mode: REINFORCE — Learners have seen this before in this cycle. Use it naturally`,
    );
    lines.push(
      `in new contexts. Include 2-4 examples. The learner should recognise the pattern.`,
    );
  } else if (week.primaryMode === "deepen") {
    lines.push(
      `Mode: DEEPEN — This was covered at a lower level. Use it in more complex contexts`,
    );
    lines.push(
      `than before, combining it with other structures the learner now knows.`,
    );
  }

  if (week.secondary) {
    lines.push(``);
    lines.push(`Secondary grammar (lighter touch): ${week.secondary}`);
    if (week.secondaryMode === "reinforce") {
      lines.push(
        `Include 1-2 natural uses. Do not force it — skip if it would feel unnatural.`,
      );
    } else if (week.secondaryMode === "deepen") {
      lines.push(
        `Include 1-2 uses in slightly more complex contexts than before. Only if natural.`,
      );
    }
  }

  lines.push(``);
  lines.push(
    `IMPORTANT: The grammar focus should emerge naturally from the story content.`,
  );
  lines.push(
    `Do NOT add explicit grammar explanations, labels, or metalanguage.`,
  );
  lines.push(
    `The story is for implicit learning through comprehensible input, not explicit instruction.`,
  );

  return lines.join("\n");
}
