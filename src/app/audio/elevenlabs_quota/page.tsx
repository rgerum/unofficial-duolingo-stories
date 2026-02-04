import engine_elevenlabs from "../_lib/audio/elevenlabs";

export default async function Page() {
  const data = await engine_elevenlabs.getUserInfo();
  return (
    <>
      Used character count: {data.character_count}/{data.character_limit} (
      {(100 * data.character_count) / data.character_limit}%)
    </>
  );
}
