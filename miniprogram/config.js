// Python/FastAPI 服务地址。正式环境需要 HTTPS，并加入微信 request 合法域名。
const API_BASE_URL = "https://api.example.com/api/v1";
// 开发者工具可直接使用内置演示数据；接通 Python API 后改为 false。
const USE_MOCK_DATA = true;

module.exports = {
  API_BASE_URL,
  USE_MOCK_DATA,
};
