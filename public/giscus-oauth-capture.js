try {
  var g = new URLSearchParams(location.search).get("giscus");
  if (!g) return;
  sessionStorage.setItem("__giscus_oauth_pending__", g);
  sessionStorage.setItem("__giscus_oauth_pending_ts__", String(Date.now()));
  // 钉住地址栏，防止框架 hydration 抹掉 ?giscus=
  var u = new URL(location.href);
  if (!u.searchParams.get("giscus")) {
    u.searchParams.set("giscus", g);
    history.replaceState(null, "", u.toString());
  }
} catch (e) {}
