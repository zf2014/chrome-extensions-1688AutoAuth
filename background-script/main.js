let currentUrl;

let tabsObj = {};

function checkForValidUrl(tabId, changeInfo, tab) {
  // tabsObj[tabId] = tab.url;
  // console.log(tabsObj);
  if (tab.url.indexOf("http://agate.1688.com/auth/deep/deep_auth_list") == 0) {
    chrome.pageAction.show(tabId);
  }
}

chrome.tabs.onCreated.addListener(({ id, url }) => {
  tabsObj[id] = url;

  chrome.storage.sync.get(["sent"], ({ sent = [] }) => {
    // TODO 清理部分数据
    console.log(
      `已发送邮件: ${sent.map(item => {
        return item.id;
      })}, 数量: ${sent.length}条`
    );

    chrome.storage.sync.set({
      sent: sent.filter(item => {
        return item && dateFns.isToday(new Date(item.time));
      })
    });
  });
});

chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  let currentUrl = tabsObj[tabId];
  console.log(tabsObj);

  if (
    currentUrl &&
    currentUrl.indexOf("http://agate.1688.com/auth/deep/deep_auth_list.htm") ===
      0
  ) {
    chrome.storage.sync.set({
      launch: -1,
      count: 0,
      config: {}
      // sent: []
    });
  } else {
    console.log("不相关页面");
  }

  delete tabsObj[tabId];
});

chrome.runtime.onMessage.addListener(result => {
  if (result.finish) {
    chrome.storage.sync.set({ launch: -1, count: 0 });
    // alert("本次自动化完成");
  }
});
