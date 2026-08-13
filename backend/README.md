# 美天美业 API

当前目录是 Python/FastAPI 后端。除 PostgreSQL、Redis、Dramatiq、Alembic、统一错误
和健康检查外，已包含认证、多商户 RBAC、门店/员工/服务/排班主数据、耗材库存和员工
次卡核销基础模块。

## 环境要求

- Python 3.13
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL 17
- Redis 7
- Docker Compose（可选，用于一次启动全部服务）

## 本地开发

```bash
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run python -m scripts.seed_demo
uv run uvicorn app.main:app --reload
```

API 文档和健康检查：

```text
http://localhost:8000/docs
http://localhost:8000/health/live
http://localhost:8000/api/v1/system/ready
```

`/health/live` 只判断 API 进程是否存活；`/api/v1/system/ready` 会真实检查
PostgreSQL 和 Redis，适合容器编排与上线探针。

## 认证 API

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Access Token 通过 Bearer Header 使用，只保存在前端内存；Refresh Token 只保存摘要到
数据库，原文放在 HttpOnly Cookie 中，并在每次刷新时轮换。受保护请求会从数据库重新
加载账号、商户状态、角色、权限和门店范围，不信任客户端提交的角色或商户 Header。

本地演示账号为 `admin`、`boss`、`manager`、`reception`、`staff`、`customer`，统一密码
为 `demo123`。种子脚本可重复执行。

## 门店与经营主数据 API

```text
GET/POST       /api/v1/stores
GET/PATCH      /api/v1/stores/{id}
POST           /api/v1/stores/{id}/pause|resume
GET/POST       /api/v1/staff
GET/PATCH      /api/v1/staff/{id}
PUT            /api/v1/staff/{id}/services
POST           /api/v1/staff/{id}/disable|enable
GET/POST/PATCH /api/v1/services
POST           /api/v1/services/{id}/publish|unpublish
GET            /api/v1/schedules
PUT            /api/v1/schedules/batch
DELETE         /api/v1/schedules/{id}
```

老板可管理当前商户全部主数据；店长只能管理所属门店的员工和排班；前台按所属门店只读
门店、员工和服务；服务员工只能读取本人排班。停用员工会同步停用关联登录账号并使已签发
Access Token 失效。员工服务能力必须属于其门店实际提供的项目。

## 耗材库存 API

耗材模块位于 `app/modules/inventory/`，包含库存、服务标准用量、库存流水和审批规则。

```text
GET  /api/v1/inventory/stocks
GET  /api/v1/inventory/transactions
POST /api/v1/inventory/restocks
POST /api/v1/inventory/requests
POST /api/v1/inventory/requests/{id}/approve
POST /api/v1/inventory/requests/{id}/reject
POST /api/v1/inventory/service-completions
```

老板可访问当前商户全部门店，店长只能操作所属门店，员工只能查看本人流水并提交
额外领用、退回或报损。审批和服务完成扣减使用数据库行锁，服务扣减通过
`预约 + 耗材 + 标准消耗类型` 唯一约束保证幂等。

所有耗材接口都要求有效 Bearer Token，操作人、商户和门店范围由服务端登录身份生成。

## 员工次卡核销 API

员工核销模块位于 `app/modules/redemption/`。员工只能查询和核销本人在所属门店的
待结算服务；核销会在一个数据库事务内锁定订单与次卡、扣减卡次、完成订单并写入
唯一核销流水。相同订单重复请求会返回第一次核销结果，不会重复扣次。

```text
GET  /api/v1/redemptions/pending
GET  /api/v1/redemptions/history
POST /api/v1/redemptions/orders/{order_id}
```

## 质量检查

```bash
uv run ruff check .
uv run mypy app tests
uv run pytest
uv run alembic upgrade head
uv run alembic check
```

## Docker Compose

在仓库根目录运行：

```bash
docker compose up --build
```

如果本机安装的是独立版 Compose，则使用等价命令：

```bash
docker-compose up --build
```

首次启动会先执行数据库迁移，再启动 API 和后台任务 Worker。
