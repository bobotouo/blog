import {
  oauthRedirectUri,
  renderDecapOAuthPage,
} from "~/server/utils/decap-oauth";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const clientId = config.oauthGithubClientId as string;
  const clientSecret = config.oauthGithubClientSecret as string;
  const code = getQuery(event).code as string | undefined;

  if (!clientId || !clientSecret) {
    setResponseHeader(event, "content-type", "text/html; charset=utf-8");
    return renderDecapOAuthPage("error", {
      provider: "github",
      message: "OAuth credentials not configured on server",
    });
  }

  if (!code) {
    setResponseHeader(event, "content-type", "text/html; charset=utf-8");
    return renderDecapOAuthPage("error", {
      provider: "github",
      message: "Missing authorization code",
    });
  }

  try {
    const redirectUri = oauthRedirectUri(event);
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed (${response.status})`);
    }

    const body = (await response.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!body.access_token) {
      throw new Error(body.error_description || body.error || "No access token");
    }

    setResponseHeader(event, "content-type", "text/html; charset=utf-8");
    return renderDecapOAuthPage("success", {
      token: body.access_token,
      provider: "github",
    });
  } catch (err) {
    setResponseHeader(event, "content-type", "text/html; charset=utf-8");
    return renderDecapOAuthPage("error", {
      provider: "github",
      message: err instanceof Error ? err.message : "OAuth failed",
    });
  }
});
