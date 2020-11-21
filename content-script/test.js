$(function() {
  function sendMail() {
    // return Promise.resolve({ resultCode: 999 });

    // return Promise.reject("Error");

    let timestamp = new Date().getTime();
    let isDev = true;
    let mailData = {
      projectName: "TIC_1688",
      businessType: "310001",
      buType: "ALL",
      mailType: 1,
      orderNo: isDev ? "test" : "1",
      sendMail: [
        ...(isDev
          ? ["zhang150339894@qq.com"]
          : [
              "simon.zhu@sgs.com",
              toEmailAddr,
              "carol-ca.chen@sgs.com",
              //"Jeremiah.yu@sgs.com",
              "Dasiy.Wang@sgs.com"
            ])
      ].join(","),
      item: {
        // companyName,
        // serviceType
      }
    };
    let pid = "pcode.tic";
    let pcode = "Sgs123!";

    let pidAndCodeMD5 = CryptoJS.MD5(`${pid}${pcode}`.toUpperCase());
    let pidAndCodeStr = pidAndCodeMD5.toString().toUpperCase();
    let sign = CryptoJS.MD5(
      `${JSON.stringify(mailData)}${pidAndCodeStr}${timestamp}`
    );

    // $.ajax({
    //   url:
    //     "https://api.sgsonline.com.cn/ticSend/openapi/api.v1.send/SysMailMsgSendAction/sendTemplateMail",
    //   method: "post",
    //   data: mailData,
    //   headers: {
    //     timestamp,
    //     sign,
    //     pid
    //   },
    //   complete(rst) {
    //     console.log(rst);
    //   }
    // });

    return fetch(
      //uat "https://apiuat.sgsonline.com.cn/ticSend/openapi/api.v1.send/SysMailMsgSendAction/sendTemplateMail",
      "https://api.sgsonline.com.cn/ticSend/openapi/api.v1.send/SysMailMsgSendAction/sendTemplateMail",
      {
        method: "POST", // or 'PUT'
        // body: JSON.stringify({ data: mailData }),
        body: JSON.stringify(mailData),
        headers: {
          timestamp,
          sign,
          pid
          // "Content-Type": "application/json"
        },
        mode: "cors"
      }
    ).then(response => {
      console.log(response);
      return response.json().then(result => {
        return result;
      });
      // resultCode: "0"
      // resultMsg: "Successful"
      // console.log(args);
    });
  }

  sendMail();
});
