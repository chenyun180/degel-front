# Degel 前端项目

## 项目概述

Degel 商城管理系统前端，基于 Ant Design Pro + UmiJS Max + React 19 构建的企业级中后台应用。

## 技术栈

- **框架**: React 19 + UmiJS Max 4.6
- **UI 库**: Ant Design 6 + Ant Design Pro Components 3.1
- **语言**: TypeScript 5.6
- **样式**: Less + antd-style
- **日期**: dayjs
- **Node 版本**: >= 20.0.0
- **包管理器**: npm (legacy-peer-deps=true)

## 项目结构

```
degel-front/
├── config/
│   ├── config.ts          # UmiJS 主配置
│   ├── routes.ts          # 路由配置
│   ├── proxy.ts           # 开发代理配置
│   └── defaultSettings.ts # 布局默认设置
├── src/
│   ├── app.tsx            # 应用入口（运行时配置）
│   ├── access.ts          # 权限配置
│   ├── requestErrorConfig.ts # 请求错误处理
│   ├── typings.d.ts       # 全局类型定义
│   ├── pages/             # 页面组件
│   │   ├── user/login/    # 登录页
│   │   ├── Welcome.tsx    # 首页
│   │   ├── System/        # 系统管理（用户/角色/菜单/店铺）
│   │   └── Shop/          # 店铺工作台（商品/订单/售后/统计/设置）
│   ├── components/        # 公共组件（Footer, HeaderDropdown, RightContent）
│   ├── services/          # API 服务（自动生成，不要手动修改）
│   ├── locales/           # 国际化文件
│   └── global.less        # 全局样式
└── biome.json             # Biome 代码检查配置
```

## 常用命令

- `npm run dev` — 启动开发服务器（无 mock，连接后端）
- `npm run build` — 生产构建
- `npm run lint` — 运行 Biome lint + TypeScript 类型检查
- `npm run test` — 运行 Jest 测试
- `npm run tsc` — TypeScript 类型检查

## 代码规范

- **Linter/Formatter**: Biome（非 ESLint/Prettier）
- **引号风格**: 单引号
- **缩进**: 2 空格
- **换行符**: LF
- **Commit 规范**: Conventional Commits（通过 commitlint + husky 强制）
- **lint-staged**: 提交前自动运行 Biome check
- `noExplicitAny`: 关闭（允许 any）
- `useExhaustiveDependencies`: 关闭
- `src/services/` 目录被 Biome 忽略（自动生成代码）

## API 代理

开发环境所有 API 请求通过代理转发到网关（localhost:9999）：

- `/auth/` → 认证服务
- `/admin/` → 管理服务
- `/product/` → 商品服务
- `/file/` → 文件服务

## 认证

JWT Token 存储在 localStorage，key 为 `degel_access_token`。

## 注意事项

- 路由配置在 `config/routes.ts`，不在路由中引入的页面不会被编译
- 权限控制通过 `access` 字段配置，`canAdmin` 为管理员权限
- 国际化默认 `zh-CN`
- 使用 `@umijs/max` 的 `request` 插件发起请求，基于 axios + ahooks useRequest


## 强制要求
阅读、描述或引用已有代码时，**必须同时指出其中存在的问题**，不得只做中立描述。

## 必须主动标注的情况，并且使用⚠️ 提醒
- 方法/逻辑实际上是**空操作或无效代码**（如某段代码什么都不做）
- 配置了某个组件但**实际未被使用**（如配置了 Redis 但 token 存储没用）
- 功能**看起来正常但实际不生效**（如 logout 接口调用后 token 仍然有效）
- 存在**安全隐患**（如无法吊销的 token、明文密钥等）
- 依赖已引入但**功能缺失**（如引入了 Redis 依赖却没有缓存逻辑）

## 标注格式

在描述相关代码时，紧跟一个明确的警告：
> ⚠️ **问题**：[具体说明为什么有问题，以及实际影响]

### 反例（禁止）
描述 `TokenController.logout` 时只说：
> "退出登录时调用了 `tokenStore.removeAccessToken(accessToken)`"

### 正例（要求）
> "`TokenController.logout` 调用了 `tokenStore.removeAccessToken(accessToken)`"
> ⚠️ **问题**：当前使用的是 `JwtTokenStore`，其 `removeAccessToken` 是空操作，什么都不做。logout 后 token 在有效期内依然可以正常使用，注销功能实际无效。

## 附加要求
- 如果在梳理架构/流程时发现问题，**在同一回复中就提出**，不等用户追问
- 如果问题影响安全或核心功能，在回复**开头**标注，不放在末尾
