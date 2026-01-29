"use no memo";
import React from "react";
//import { Code } from "bright";
import process_mdx from "./process_mdx";
import MdxTreeRoot from "../MdxTree";

async function CustomMDXServer({ source }: { source: string }) {
  try {
    const ast: any = await process_mdx(source, "hast", 0, false);
    return <MdxTreeRoot {...ast} in_editor={false} />;
  } catch (e) {
    //console.log(e);
    return <div>Parsing error</div>;
  }
}

export default CustomMDXServer;
