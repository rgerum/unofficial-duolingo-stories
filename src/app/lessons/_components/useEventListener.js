import { useEffect } from "react";

export function useEventListener(type, key_event_handler) {
  useEffect(() => {
    window.addEventListener(type, key_event_handler);
    return () => {
      window.removeEventListener(type, key_event_handler);
    };
  }, [type, key_event_handler]);
}
