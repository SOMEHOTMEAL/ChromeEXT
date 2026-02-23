function escapeHtml(s) {
  return (s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildHtml(title, meta, tabs) {
  const items = tabs.map(t =>
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
${items}
</ul>
</body>
</html>`;
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "export-tab-group",
    title: "Freeze tab group → HTML",
    contexts: ["page"]
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "export-tab-group") return;
  if (!tab) return;

  if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    console.warn("Tab is not in a group");
    return;
  }

  const group = await chrome.tabGroups.get(tab.groupId);
  const tabs = await chrome.tabs.query({ groupId: tab.groupId });

  const today = new Date().toISOString().slice(0, 10);

  const validTabs = tabs.filter(t =>
    t.url && !t.url.startsWith("chrome://")
  );

  const html = buildHtml(
    group.title || "Tab Group",
    `${validTabs.length} tabs · ${group.color} · ${today}`,
    validTabs
  );

  const dataUrl =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(html);

chrome.downloads.download({
  url: dataUrl,
  filename: `TabOpt - ${group.title || "group"} - ${today}.html`,
  saveAs: true
});
});