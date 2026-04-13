import { createFileRoute } from "@tanstack/react-router";
import LocalizationPageClient from "@/app/editor/localization/[language]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/localization/$language")({
  component: EditorLocalizationRoute,
});

function EditorLocalizationRoute() {
  const { language } = Route.useParams();

  return (
    <EditorShell>
      <LocalizationPageClient identifier={language} />
    </EditorShell>
  );
}
