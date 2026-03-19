// 🚀 Deterministic + stable (no random = no re-render lag)

export const encodeMessage = (msg, id) => {
  const varName = `data_${id}`;

  return `/**
 * Message Module
 * Stable Build
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