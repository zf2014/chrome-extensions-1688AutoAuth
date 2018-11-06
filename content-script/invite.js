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
let serviceType;
let companyName;
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
  console.log(
    "[类型:%s] & [邮箱:%s] & [公司名:%s]",
    serviceType,
    toEmailAddr,
    companyName
  );
}

function doAuth(config) {
  let $button = $("button");
  console.log("认证:" + inviteLink);
  /* 删除注释 */
  $button.click();
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
  let timestamp = new Date().getTime();
  let orderNo = location.search.split("&").reduce((obj, item) => {
    var arr = item.split("=");
    obj[arr[0]] = arr[1];
    return obj;
  }, {})["id"];
  let mailData = {
    projectName: "TIC_1688",
    businessType: "310001",
    buType: "ALL",
    mailType: 1,
    orderNo,
    sendMail: [
      // "simon.zhu@sgs.com",
      toEmailAddr,
      "Corey.Cheng@sgs.com",
      "Jeremiah.yu@sgs.com",
      "Dasiy.Wang@sgs.com"
    ].join(","),
    item: {
      companyName,
      serviceType
    }
  };
  let pid = "pcode.tic";
  let pcode = "Sgs123!";

  let pidAndCodeMD5 = CryptoJS.MD5(`${pid}${pcode}`.toUpperCase());
  let pidAndCodeStr = pidAndCodeMD5.toString().toUpperCase();
  let sign = CryptoJS.MD5(
    `${JSON.stringify(mailData)}${pidAndCodeStr}${timestamp}`
  );

  console.log(toEmailAddr);

  return fetch(
    "https://apiuat.sgsonline.com.cn/ticSend/openapi/api.v1.send/SysMailMsgSendAction/sendTemplateMail",
    {
      method: "POST", // or 'PUT'
      // body: JSON.stringify({ data: mailData }),
      body: JSON.stringify(mailData),
      headers: {
        timestamp,
        sign,
        pid
        // "Content-Type": "application/json"
      }
    }
  ).then(response => {
    return response.json().then(result => {
      return result;
    });
    // resultCode: "0"
    // resultMsg: "Successful"
    // console.log(args);
  });
}

toEmailAddr = findPageFieldByText("联系人邮箱");
serviceType = findPageFieldByText("用户订购服务类型");
serviceType = serviceType.substring(0, serviceType.indexOf("（"));
companyName = findPageFieldByText("公司名");
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
  if (launch > 0) {
    doLaunch(config);
  }
});
