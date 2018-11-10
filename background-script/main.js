let openedTabs = {};

function isListPage(url) {
  return (
    url && url.indexOf("http://agate.1688.com/auth/deep/deep_auth_list") == 0
  );
}

// 当匹配页面打开时
chrome.tabs.onCreated.addListener(({ id, url }) => {
  openedTabs[id] = url;

  chrome.storage.sync.get(["sent"], ({ sent = [] }) => {
    // 过滤往日已发送订单号
    chrome.storage.sync.set({
      sent: sent.filter(item => {
        return item && dateFns.isToday(new Date(item.time));
      })
    });

    if (isListPage(url)) {
      console.debug(
        `[时间: ${dateFns.format(
          new Date(),
          `HH:mm:ss`
        )}] ◇ 所有曾发送: ${sent.map(item => {
          return item.id;
        })}, 数量: ${sent.length}条`
      );
    }
  });
});

// 当匹配页面刷新时
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (isListPage(tab.url)) {
    chrome.pageAction.show(tabId);
  }
});

// 当匹配页面关闭时
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  let url = openedTabs[tabId];
  if (isListPage(url)) {
    chrome.storage.sync.set({
      launch: -1,
      count: 0,
      times: 1,
      config: {}
      // sent: []
    });
  }

  delete openedTabs[tabId];
});
