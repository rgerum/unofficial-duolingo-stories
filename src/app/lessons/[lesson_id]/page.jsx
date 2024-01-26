"use client";
import React, { useEffect } from "react";
import Lesson from "../_components/lesson";
import { convertToComposeObject } from "./convert_parts";
import textCompare from "../_components/textCompare";
import { CardCorrect, CardFalse } from "../_components/parts/card";
import TextCorrected from "../_components/parts/text_corrected";
import useShuffle from "../_components/useShuffle";
import { shuffle } from "../../../components/story/includes";
import { useRouter } from "next/navigation";

const input = `
[words]
- saluton
- bonan
- tagon
- bonvolu
- dankon


[compose]
> Saluton!
% saluton; bonan, tagon, dankon

> Hello!
% hello; night, please, thank


[compose]
> Mi nomiĝas Carlo.
% mi, nomiĝas, Carlo; estas, loĝas, dankon

> My name is Carlo.
% my, name, is, Carlo; he, called, live

[match]
- saluton <> hello
- bonan nokton <> good night
- bonan tagon <> good morning 
- bonvolu <> please 
- dankon <> thank you 

[compose]
> Kiel vi fartas?
% kiel, vi, fartas; estas, nomiĝas, bonvolu

> How are you?
% how, are, you; where, live, thank


[compose]
> Bone, dankon.
% bone, dankon; kiel, vi, ĝis

> Fine, thank you.
% fine, thank, you; how, are, goodbye


[compose]
> Kie vi loĝas?
% kie, vi, loĝas; kiel, fartas, nomiĝas

> Where do you live?
% where, do, you, live; how, are, name


[compose]
> Mi loĝas en Canada.
% mi, loĝas, en, Canada; nomiĝas, estas, vi

> I live in Canada.
% I, live, in, Canada; my, name, is


[compose]
> Ĝis revido!
% ĝis, revido; bone, dankon, kie

> Goodbye!
% goodbye; please, thank, where


[compose]
> Bonvolu.
% bonvolu; dankon, pardonu, loĝas

> Please.
% please; thank, excuse, live

[compose]
> Dankon.
% dankon; bonvolu, pardonu, kiel

> Thank you.
% thank, you; please, excuse, how


[compose]
> Pardonu.
% pardonu; dankon, bonvolu, kie

> Excuse me.
% excuse, me; thank, please, where
`;

export default function Page() {
  const [current, setCurrent] = React.useState(1);
  let elements = convertToComposeObject(input);

  if (0) {
    let aa = [
      textCompare("My name is Carlo.", "my text is Carlos"),
      textCompare("Hello!", "hallo this"),
      textCompare("Hello!", "hallo"),
      textCompare("Hello my a name!", "Hello name and not"),
    ];

    return (
      <>
        {aa.map((a) => (
          <>
            <CardFalse>
              <TextCorrected parts={a.correted1} />{" "}
            </CardFalse>
            <CardCorrect>
              <TextCorrected parts={a.correted2} />{" "}
            </CardCorrect>
          </>
        ))}
      </>
    );
  }

  const [shuffled, setShuffled] = React.useState(false);
  const [order, setWords] = React.useState(
    [...Array(elements.length)].map((_, i) => i),
  );
  useEffect(() => {
    if (!shuffled) {
      setShuffled(true);
      setWords(shuffle([...order]));
    }
  }, [order, setWords, shuffled, setShuffled]);

  const router = useRouter();
  function onFinished() {
    router.push("/lessons");
  }

  if (!shuffled) return null;
  return (
    <Lesson
      elements={order.slice(0, 3).map((i) => elements[i])}
      onFinished={onFinished}
    />
  );
}
