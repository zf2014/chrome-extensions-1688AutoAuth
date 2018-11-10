// let now = new Date().toISOString("YYYY-MM-dd");

// TODO
let currentUrl = window.location.href;
let DATE_FORMAT = "YYYY-MM-DD";
let delayTime = 300;

// $(window).on("beforeunload", function() {
//   chrome.storage.sync.set({ launch: false });
//   event.returnValue = "你好呀";
// });

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   alert("updated from contentscript");
// });

function curry(fn, arity = fn.length) {
  return (function nextCurried(prevArgs) {
    return function curried(nextArg) {
      var args = prevArgs.concat([nextArg]);

      if (args.length >= arity) {
        return fn(...args);
      } else {
        return nextCurried(args);
      }
    };
  })([]);
}

let delayExcute = curry((time, fn) => {
  return window.setTimeout(fn, time);
})(delayTime);

let urlContain = curry((url, part) => {
  return url.indexOf(part) !== -1;
})(currentUrl);

// chrome.runtime.onMessage.addListener(function(
//   { config, launch = -1 },
//   sender,
//   sendResponse
// ) {
//   chrome.storage.sync.set({ config, launch });
// });

chrome.storage.onChanged.addListener(({ launch }) => {
  if (launch && launch.newValue > 0) {
    chrome.storage.sync.get(["config"], ({ config }) => {
      doLaunch(config, launch.newValue === 2 ? true : false);
    });
  }
});

// 刷新页面时
chrome.storage.sync.get(["config", "launch"], ({ config, launch }) => {
  if (launch > 0) {
    doLaunch(config);
  }
});

