"use server";
import React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import Interactive from "./Interactive";
import styles from "./explanation.module.css";
import Table from "./table";

const input = `
# Welcome to Esperanto
First lets explain a bit about how to greet!

## Hello

<Table content="
Esperanto | English
Saluton | *Hello*
Bonan Tagon | *Good night*
"/>

<Interactive text="
[compose]
> Hello!
% hello; night, please, thank

> Saluton!
% saluton; bonan, tagon, dankon" />

## Nouns
In Esperanto all words that end with an <Red>-o</Red> are nouns.
This makes it very easy to see that these are nouns:
tag<Red>o</Red>, nokt<Red>o</Red>

## Pronouns
<Table content="
Esperanto | English
mi | *I*
ti | *you*
li | *he*
"/>

`;

const components = {
  Interactive: (props) => (
    <Interactive {...props} className={styles.info}>
      {props.children}
    </Interactive>
  ),
  Red: (props) => <span className={styles.red}>{props.children}</span>,
  Table: (props) => <Table {...props}>{props.children}</Table>,
};

function CustomMDX(props) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}

export default async function Page() {
  return (
    <div className={styles.explanation}>
      <CustomMDX source={input} />
    </div>
  );
}
