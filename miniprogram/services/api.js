const { API_BASE_URL, USE_MOCK_DATA } = require("../config");
const mock = require("./mock-data");

function headers(user) {
  return {
    "content-type": "application/json",
    "X-Actor-ID": user.id,
    "X-Role": user.role,
    "X-Merchant-ID": user.merchantId,
    "X-Store-ID": user.storeId || "",
  };
}

function request(path, user, options = {}) {
  if (USE_MOCK_DATA) return Promise.resolve(mock.handle(path, user, options));
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: headers(user),
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data);
        else reject(new Error(response.data && (response.data.message || response.data.detail) || "请求失败"));
      },
      fail: reject,
    });
  });
}

module.exports = {
  dashboard(user) { return Promise.resolve(mock.dashboard(user)); },
  appointments(user) { return Promise.resolve(mock.appointments(user)); },
  stocks(user) { return request(`/inventory/stocks${user.role === "owner" ? "" : `?store_id=${user.storeId}`}`, user); },
  transactions(user, status) { return request(`/inventory/transactions${status ? `?status=${encodeURIComponent(status)}` : ""}`, user); },
  submitInventoryRequest(user, data) { return request("/inventory/requests", user, { method: "POST", data }); },
  approve(user, id) { return request(`/inventory/requests/${id}/approve`, user, { method: "POST" }); },
  reject(user, id) { return request(`/inventory/requests/${id}/reject`, user, { method: "POST" }); },
};
