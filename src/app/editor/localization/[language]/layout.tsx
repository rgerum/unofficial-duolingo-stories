import React from "react";
import EditorPageLayout from "../../_components/page_layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EditorPageLayout>{children}</EditorPageLayout>;
}
