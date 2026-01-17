import React from "react";

const NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function useKeypress(
  key: string,
  callback: (event: KeyboardEvent | number) => void,
  deps?: React.DependencyList,
  eventType: "keypress" | "keydown" = "keypress",
) {
  const actualEventType = key === "Escape" ? "keydown" : eventType;

  let requireCtrl = false;
  let targetKey = key;
  if (key.startsWith("Ctrl+") || key.startsWith("ctrl+")) {
    requireCtrl = true;
    targetKey = key.substring(5).toLowerCase();
  }

  React.useEffect(() => {
    function listen(event: KeyboardEvent) {
      if (requireCtrl && !event.ctrlKey) return;
      if (targetKey === "number" && NUMBERS.includes(event.key)) {
        return callback(parseInt(event.key));
      } else if (event.code === targetKey || event.key === targetKey) {
        return callback(event);
      }
    }
    window.addEventListener(actualEventType, listen);
    return () => window.removeEventListener(actualEventType, listen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? [targetKey, callback]);
}

export default useKeypress;
