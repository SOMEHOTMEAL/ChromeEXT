function escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildHtml(title, meta, tabs) {
  const list = tabs.map(t =>
    `<li><a href="${escapeHtml(t.url)}" target="_blank">${escapeHtml(t.title || t.url)}</a></li>`
  ).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui; padding: 24px; }
  .meta { opacity: 0.7; margin-bottom: 16px; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${escapeHtml(meta)}</div>
<ul>
${list}
</ul>
</body>
</html>`;
}

document.getElementById("export").onclick = async () => {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!active) return;

  const today = new Date().toISOString().slice(0, 10);
  let tabs, title, meta;

  if (active.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
    const group = await chrome.tabGroups.get(active.groupId);
    tabs = await chrome.tabs.query({ groupId: active.groupId, currentWindow: true });
    title = group.title || "Tab Group";
    meta = `${tabs.length} tabs · ${group.color} · ${today}`;
  } else {
    tabs = await chrome.tabs.query({ currentWindow: true });
    title = "Window Tabs";
    meta = `${tabs.length} tabs · ${today}`;
  }

  tabs = tabs.filter(t => t.url && !t.url.startsWith("chrome://"));

  const html = buildHtml(title, meta, tabs);
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));

  chrome.downloads.download({
    url,
    filename: `TabOpt - ${title} - ${today}.html`,
    saveAs: true
  });
};
