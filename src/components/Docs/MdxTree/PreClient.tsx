"use client";
import meta_to_obj from "@/utils/meta-to-obj";
import React from "react";
import { EditorChangeContext } from "./EditorChangeContextProvider";
import Playground from "@/components/Playground";
import getLineCount from "@/utils/get-line-count";
import MdxTree from "@/components/MdxTree/MdxTree";

function getCodeElementId(element: any) {
  try {
    return meta_to_obj(element.children[0]?.data?.meta).id;
  } catch (e) {
    return undefined;
  }
}

function getElementWithId(tree: any, id: string) {
  for (const child of tree.children) {
    if (getCodeElementId(child) === id) {
      return child;
    }
  }
  return undefined;
}

export default function Pre({ meta, code, properties }: {
  meta: any,
  code: string,
  properties: any
}) {
  //const meta = meta_to_obj(props.children[0].props?.data?.meta);
  const editor = React.useContext(EditorChangeContext);

  if (code.endsWith("\n")) code = code.slice(0, -1);

  //return <span>{props.children[0].props.children[0].value}</span>;

  const onChanged = React.useCallback(
    (code: string) => {
        if(!editor || !editor.view || !editor.view.tree) return
      code = code.trim();
      const element = getElementWithId(editor.view.tree, meta.id);
      const count_diff =
        Math.max(getLineCount(code), 1) -
        (element.position.end.line - element.position.start.line - 1);
      // props.children[0].props.children[0].value = code;
      editor.change2(
        code.trim(),
        element.position.start.line + 1,
        element.position.end.line - 1,
      );
      let found = false;
      for (const element of editor.view.tree.children) {
        if (getCodeElementId(element) === meta.id) {
          found = true;
          continue;
        }
        if (found && element.position) {
          element.position.start.line += count_diff;
          element.position.end.line += count_diff;
        }
      }
      element.position.end.line += count_diff;
    },
    [editor, meta.id],
  );
  return (
    <div
      id={meta?.id}
      data-start={properties["data-start"]}
      data-end={properties["data-end"]}
    >
      <Playground initialCode={code} onChanged={onChanged} {...meta} />
    </div>
  );
}
