import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/api/og/route";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
