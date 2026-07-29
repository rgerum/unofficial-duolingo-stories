export function applyTimingUpdates(
  docText: string,
  updates: { inserIndex: number | undefined; serializedText: string }[],
  audioInsertLines: [number | undefined, number][],
) {
  const lines = docText.split("\n");
  const lineUpdates = updates
    .map((update) => {
      if (update.inserIndex === undefined) return null;
      const target = audioInsertLines[update.inserIndex];
      if (!target) return null;
      return { target, serializedText: update.serializedText };
    })
    .filter((update): update is NonNullable<typeof update> => update !== null)
    .sort((left, right) => getSortLine(right.target) - getSortLine(left.target));

  for (const update of lineUpdates) {
    const [line, lineInsert] = update.target;
    if (line !== undefined) {
      lines[Math.max(0, line - 1)] = update.serializedText;
      continue;
    }
    const targetLine = Math.max(1, Math.min(lineInsert, lines.length));
    lines.splice(targetLine - 1, 0, update.serializedText);
  }

  return lines.join("\n");
}

function getSortLine(target: [number | undefined, number]) {
  return target[0] ?? target[1];
}
