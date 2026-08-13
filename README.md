# 栖光美业 Web MVP

纯前端多角色美业经营平台演示项目。

## 运行

```bash
pnpm install
pnpm dev
```

开发地址默认是 `http://localhost:5173/`。

顾客端免登录入口：

```text
http://localhost:5173/?shop=qiguang&page=首页
```

商家老板可在“私域店铺”页面查看顾客端专属链接、复制链接并下载二维码。部署到 HTTPS 域名后，该页面会自动生成可供手机扫描的正式二维码。若部署平台无法提供正确的访问域名，可参考 `.env.example` 设置 `VITE_PUBLIC_SITE_URL`。

生产构建：

```bash
pnpm build
```

提交前检查：

```bash
pnpm check
```

该命令会执行 TypeScript 严格检查及预约、排班、状态流转和优惠券规则测试。项目使用 Node.js 24 的原生 TypeScript 测试能力，建议使用 Node.js 24 或更高版本。

## 微信小程序顾客端

项目包含位于 `miniprogram/` 的微信小程序 `web-view` 外壳，可以直接承载现有品牌会员端。部署 Web 项目后，在 `miniprogram/config.js` 中填写 HTTPS 地址，再通过仓库根目录的 `project.config.json` 导入微信开发者工具。

完整步骤见 [MINIPROGRAM.md](./MINIPROGRAM.md)。

## Python 后端

仓库已包含位于 `backend/` 的 Python 后端，采用 FastAPI、PostgreSQL、SQLAlchemy、
Alembic、Redis 和 Dramatiq。耗材模块已提供库存、入库、员工申请、店长审批、库存流水
及服务完成自动扣减接口；其他业务仍处于前端演示阶段。

完整启动和检查命令见 [backend/README.md](./backend/README.md)，整体实施路线见
[BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md)。

## 演示账号

所有账号统一密码为 `demo123`。

| 账号 | 角色 | 默认页面 |
| --- | --- | --- |
| `boss` | 商家老板 | 经营工作台 |
| `manager` | 门店店长 | 门店工作台 |
| `staff` | 服务员工 | 今日工作 |
| `reception` | 门店前台 | 前台工作台 |
| `customer` | 栖光品牌会员 | 会员首页 |
| `admin` | 平台管理员 | 平台看板 |

## 数据说明

业务数据通过 Zustand 持久化到浏览器 `localStorage`。平台管理员可在“平台设置”中恢复预约、会员、订单、次卡、优惠券、消息、商家、门店和员工的完整初始演示数据。

登录角色保存到浏览器本地会话，当前一级页面同步到 URL 查询参数。未登录时不能仅通过 URL 中的角色参数进入工作区。预约表单中的临时输入不会写入 URL。

## 当前业务规则

- 门店、预约、订单、排班和员工使用统一的稳定 ID 关联。
- 预约会检查门店营业状态、营业时间、员工状态、服务能力、排班、顾客冲突和员工跨店冲突。
- 相邻预约默认保留 10 分钟服务整理时间。
- 优惠券在预约提交时锁定，预约取消时释放，订单结算时核销。
- 预约状态通过固定状态机流转，完成服务后生成一张待结算订单。
- 每个服务可配置单次标准耗材，服务完成时按标准用量自动出库。
- 老板查看全部门店耗材，店长管理本店库存并审批，员工提交额外领用、退回和报损。
- 库存提醒会同时考虑当前库存、有效预约预计用量和安全库存。

耗材页面当前保留本地演示数据，并已提供 `inventory-api.ts` 对接 Python API。真实部署时应关闭本地库存写入，以 Python 服务端库存事务为唯一数据来源。其他模块仍未连接后端，也不处理真实支付或生产环境鉴权。

推荐接入顺序：身份认证与租户上下文、门店/员工/服务主数据、预约事务接口、订单支付与次卡核销、报表聚合。前端的 `business-rules.ts` 可继续用于即时反馈，但服务端必须作为最终校验来源。
