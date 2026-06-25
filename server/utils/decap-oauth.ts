/** Decap CMS OAuth 回调页：通过 postMessage 把 token 交还给 CMS 弹窗 */
import { getRequestURL } from "h3";

export function renderDecapOAuthPage(
  status: "success" | "error",
  content: Record<string, unknown> & { provider: string },
): string {
  const payload = JSON.stringify(content);
  return `<!doctype html><html><body><script>
const receiveMessage = (message) => {
  window.opener.postMessage(
    'authorization:${content.provider}:${status}:${payload.replace(/</g, "\\u003c")}',
    message.origin
  );
  window.removeEventListener("message", receiveMessage, false);
};
window.addEventListener("message", receiveMessage, false);
window.opener.postMessage("authorizing:${content.provider}", "*");
</script></body></html>`;
}

export function oauthRedirectUri(event: Parameters<typeof getRequestURL>[0]): string {
  const url = getRequestURL(event);
  return `${url.protocol}//${url.host}/api/callback`;
}
