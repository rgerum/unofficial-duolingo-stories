import { ExerciseTranslate } from "./exercise_translate";
import { ExerciseCompose } from "./exercise_compose";
import { ExerciseFillText } from "./exercise_fill_text";
import React from "react";
import ExerciseMatch from "./exercise_match";
import ExerciseFillChoice from "./exercise_fill_choice";

export default function Part({ data, ...props }) {
  if (data.type === "translate") {
    return <ExerciseTranslate data={data} {...props} />;
  } else if (data.type === "compose") {
    return <ExerciseCompose data={data} {...props} />;
  } else if (data.type === "fill_text") {
    return <ExerciseFillText data={data} {...props} />;
  } else if (data.type === "match") {
    return <ExerciseMatch data={data} {...props} />;
  } else if (data.type === "fill_choice") {
    return <ExerciseFillChoice data={data} {...props} />;
  }
}
