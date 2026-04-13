import { createFileRoute } from "@tanstack/react-router";
import { GET, POST } from "@/app/api/auth/[...all]/route";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
