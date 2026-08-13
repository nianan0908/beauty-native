// 部署 Web 项目后，只需把这里改成顾客端所在的 HTTPS 地址。
// 该域名还需要添加到微信公众平台的“小程序业务域名”中。
const CUSTOMER_H5_BASE_URL = "https://demo.example.com/";
// Python/FastAPI 服务地址。正式环境需要 HTTPS，并加入微信 request 合法域名。
const API_BASE_URL = "https://api.example.com/api/v1";
// 开发者工具可直接使用内置演示数据；接通 Python API 后改为 false。
const USE_MOCK_DATA = true;

function buildCustomerUrl(page) {
  const separator = CUSTOMER_H5_BASE_URL.includes("?") ? "&" : "?";
  return `${CUSTOMER_H5_BASE_URL}${separator}shop=qiguang&page=${encodeURIComponent(page || "首页")}&source=wechat-mini-program`;
}

module.exports = {
  CUSTOMER_H5_BASE_URL,
  API_BASE_URL,
  USE_MOCK_DATA,
  buildCustomerUrl,
};
