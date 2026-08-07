// The story grammar expects hint lines (~ translation, ^ pronunciation) to
// come before the $ audio line. Audio imports have historically inserted the
// audio line one line too high, leaving it above the hints and breaking the
// parse. This repairs that ordering at the text level.

function strippedLine(line: string) {
  return line.trim().replace(/\u2067/, "");
}

export function fix_audio_line_order(text: string): string {
  const lines = text.split("\n");
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    if (!strippedLine(lines[i]).startsWith("$")) continue;
    let end = i + 1;
    while (end < lines.length && /^[~^]/.test(strippedLine(lines[end]))) {
      end += 1;
    }
    if (end === i + 1) continue;
    const [audioLine] = lines.splice(i, 1);
    lines.splice(end - 1, 0, audioLine);
    changed = true;
    i = end - 1;
  }
  return changed ? lines.join("\n") : text;
}
