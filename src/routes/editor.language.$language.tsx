import { createFileRoute } from "@tanstack/react-router";
import LanguageEditorPageClient from "@/app/editor/language/[language]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/language/$language")({
  component: EditorLanguageRoute,
});

function EditorLanguageRoute() {
  const { language } = Route.useParams();

  return (
    <EditorShell>
      <LanguageEditorPageClient identifier={language} />
    </EditorShell>
  );
}
