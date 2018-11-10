$(function() {
  let DATE_FORMAT = "YYYY-MM-DD";
  let delayTime = 300;
  let inviteLink = window.location.href;
  let orderNo = window.location.search
    .substring(1)
    .split("&")
    .reduce((obj, item) => {
      var arr = item.split("=");
      obj[arr[0]] = arr[1];
      return obj;
    }, {})["id"];
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
  }

  function doAuth(config) {
    // let $button = $("button.submit-btn");

    /* 删除注释 */

    // $button.click();
    chrome.storage.sync.get(["count", "sent"], ({ count = 0, sent = [] }) => {
      let hasSend = sent.some(item => {
        return item && item.id === orderNo;
      });

      count += 1;
      chrome.storage.sync.set({ count }, () => {
        setTimeout(function() {
          // 如果未发送过
          if (!hasSend) {
            sendMail()
              .then(({ resultCode }) => {
                if (resultCode === "0") {
                  console.log(
                    "发送邮件 -> [类型:%s] & [邮箱:%s] & [公司名:%s]",
                    serviceType,
                    toEmailAddr,
                    companyName
                  );
                  // TODO 邮件发送成功 记录当前id
                  chrome.storage.sync.set(
                    {
                      sent: [
                        ...sent,
                        {
                          id: orderNo,
                          time: `${dateFns.format(new Date(), DATE_FORMAT)}`
                        }
                      ]
                    },
                    () => {
                      feedback();
                      clickAuthBtn();
                    }
                  );
                } else {
                  feedback();
                }
              })
              .catch(e => {
                console.log(`发送邮件[${toEmailAddr}]出现异常情况!`);
                feedback();
              });
          } else {
            console.log(`您好, 该邮箱[${toEmailAddr}]已经发送过!`);
            feedback();
            clickAuthBtn();
          }
        }, 0);

        // window.setTimeout(() => {
        //   if ($button.length > 0) {
        //     console.log("点击认证按钮:" + inviteLink);
        //     $button.click();
        //   }
        // }, 100);

        // delayExcute(feedback);
      });
    });
  }

  function clickAuthBtn() {
    let $button = $("button.submit-btn");
    if ($button.length > 0) {
      console.log("点击认证按钮:" + inviteLink);
      $button.click();
    }
  }

  function feedback() {
    window.top.nextInvite();
  }

  function sendMail() {
    // return Promise.resolve({ resultCode: 999 });

    // return Promise.reject("Error");

    let timestamp = new Date().getTime();
    let mailData = {
      projectName: "TIC_1688",
      businessType: "310001",
      buType: "ALL",
      mailType: 1,
      orderNo,
      sendMail: [
        // "zhang150339894@qq.com"
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
});
