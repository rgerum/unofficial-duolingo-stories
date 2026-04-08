import React from "react";
import EditorPageLayout from "../../_components/page_layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <EditorPageLayout contentClassName="min-h-0 min-w-0 flex-1 overflow-hidden">
      {children}
    </EditorPageLayout>
  );
}
