try {
  var g = new URLSearchParams(location.search).get("giscus");
  if (g) {
    sessionStorage.setItem("__giscus_oauth_pending__", g);
    sessionStorage.setItem("__giscus_oauth_pending_ts__", String(Date.now()));
    // 与 giscus client.js 一致：尽早写入 localStorage，避免 Vue Router 抹掉 ?giscus= 后丢登录态
    localStorage.setItem("giscus-session", JSON.stringify(g));
  }
} catch (e) {}
