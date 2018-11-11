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

  let $authButton = $("button.submit-btn");
  let isDev = true; // 开发环节

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
                // 发送成功
                if (resultCode === "0") {
                  console.debug(
                    `[时间: ${dateFns.format(
                      new Date(),
                      `HH:mm:ss`
                    )}] ※ 邮件发送成功`
                  );
                  console.debug(
                    `[时间: ${dateFns.format(
                      new Date(),
                      `HH:mm:ss`
                    )}] ※ 邮件发送公司信息 -> [客户类型:${serviceType}] & [客户邮箱:${toEmailAddr}] & [客户公司:${companyName}]`
                  );

                  chrome.storage.sync.set(
                    {
                      sent: [
                        ...sent,
                        {
                          id: orderNo,
                          time: `${dateFns.format(
                            new Date(),
                            `${DATE_FORMAT} HH:mm:ss`
                          )}`
                        }
                      ]
                    },
                    () => {
                      // 发送成功
                      clickAuthBtn();
                    }
                  );
                }
                // 邮件发送失败
                else {
                  console.debug(
                    `[时间: ${dateFns.format(
                      new Date(),
                      ` HH:mm:ss`
                    )}] ※ 邮件发送失败`
                  );
                  feedback();
                }
              })
              .catch(e => {
                console.debug(
                  `[时间: ${dateFns.format(
                    new Date(),
                    `HH:mm:ss`
                  )}] ※ 邮件服务异常[异常信息: ${e}]`
                );
                feedback();
              });
          } else {
            console.debug(
              `[时间: ${dateFns.format(
                new Date(),
                `HH:mm:ss`
              )}] ※ 该订单邮件曾经发送过`
            );
            clickAuthBtn();
          }
        }, 0);
      });
    });
  }

  function clickAuthBtn() {
    if ($authButton.length > 0) {
      if (isDev) {
        setTimeout(() => {
          console.debug(
            `[时间: ${dateFns.format(new Date(), `HH:mm:ss`)}] ※ 认证邀约成功`
          );

          chrome.storage.sync.get(["hits"], ({ hits = 0 }) => {
            hits += 1;
            chrome.storage.sync.set({ hits }, () => {
              feedback({ success: true });
            });
          });
        }, Math.floor(Math.random() * 1000));
      } else {
        $authButton.click();
      }
    }
  }

  function feedback() {
    console.debug(`---------------认证结束----------------»`);
    window.top.nextInvite(orderNo);
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
        ...(isDev
          ? ["zhang150339894@qq.com"]
          : [
              "simon.zhu@sgs.com",
              toEmailAddr,
              "Corey.Cheng@sgs.com",
              "Jeremiah.yu@sgs.com",
              "Dasiy.Wang@sgs.com"
            ])
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

  let needAuth = inviteHistory === "无历史邀约信息";

  function doLaunch(config) {
    if (!needAuth) {
      console.debug(
        `[时间: ${dateFns.format(new Date(), `HH:mm:ss`)}] ※ 该订单无需认证!`
      );
      feedback();
    } else {
      initPage(config);
      doAuth(config);

      // delayExcute(curry(initPage)(config));
      // delayExcute(curry(doAuth)(config));
    }
  }

  // 根据是否有按钮 来判断页面是由于点击按钮 还是 来自于列表连接的

  console.debug(`«---------------认证开始----------------`);
  console.debug(`★ 订单号:${orderNo} ★`);
  if ($authButton.length > 0) {
    chrome.storage.sync.get(["config", "launch"], ({ config, launch }) => {
      if (launch > 0) {
        doLaunch(config);
      }
    });
  } else {
    console.debug(
      `[时间: ${dateFns.format(new Date(), `HH:mm:ss`)}] ※ 认证邀约成功`
    );
    chrome.storage.sync.get(["hits"], ({ hits = 0 }) => {
      hits += 1;
      chrome.storage.sync.set({ hits }, () => {
        feedback({ success: true });
      });
    });
  }
});
