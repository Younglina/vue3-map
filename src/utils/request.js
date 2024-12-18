// import useUserStore from '@/store/user.js' //引入仓库，使用的是pinia
import axios from "axios";
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取用户令牌
    let token = localStorage.getItem("WX_TOKEN");
    // 设置请求头
    const header = {
      // 'Content-Type': 'application/json',
      // appId: "tanji_travel",
      // timestamp,
      // sign,
      ...options.header, // 可以传入额外的请求头参数
    };
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
    // 在发送请求之前执行拦截操作
    axios({
      url: "https://gw.xmbus.com:31232/api-travel" + options.url, //接收请求的API
      method: options.method || "GET", //接收请求的方式,如果不传默认为GET
      data: options.data || {}, //接收请求的data,不传默认为空
      params: options.params || {},
      header: header, //接收请求的header
    }).then(
      (res) => {
        resolve(res);
      },
      (err) => {
        reject(err);
      }
    );
  });
};

function md5Encrypt(message) {
  return CryptoJS.MD5(message).toString();
}

export default request;
