const accounts = [
  { id: "E001", role: "employee", roleName: "服务员工", name: "苏禾", initial: "苏", title: "资深美容师", merchantId: "T001", storeId: "MS001", storeName: "云锦路店", account: "staff" },
  { id: "E004", role: "manager", roleName: "门店店长", name: "陈妍", initial: "陈", title: "云锦路店店长", merchantId: "T001", storeId: "MS001", storeName: "云锦路店", account: "manager" },
  { id: "OWNER001", role: "owner", roleName: "商家老板", name: "林知夏", initial: "林", title: "栖光美学老板", merchantId: "T001", storeName: "全部门店", account: "boss" },
];

Page({
  data: { accounts, selected: 0, password: "demo123", error: "" },

  selectRole(event) {
    this.setData({ selected: Number(event.currentTarget.dataset.index), error: "" });
  },

  inputPassword(event) {
    this.setData({ password: event.detail.value, error: "" });
  },

  login() {
    if (this.data.password !== "demo123") {
      this.setData({ error: "演示账号密码为 demo123" });
      return;
    }
    getApp().setAssistantUser(this.data.accounts[this.data.selected]);
    wx.redirectTo({ url: "/pages/assistant/dashboard" });
  },
});
