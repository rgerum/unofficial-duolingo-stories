"use client";
"use no memo";
import React from "react";
import { EditorView } from "@codemirror/view";

type EditorViewExtended = EditorView & {
  codeTriggeredChange?: boolean;
  tree?: any;
};

type EditorChangeContextType = {
  view: EditorViewExtended | undefined;
  setView: (view: EditorView & { codeTriggeredChange?: boolean }) => void;
  change: (insert: string, start_line: number, end_line: number) => void;
  change2: (insert: string, start_line: number, end_line: number) => void;
};

export const EditorChangeContext = React.createContext(
  undefined as EditorChangeContextType | undefined,
);

export default function EditorChangeContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [view, setView] = React.useState<EditorViewExtended | undefined>();

  const value = React.useMemo(() => {
    function change(insert: string, start_line: number, end_line: number) {
      if (!view) return;
      //view.codeTriggeredChange = true;
      let from = view.state.doc.line(start_line).from;
      let to = view.state.doc.line(end_line).to;
      view.dispatch(
        view.state.update({
          changes: {
            from: from,
            to: to,
            insert: insert,
          },
        }),
      );
    }

    function change2(insert: string, start_line: number, end_line: number) {
      if (!view) return;
      view.codeTriggeredChange = true;
      let from = view.state.doc.line(start_line).from;
      let to = view.state.doc.line(end_line).to;
      view.dispatch(
        view.state.update({
          changes: {
            from: from,
            to: to,
            insert: insert,
          },
        }),
      );
    }

    function moveLines(
      start_line: number,
      end_line: number,
      line_target: number,
      inverse: boolean,
    ) {
      if (!view) return;
      const from = view.state.doc.line(start_line).from;
      const to = view.state.doc.line(end_line).to;
      const to2 = view.state.doc.line(line_target).from;
      const text = view.state.doc.slice(from, to);
      //view.codeTriggeredChange = true;
      const changes = [];
      if (inverse)
        changes.push({
          from: to2,
          insert: text,
        });
      changes.push({
        from: from,
        to: to,
        insert: "",
      });
      if (!inverse)
        changes.push({
          from: to2,
          insert: text,
        });
      view.dispatch(
        view.state.update({
          changes,
        }),
      );
    }

    function changeLine(line_insert: number, text: string) {
      if (!view) return;
      view.codeTriggeredChange = true;
      const line_state = view.state.doc.line(line_insert);
      view.dispatch(
        view.state.update({
          changes: {
            from: line_state.from,
            to: line_state.to,
            insert: text,
          },
        }),
      );
    }

    return {
      view,
      changeLine,
      setView,
      change,
      change2,
      moveLines,
    };
  }, [view]);

  return (
    <EditorChangeContext.Provider value={value}>
      {children}
    </EditorChangeContext.Provider>
  );
}
