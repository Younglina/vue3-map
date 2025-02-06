// import useUserStore from '@/store/user.js' //引入仓库，使用的是pinia
import axios from "axios";
// const baseUrl = "https://gw.xmbus.com:31232/api-travel";
const baseUrl = "https://www.xmlenzrd.com:31232/api-tanji";
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 设置请求头
    const headers = {
      // 'Content-Type': 'application/json',
      // appId: "tanji_travel",
      // timestamp,
      // sign,
      // "X-maas-Tenantid": "zh00002",
      "X-maas-Tenantid": "1",
      "Accept-Language": "zh-CN,zh;q=0.9",
      ...options.headers, // 可以传入额外的请求头参数
    };
    // 在发送请求之前执行拦截操作
    axios({
      ...options,
      headers,
      url: baseUrl + options.url, //接收请求的API
    }).then(
      (res) => {
        resolve(res.data);
      },
      (err) => {
        console.log(err.response);
        showToast(err.response.data?.userTip || "服务异常");
        reject(err.response);
      }
    );
  });
};

function md5Encrypt(message) {
  return CryptoJS.MD5(message).toString();
}

export default request;
