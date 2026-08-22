type ClipboardEnvironment = {
  clipboard?: Pick<Clipboard, "writeText">;
  document: Pick<Document, "body" | "createElement" | "execCommand">;
};

export async function copyToClipboard(
  text: string,
  environment: ClipboardEnvironment = {
    clipboard: navigator.clipboard,
    document,
  },
) {
  if (environment.clipboard) {
    await environment.clipboard.writeText(text);
    return;
  }

  const textarea = environment.document.createElement("textarea");
  textarea.value = text;
  Object.assign(textarea.style, {
    position: "fixed",
    inset: "0 auto auto 0",
    opacity: "0",
    pointerEvents: "none",
  });
  environment.document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    if (!environment.document.execCommand("copy")) {
      throw new Error("The browser rejected the copy command.");
    }
  } finally {
    textarea.remove();
  }
}
