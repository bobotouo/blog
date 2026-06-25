import { randomBytes } from "node:crypto";
import { oauthRedirectUri } from "~/server/utils/decap-oauth";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const clientId = config.oauthGithubClientId as string;
  if (!clientId) {
    throw createError({
      statusCode: 500,
      statusMessage: "OAUTH_GITHUB_CLIENT_ID is not configured",
    });
  }

  const redirectUri = oauthRedirectUri(event);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    state: randomBytes(8).toString("hex"),
  });

  return sendRedirect(
    event,
    `https://github.com/login/oauth/authorize?${params.toString()}`,
    302,
  );
});
