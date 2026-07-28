export function validateAlignmentAudioFile({
  resultFilename,
  manifestFilename,
  currentFilename,
}: {
  resultFilename: string;
  manifestFilename: string;
  currentFilename: string;
}) {
  if (resultFilename !== manifestFilename) {
    return "result audio file differs from manifest";
  }
  if (currentFilename !== manifestFilename) return "current audio file changed";
  return null;
}
