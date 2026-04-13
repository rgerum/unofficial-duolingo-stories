import { createFileRoute } from "@tanstack/react-router";
import { POST } from "@/app/audio/upload/route";

export const Route = createFileRoute("/audio/upload")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
