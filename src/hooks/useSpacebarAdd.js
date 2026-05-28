import { useEffect } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { matchShortcut } from "../utils/keyboard";

export function useSpacebarAdd(onAdd) {
  useEffect(() => {
    const handler = (event) => {
      const isInput =
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable);

      const prefs = useTrackerStore.getState().preferences;
      const shortcut = prefs.shortcuts?.quickAdd || "Alt+a";

      if (matchShortcut(event, shortcut) && !isInput) {
        event.preventDefault();
        onAdd();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAdd]);
}
