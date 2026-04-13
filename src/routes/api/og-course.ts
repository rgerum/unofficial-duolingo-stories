import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/api/og-course/route";

export const Route = createFileRoute("/api/og-course")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
