try {
  var g = new URLSearchParams(location.search).get("giscus");
  if (g) sessionStorage.setItem("__giscus_oauth_pending__", g);
} catch (e) {}
