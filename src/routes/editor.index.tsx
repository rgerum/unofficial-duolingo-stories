import { createFileRoute } from "@tanstack/react-router";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/")({
  component: EditorIndexRoute,
});

function EditorIndexRoute() {
  return (
    <EditorShell>
      <p id="no_stories" className="p-6">
        Click on one of the courses to display its stories.
      </p>
    </EditorShell>
  );
}
