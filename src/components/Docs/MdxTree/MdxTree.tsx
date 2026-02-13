"use no memo";
import React from "react";
import { Fragment } from "react/jsx-runtime";

import Link from "next/link";

import { MDXComponents } from "mdx/types";
import styles from "@/app/docs/[[...slug]]/layout.module.css";

function startsLowerCase(tagName: string) {
  return (
    tagName && tagName.substring(0, 1) === tagName.substring(0, 1).toLowerCase()
  );
}

function node_to_string(children: any) {
  let value = "";
  if (typeof children === "string") value = children;
  else if (typeof children === "object")
    value = (children as string[]).join("");
  return value;
}

function save_tag(tag: string) {
  try {
    tag = node_to_string(tag);
    return tag.trim().toLowerCase().replace(/\s+/g, "-");
  } catch (e) {
    return null;
  }
}

function Video({
  src,
  ...props
}: { src: string } & React.VideoHTMLAttributes<any>) {
  return (
    <video className={"mx-auto"} controls {...props}>
      <source src={src} />
      Your browser does not support the video tag.
    </video>
  );
}

const components: MDXComponents = {
  blockquote: "blockquote",
  br: "br",
  Video: Video,
  em: "em",
  h1: "h1",
  h2: (props: any) => (
    <h2 {...props} id={save_tag(props.children)}>
      {props.children}
    </h2>
  ),
  h3: (props: any) => (
    <h3 {...props} id={save_tag(props.children)}>
      {props.children}
    </h3>
  ),
  h4: "h4",
  h5: "h5",
  h6: "h6",
  hr: "hr",
  li: "li",
  ol: "ol",
  p: "p",
  strong: "strong",
  ul: "ul",
  /* gfm */
  del: "del",
  input: "input",
  section: "section",
  sup: "sup",
  table: "table",
  tbody: "tbody",
  td: "td",
  th: "th",
  thead: "thead",
  tr: "tr",

  span: "span",

  Info: (props) => (
    <p {...props} className={styles.box + " " + styles.info}>
      {props.children}
    </p>
  ),
  Warning: (props) => (
    <p {...props} className={styles.box + " " + styles.warning}>
      {props.children}
    </p>
  ),
  Alert: (props) => (
    <p {...props} className={styles.box + " " + styles.alert}>
      {props.children}
    </p>
  ),
  Channel: (props) => (
    <Link {...props} className={styles.channel_link}>
      {props.children}
    </Link>
  ),
  a: (props) => <Link href={props.href as string}>{props.children}</Link>,
  Image: (props) => (
    <div className={styles.image_wrapper}>{props.children}</div>
  ),
};

function getTreeLeaveID(i: any, index: number) {
  for (const attr of i.attributes || []) {
    if (attr.name === "id") {
      return attr.value;
    }
  }
  return index;
}

function toCamelCase(cssProperty: string) {
  return cssProperty
    .split("-")
    .map((part, index) => {
      // If it's the first part, return it as is. Otherwise, capitalize the first letter.
      return index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function MdxTreeRoot({
  children,
  Code,
  in_editor,
}: {
  children: any;
  Code: any;
  in_editor: boolean;
}) {
  return (
    <>
      {children.map((d: any, index: number) => (
        <MdxTree
          key={getTreeLeaveID(d, index)}
          {...d}
          in_editor={in_editor}
          Code={Code}
        />
      ))}
    </>
  );
}

function MdxTree({
  type,
  tagName,
  name,
  value,
  children,
  properties,
  position,
  attributes,
  in_editor,
  Code,
}: {
  type: string;
  tagName: string;
  name: string;
  value: any;
  children: any[];
  properties: any;
  position: any;
  attributes: any;
  in_editor: boolean;
  Code: any;
}) {
  const my_components = components;

  if (type === "text") return value;
  let Element: any = my_components[tagName];
  if (type === "root") Element = Fragment;
  if (type === "mdxJsxFlowElement") Element = my_components[name];
  if (type === "mdxJsxTextElement") Element = my_components[name];

  if (Element === undefined) {
    if (my_components[tagName]) Element = my_components[tagName];
    else if (startsLowerCase(tagName)) {
      Element = tagName;
    } else Element = Fragment;
  }
  if (Element === "hr") return <hr />;
  if (Element === "br") return <br />;
  if (Element === "img") return <img alt={""} {...properties} />;

  // convert camelCase to kebab-case
  if (properties?.ariaHidden) {
    properties["aria-hidden"] = properties.ariaHidden;
    delete properties.ariaHidden;
  }

  if (properties?.className && typeof properties?.className !== "string")
    properties.className = properties.className.join(" ");

  // convert camelCase to kebab-case
  if (properties?.class) {
    properties.className = properties.class.split(",").join(" ");
    delete properties.class;
  }

  if (properties?.style) {
    if (typeof properties.style === "string") {
      const style: { [key: string]: string } = {};
      for (const p of properties.style.split(";")) {
        const [key, value] = p.split(":");
        style[toCamelCase(key)] = value;
      }
      properties.style = style;
    }
  }
  if (!properties) properties = {};
  if (position && Element !== Fragment && in_editor) {
    properties["data-start"] = position.start.line;
    properties["data-end"] = position.end.line;
    if (typeof Element !== "string") {
      properties["position"] = position;
      //properties["in_editor"] = in_editor;
    }
  }
  if (type === "mdxJsxFlowElement" || type === "mdxJsxTextElement") {
    if (attributes) {
      for (const attr of attributes) {
        if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          if (
            attr.value.value.startsWith("`") &&
            attr.value.value.endsWith("`")
          )
            properties[attr.name] = attr.value.value.substring(
              1,
              attr.value.value.length - 1,
            );
          else if (
            attr.value.value.startsWith("{") &&
            attr.value.value.endsWith("}")
          ) {
            properties[attr.name] = JSON.parse(attr.value.value);
          } else properties[attr.name] = attr.value.value;
        } else properties[attr.name] = attr.value;
      }
    }
  }

  if (Element === Fragment) {
    //console.log("Unknown Element", tagName, name, properties);
  }
  if (Element === Fragment) properties = {};

  return (
    <Element {...properties}>
      {children !== undefined &&
        children.map((d, index) =>
          d.type === "text" ? d.value : <MdxTree key={index} {...d} />,
        )}
    </Element>
  );
}
export default MdxTreeRoot;
