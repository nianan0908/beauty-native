const { CUSTOMER_H5_BASE_URL, buildCustomerUrl } = require("../../config");

Page({
  data: {
    customerUrl: "",
    configured: false,
    loadFailed: false,
  },

  onLoad(options) {
    wx.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] });
    const configured = !CUSTOMER_H5_BASE_URL.includes("demo.example.com");
    const page = options.page ? decodeURIComponent(options.page) : "首页";
    this.setData({
      configured,
      customerUrl: configured ? buildCustomerUrl(page) : "",
    });
  },

  handleLoad() {
    this.setData({ loadFailed: false });
  },

  handleError() {
    this.setData({ loadFailed: true });
  },

  retry() {
    const currentUrl = this.data.customerUrl;
    this.setData({ customerUrl: "", loadFailed: false }, () => {
      this.setData({ customerUrl: currentUrl });
    });
  },

  showSetupGuide() {
    wx.showModal({
      title: "还差一个部署地址",
      content: "先部署根目录的 Web 项目，再把 miniprogram/config.js 中的示例域名替换为你的 HTTPS 域名。",
      showCancel: false,
    });
  },

  onShareAppMessage() {
    return {
      title: "栖光美学 · 品牌会员",
      path: "/pages/customer/index?page=首页",
    };
  },

  onShareTimeline() {
    return {
      title: "栖光美学 · 品牌会员",
      query: "page=首页",
    };
  },
});
