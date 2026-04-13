import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import engineElevenlabs from "@/app/audio/_lib/audio/elevenlabs";

const getElevenlabsQuota = createServerFn({ method: "GET" }).handler(
  async () => {
    return engineElevenlabs.getUserInfo();
  },
);

export const Route = createFileRoute("/audio/elevenlabs_quota")({
  loader: () => getElevenlabsQuota(),
  component: ElevenlabsQuotaRoute,
});

function ElevenlabsQuotaRoute() {
  const data = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-[720px] px-6 py-10">
      Used character count: {data.character_count}/{data.character_limit} (
      {(100 * data.character_count) / data.character_limit}%)
    </main>
  );
}
