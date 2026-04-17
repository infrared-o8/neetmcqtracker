import { useEffect } from "react";

export function useSpacebarAdd(onAdd) {
  useEffect(() => {
    const handler = (event) => {
      const isInput =
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable);

      if (event.code === "Space" && !isInput) {
        event.preventDefault();
        onAdd();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAdd]);
}
