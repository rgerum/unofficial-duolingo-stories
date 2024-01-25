import React from "react";
import Part from "./exercise";

export default function Lesson({ elements, onFinished }) {
  const [current, setCurrent] = React.useState(0);

  function onChecked() {
    setCurrent(current + 1);
    if (current === elements.length - 1) {
      onFinished();
    }
  }

  function getActive(i) {
    if (i < current) return -1;
    if (i === current) return 0;
    return 1;
  }

  //return <Preview elements={elements} />;
  return (
    <>
      {elements.map((data, i) => (
        <Part key={i} active={getActive(i)} data={data} onChecked={onChecked} />
      ))}
    </>
  );
}
