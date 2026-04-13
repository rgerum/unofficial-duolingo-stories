import { createFileRoute } from "@tanstack/react-router";
import LanguageTtsEditorPageClient from "@/app/editor/language/[language]/tts_edit/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/language/$language/tts_edit")({
  component: EditorLanguageTtsRoute,
});

function EditorLanguageTtsRoute() {
  const { language } = Route.useParams();

  return (
    <EditorShell>
      <LanguageTtsEditorPageClient identifier={language} />
    </EditorShell>
  );
}
