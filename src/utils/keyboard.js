export function formatEventKey(e) {
  const keys = [];
  if (e.ctrlKey) keys.push("Ctrl");
  if (e.altKey) keys.push("Alt");
  if (e.shiftKey) keys.push("Shift");
  if (e.metaKey) keys.push("Meta");

  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null;

  let keyName = e.code;
  if (e.code === "Space") keyName = "Space";
  else if (e.key === "Enter") keyName = "Enter";
  else if (e.key === "Tab") keyName = "Tab";
  else if (e.key === "Escape") keyName = "Escape";
  else if (e.code.startsWith("Key")) keyName = e.code.replace("Key", "");
  else if (e.code.startsWith("Digit")) keyName = e.code.replace("Digit", "");
  else keyName = e.key;

  keys.push(keyName);
  return keys.join("+");
}

export function matchShortcut(e, shortcutString) {
  if (!shortcutString) return false;
  const eventString = formatEventKey(e);
  // Compare case-insensitively just in case
  return eventString?.toLowerCase() === shortcutString.toLowerCase();
}
