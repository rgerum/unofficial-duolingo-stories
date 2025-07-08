import { compile, run } from "@mdx-js/mdx";
import { VFile } from "vfile";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
//import rehypeMdxCodeProps from "rehype-mdx-code-props";
//import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

import {
  Nodes as HastNodes,
  Root as HastRoot,
  Parent as HastNode,
  Parent,
} from "hast";
//import { Nodes as MdastNodes, Root as MdastRoot } from "mdast";

//import { PluggableList } from "@mdx-js/mdx/lib/core";

export default async function process_mdx(
  value: string,
  show = "hast",
  offset = 0,
  positions = true,
) {
  const development = false;
  const generateJsx = false;
  const outputFormatFunctionBody = false;

  //const recmaPlugins: PluggableList = [];
  //const rehypePlugins: PluggableList = [];
  //const remarkPlugins: PluggableList = [];

  // regex replacements inspired by SmartyPants
  //value = value.replace(/---/g, "&#8212;");
  //value = value.replace(/--/g, "&#8211;");
  //value = value.replace(/\.\.\./g, "&#8230;");
  //value = value.replace(/\. \. \./g, "&#8230;");

  //if (directive) remarkPlugins.unshift(remarkDirective)
  //remarkPlugins.unshift(remarkFrontmatter);
  // remarkPlugins.unshift(remarkGfm);
  // remarkPlugins.unshift(remarkMath);
  // remarkPlugins.unshift(rehypeMdxCodeProps);
  // rehypePlugins.unshift(rehypeKatex);
  //if (raw) rehypePlugins.unshift([rehypeRaw, {passThrough: nodeTypes}])

  const file = new VFile({
    basename: "example.mdx",
    value,
  });

  //if (show === "esast") recmaPlugins.push([captureEsast]);
  //if (show === "hast") rehypePlugins.push([captureHast]);
  //if (show === "mdast") remarkPlugins.push([captureMdast]);
  let ast: HastNode | null = null;

  await compile(file, {
    development: show === "result" ? false : development,
    jsx: show === "code" || show === "esast" ? generateJsx : false,
    outputFormat:
      show === "result" || outputFormatFunctionBody
        ? "function-body"
        : "program",
    //recmaPlugins,
    rehypePlugins: [rehypeKatex, captureHast],
    remarkPlugins: [remarkMath, remarkGfm],
  });

  if (show === "result") {
    return await run(String(file), {
      Fragment,
      jsx,
      jsxs,
      baseUrl: window.location.href,
    });
  }

  function addOffset(tree: any) {
    if (tree.position) {
      tree.position.start.line += offset;
      tree.position.end.line += offset;
    }
    if (tree.children)
      for (const i of tree.children || []) {
        addOffset(i);
      }
  }
  if (ast) {
    if (offset) addOffset(ast);
    return ast;
  }

  return {} as HastNode;

  function clean(tree: any) {
    delete tree.position;
    for (const i of tree.children || []) {
      clean(i);
    }
  }

  function captureHast() {
    return function (tree: HastRoot) {
      let clone = structuredClone(tree);
      if (!positions) clean(clone);
      // delete text nodes with "\n"
      clone.children = clone.children.filter(
        (i) => i.type !== "text" || i.value !== "\n",
      );
      ast = clone;
    };
  }
}
