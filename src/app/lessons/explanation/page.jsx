"use server";
import React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import Interactive from "./Interactive";
import styles from "./explanation.module.css";

const input = `
# Welcome to Esperanto
First lets explain a bit about how to greet!

## Hello

+ ------------- + ------------ +
| English       | Esperanto    |
| ------------- | ------------ |
| Hello!        | Saluton!     |
| Good morning! | Bonan tagon! |
+ ------------- + ------------ +


| Item              | In Stock | Price |
| :---------------- | :------: | ----: |
| Python Hat        |   True   | 23.99 |
| SQL Hat           |   True   | 23.99 |
| Codecademy Tee    |  False   | 19.99 |
| Codecademy Hoodie |  False   | 42.99 |

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

`;

const components = {
  Interactive: (props) => (
    <Interactive {...props} className={styles.info}>
      {props.children}
    </Interactive>
  ),
  Red: (props) => <span className={styles.red}>{props.children}</span>,
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
