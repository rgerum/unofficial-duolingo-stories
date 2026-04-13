import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/audio/voices/route";

export const Route = createFileRoute("/audio/voices")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
