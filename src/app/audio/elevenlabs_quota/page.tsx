import engine_elevenlabs from "../_lib/audio/elevenlabs";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page() {
  const data = await engine_elevenlabs.getUserInfo();
  return (
    <>
      Used character count: {data.character_count}/{data.character_limit} (
      {(100 * data.character_count) / data.character_limit}%)
    </>
  );
}
