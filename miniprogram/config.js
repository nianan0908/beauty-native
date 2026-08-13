// 部署 Web 项目后，只需把这里改成顾客端所在的 HTTPS 地址。
// 该域名还需要添加到微信公众平台的“小程序业务域名”中。
const CUSTOMER_H5_BASE_URL = "https://demo.example.com/";

function buildCustomerUrl(page) {
  const separator = CUSTOMER_H5_BASE_URL.includes("?") ? "&" : "?";
  return `${CUSTOMER_H5_BASE_URL}${separator}shop=qiguang&page=${encodeURIComponent(page || "首页")}&source=wechat-mini-program`;
}

module.exports = {
  CUSTOMER_H5_BASE_URL,
  buildCustomerUrl,
};
