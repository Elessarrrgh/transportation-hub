// Boostrap to identify correct repo branch for loader
(function () {
  const C   = window.__TH_CONFIG__ || {};
  const url = new URL(window.location.href);

  // Allow quick overrides by query string — e.g. ?thBranch=test
  const repoOwner = C.repoOwner || "Elessarrrgh";
  const repoName  = "transportation-hub"; // single repo
  const branch    = url.searchParams.get("thBranch") || C.branch || "main";
  const baseRaw   = C.baseRaw || "https://raw.githubusercontent.com";

  // Compute base path for raw JSONs
  const BASE = `${baseRaw}/${repoOwner}/${repoName}/${branch}`;

  const isProd = branch === "main";
  const bust   = isProd ? "" : `?v=${Date.now()}`;

  // Convert relative repo paths into absolute URLs
  function resolve(pathOrUrl) {
    if (!pathOrUrl) return pathOrUrl;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // already absolute
    const cleanPath = pathOrUrl.replace(/^\/+/, "");
    return `${BASE}/${cleanPath}${bust}`;
  }

  window.__TH_ENV__ = { repoOwner, repoName, branch, BASE, isProd };
  window.__TH_ENDPOINTS__ = {
    base: BASE,
    json: (path) => resolve(path),
    resolve
  };

  // Optional badge on test/staging pages so nobody confuses them for prod
  if (!isProd) {
    const badge = document.createElement("div");
    badge.textContent = `Dev Branch • ${branch}`;
    Object.assign(badge.style, {
      position: "fixed",
      zIndex: 99999,
      top: "8px",
      right: "8px",
      background: "#222",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      opacity: "0.8",
      pointerEvents: "none"
    });
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(badge));
  }
})();