function doLaunch(config = {}, first = false) {
  let configTime = config["date"];
  let configPage = +config["page"];
  let pagePage = +$("#totalPages").val();

  configTime = configTime ? new Date(configTime) : new Date();
  let beginTime = dateFns.format(configTime, DATE_FORMAT);
  let endTime = dateFns.format(dateFns.addDays(configTime, 1), DATE_FORMAT);

  let endPageNo = configPage
    ? configPage > pagePage
      ? pagePage
      : configPage
    : +$("#totalPages").val();

  let currentPageNo = +$("#pageNo").val();

  let $inviteFrame;
  let $layer;
  let $layerInner;

  function isEmptyList() {
    return $("#deepQueryForm").find("table.fui-table").length === 0;
  }

  function isSameDay() {
    return $("#deepQueryForm")
      .find("tr:not(:first)")
      .toArray()
      .some(tr => {
        let $tr = $(tr);
        let day = $tr.find("td:nth(1)").html();
        return dateFns.isSameDay(configTime, new Date(day));
      });
  }

  function findInviteLinks() {
    return $("#deepQueryForm")
      .find("tr:not(:first)")
      .toArray()
      .filter(tr => {
        let $tr = $(tr);
        let str = $tr.find("td:nth(1)").html();
        // let str2 = $tr
        //   .find("td:nth(8)")
        //   .html()
        //   .trim();

        return (
          dateFns.isSameDay(configTime, new Date(str)) &&
          // str2 === "首次" &&
          !!$tr.find("td:nth(0) a[href*='deep_auth_invite']").length
        );
      })
      .map(tr => {
        return $(tr)
          .find("td:nth(0) a[href*='deep_auth_invite']")
          .attr("href");
      });
  }

  function goInvite(href) {
    if ($inviteFrame) {
      $inviteFrame.remove();
      $inviteFrame = null;
    }

    $(`<iframe src="${href}" style="display:none"></iframe>`).appendTo("body");
  }

  function doSearch() {
    $("#fca_query_list").click();
  }

  function nextPage() {
    console.debug(
      `------------------------------扫描结束------------------------------」`
    );
    if (endPageNo === 0 || currentPageNo === endPageNo) {
      chrome.storage.sync.set({ launch: -1 });
      chrome.storage.sync.get(
        ["count", "times"],
        ({ count = 0, times = 1 }) => {
          startCountDown({ total: count, times });
          chrome.storage.sync.set({ times: times + 1 });
        }
      );
      return;
    }
    let nPage = currentPageNo + 1;
    nPage = nPage > endPageNo ? endPageNo : nPage;

    window.setTimeout(() => {
      $(`a[data-page=${nPage}]`)[0].click();
    }, 1000);
  }

  function startCountDown({ total, times }) {
    let secs = +config["minute"] * 60;
    let timeId;

    timeId = window.setInterval(function() {
      secs -= 1;
      if (secs < 0) {
        chrome.storage.sync.set({ launch: 2 });
        window.clearInterval(timeId);
        insertLayerContent("正在操作中...", () => {
          showProcessedResult();
        });
        return;
      } else {
        insertLayerContent(
          `<span>第<span style="color: red; font-size: 16px;margin: 0 5px;">${times}</span>次扫描, 共认证邀约了<span style="color: red; font-size: 16px;margin: 0 5px;">${total}</span>条数据, ${secs}秒后将重新启动</span>`,
          () => {
            timeId && window.clearInterval(timeId);
          }
        );
      }
    }, 1000);
  }

  function showProcessedResult() {
    initLayer();
    chrome.storage.sync.get(["count", "times"], ({ count = 0, times = 1 }) => {
      insertLayerContent(
        `<span>第<span style="color: red; font-size: 16px;margin: 0 5px;">${times}</span>次扫描, 共认证邀约了<span style="color: red; font-size: 16px;margin: 0 5px;">${count}</span>条数据`
      );
    });
  }

  function initLayer() {
    $layer = $(
      `<div><div class='inner'><a>关闭</a><div class="content"></div></div></div>`
    )
      .css({
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 9999,
        width: "100%",
        height: "100%",
        background: "rgba(255,255,255,.6)",
        display: "flex",
        "justify-content": "center",
        "align-items": "center"
      })
      .appendTo("body");

    $layerInner = $layer.find(".inner").css({
      position: "relative",
      height: "100px",
      padding: "30px",
      "text-align": "center",
      "line-height": "100px",
      background: "#fff",
      border: "1px solid rgba(0,0,0,.6)"
    });
  }

  function removeLayer() {
    $layer && $layer.remove();
    $layer = null;
    $layerInner = null;
  }

  function stopLaunch() {
    chrome.storage.sync.set({ launch: -1, times: 1 });
  }

  function insertLayerContent(html, onclose = () => {}) {
    $layerInner
      .find(".content")
      .empty()
      .html(html);

    // 关闭
    $layerInner
      .find("a")
      .css({
        position: "absolute",
        right: "10px",
        top: "10px",
        height: "20px",
        "line-height": "20px",
        color: "red"
      })
      .off("click")
      .on("click", () => {
        removeLayer();
        onclose();
        stopLaunch();
      });
  }

  function initInput() {
    $("#fromDate").val(beginTime);
    $("#toDate").val(endTime);
  }

  $(function() {
    initLayer();
    initInput();

    insertLayerContent("正在操作中...", () => {
      showProcessedResult();
    });

    if (first) {
      chrome.storage.sync.set({ count: 0 });
      // delayExcute(doSearch);
      doSearch();

      return;
    }
    let inviteList = findInviteLinks();
    let inviteSize = inviteList.length;

    console.debug(
      `「------------------------------扫描开始-------------------------------`
    );
    console.debug(
      `[时间: ${dateFns.format(
        new Date(),
        `HH:mm:ss`
      )}] ¤ 列表信息: [总页码:${endPageNo}][当前页码:${currentPageNo}][当前条数:${inviteSize}]`
    );

    // inviteList.forEach(item => {
    //   goInvite(item);
    // });

    // let finishCount = 0;
    // window.nextInvite = function(id) {
    //   finishCount += 1;
    //   if (finishCount === inviteSize) {
    //     delayExcute(nextPage);
    //   }
    // };

    window.nextInvite = function(id) {
      if (id) {
        console.debug(
          `[时间: ${dateFns.format(
            new Date(),
            `HH:mm:ss`
          )}] ¤ 订单号为[${id}]的订单. 完成了认证!`
        );
      }

      chrome.storage.sync.get(["launch"], ({ launch }) => {
        if (launch === -1) {
          return;
        }
        if (inviteList.length > 0) {
          let item = inviteList.splice(0, 1);
          goInvite(item);
        } else {
          // delayExcute(nextPage);
          nextPage();
        }
      });
    };
    nextInvite();
  });
}
