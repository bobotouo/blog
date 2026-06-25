/** Giscus 讨论标题候选（pathname 映射无 leading slash，旧 specific 映射可能有） */
export function giscusDiscussionSearchTerms(pagePath: string): string[] {
  const pathOnly = pagePath.split("?")[0].split("#")[0].trim();
  const trimmed = pathOnly.replace(/\/$/, "") || "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const noSlash = withSlash.slice(1) || "index";
  return [...new Set([noSlash, withSlash])];
}

export function escapeForGitHubSearchTitle(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
