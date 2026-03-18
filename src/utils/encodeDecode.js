const randomVar = () => {
  const vars = ["data", "payload", "cache", "temp", "buffer"];
  return vars[Math.floor(Math.random() * vars.length)];
};

export const encodeMessage = (msg, id) => {
  const varName = randomVar();

  return `/**
 * Module: MessageService
 * Build: v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}
 */
export const msg_${id} = () => {
  const ${varName} = "${btoa(msg)}";
  return atob(${varName});
};`;
};

export const decodeMessage = (encoded) => {
  try {
    const match = encoded.match(/"(.*?)"/);
    return match ? atob(match[1]) : "";
  } catch {
    return "";
  }
};