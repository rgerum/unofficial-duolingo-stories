import assert from "node:assert/strict";
import test from "node:test";

import { fix_audio_line_order } from "@/lib/editor/audio/fix_audio_line_order";

test("fix_audio_line_order moves a misplaced audio line below the hint line", () => {
  const text = [
    "[SELECT_PHRASE]",
    "> Selecciona la frase que falta",
    "Speaker790: Imaynalla, Zari. ¿[Kayqa~diarioykichu]?",
    "$9873/_35b47c16.mp3;9,0;6,978;8,435;13,543",
    "~ hola Zari este~es~tu~diario",
    "- Kay killa diariochu",
    "+ Kayqa diarioykichu",
  ].join("\n");

  assert.equal(
    fix_audio_line_order(text),
    [
      "[SELECT_PHRASE]",
      "> Selecciona la frase que falta",
      "Speaker790: Imaynalla, Zari. ¿[Kayqa~diarioykichu]?",
      "~ hola Zari este~es~tu~diario",
      "$9873/_35b47c16.mp3;9,0;6,978;8,435;13,543",
      "- Kay killa diariochu",
      "+ Kayqa diarioykichu",
    ].join("\n"),
  );
});

test("fix_audio_line_order moves the audio line below translation and pronunciation lines", () => {
  const text = [
    "Speaker790: Imaynalla",
    "$9873/_35b47c16.mp3;9,0",
    "~ hola",
    "^ ee-mine-ah-lah",
    "",
  ].join("\n");

  assert.equal(
    fix_audio_line_order(text),
    [
      "Speaker790: Imaynalla",
      "~ hola",
      "^ ee-mine-ah-lah",
      "$9873/_35b47c16.mp3;9,0",
      "",
    ].join("\n"),
  );
});

test("fix_audio_line_order fixes multiple misplaced audio lines", () => {
  const text = [
    "[LINE]",
    "Speaker1: Uno",
    "$1.mp3;1,0",
    "~ one",
    "",
    "[LINE]",
    "Speaker2: Dos",
    "$2.mp3;1,0",
    "~ two",
  ].join("\n");

  assert.equal(
    fix_audio_line_order(text),
    [
      "[LINE]",
      "Speaker1: Uno",
      "~ one",
      "$1.mp3;1,0",
      "",
      "[LINE]",
      "Speaker2: Dos",
      "~ two",
      "$2.mp3;1,0",
    ].join("\n"),
  );
});

test("fix_audio_line_order leaves correctly ordered text unchanged", () => {
  const text = [
    "[LINE]",
    "Speaker790: Imaynalla",
    "~ hola",
    "$9873/_35b47c16.mp3;9,0",
    "",
    "[LINE]",
    "> Narrator line without hints",
    "$1.mp3;1,0",
    "",
    "+ answer",
    "~ answer hint",
  ].join("\n");

  assert.equal(fix_audio_line_order(text), text);
});

test("fix_audio_line_order does not reorder across blank lines", () => {
  const text = ["Speaker1: Uno", "$1.mp3;1,0", "", "~ stray hint"].join("\n");

  assert.equal(fix_audio_line_order(text), text);
});
