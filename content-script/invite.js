let DATE_FORMAT = "YYYY-MM-DD";
let delayTime = 300;
let inviteLink = window.location.href;

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

let nextMonth = dateFns.addMonths(new Date(), 1);
let toEmailAddr;
let orderType;
let inviteHistory;

function findPageFieldByText(text) {
  return $(".name")
    .filter((index, elem) => {
      return $(elem)
        .html()
        .trim()
        .includes(text);
    })
    .first()
    .next()
    .html()
    .trim();
}

function initPage(config) {
  let configTime = config["date"];
  configTime = configTime ? new Date(configTime) : new Date();

  $('[name="_fm.d._0.in"]').val(
    dateFns.format(nextMonth, `${DATE_FORMAT} HH:mm:ss`)
  );
  $('[name="_fm.d._0.inv"]').val(
    `${dateFns.format(configTime, DATE_FORMAT)}发送邮件邀约`
  );
  console.log("[类型:%s] & [邮箱:%s]", orderType, toEmailAddr);
}

function doAuth(config) {
  let $button = $("button");
  console.log("认证:" + inviteLink);
  /* 删除注释 */
  // $button.click();
  chrome.storage.sync.get(["count"], ({ count = 0 }) => {
    count += 1;
    chrome.storage.sync.set({ count }, () => {
      sendMail();
      delayExcute(feedback);
    });
  });
}

function feedback() {
  window.top.nextInvite();
}

function sendMail() {
  console.log(toEmailAddr);
  let mailData = {
    mailSubject: "主题",
    mailText: "邮件内容",
    mailTo: ["zzmsimon@hotmail.com", "zhang150339894@qq.com"],
    mailCc: [""],
    ossFiles: []
  };
  fetch("http://10.205.139.1/NotificationApi/notification/sendMail", {
    method: "POST", // or 'PUT'
    body: JSON.stringify(mailData), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json"
    }
  }).then((...args) => {
    console.log(args);
  });
}

toEmailAddr = findPageFieldByText("联系人邮箱");
orderType = findPageFieldByText("用户订购服务类型");
inviteHistory = findPageFieldByText("预约历史");

function doLaunch(config) {
  if (inviteHistory !== "无历史邀约信息") {
    feedback();
  } else {
    delayExcute(curry(initPage)(config));
    delayExcute(curry(doAuth)(config));
  }
}

chrome.storage.sync.get(["config", "launch"], ({ config, launch }) => {
  doLaunch(config);
  return;
  if (launch > 0) {
    doLaunch(config);
  }
});
