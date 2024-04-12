import React from "react";

const NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function useKeypress(key, callback, deps, event = "keypress") {
  if (key === "Escape") event = "keydown";
  if (deps === undefined) {
    deps = [key, callback];
  } else {
    deps = [key, ...deps];
  }
  React.useEffect(() => {
    function listen(event) {
      if (key === "number" && NUMBERS.includes(event.key)) {
        return callback(parseInt(event.key));
      } else if (event.code === key) {
        return callback(event);
      }
    }
    window.addEventListener(event, listen);
    return () => window.removeEventListener(event, listen);
  }, deps);
}

export default useKeypress;
