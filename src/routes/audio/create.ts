import { createFileRoute } from "@tanstack/react-router";
import { POST } from "@/app/audio/create/route";

export const Route = createFileRoute("/audio/create")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
