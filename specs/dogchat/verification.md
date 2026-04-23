# 验证策略 · DogChat

> **状态**：初始化  
> **来源 Plan**：./plan.md  
> **关联任务**：./task.md  
> **最后更新**：2026-04-20

---

## 概览

| § | 章节 | Status | Owner |
|---|---|---|---|
| 1 | 编译验证 | pending | e2e-remote-test |
| 2 | 单测验证 | pending | e2e-remote-test |
| 3 | BOE 集成测试 | pending | e2e-deploy-pipeline |
| 4 | PPE 验证 | pending | e2e-deploy-pipeline |
| 5 | 人工 UAT | pending | human |

通过条件：§ 1-4 全部 passed，§ 5 至少 1 个验收人确认 passed。

---

## § 1. 编译验证

- **Owner**：`e2e-remote-test`
- **Status**：pending
- **Acceptance Criteria**：
  - 微信开发者工具编译无错误（Console 无红色报错）
  - 云函数 `npm install` 成功（所有依赖安装无报错）
  - 云函数上传部署成功（每个函数都显示"部署成功"）
  - 小程序代码包大小 ≤ 2MB（微信小程序单包限制）
- **Execution**：_(e2e-remote-test 填充)_
- **Results**：_(e2e-remote-test 填充)_
- **Issues**：_(如有)_

---

## § 2. 单测验证

- **Owner**：`e2e-remote-test`
- **Status**：pending
- **Acceptance Criteria**：
  - 云函数核心逻辑有单元测试覆盖（至少 user/login、dog/create、moment/create、friend/request）
  - 整体覆盖率 ≥ 60%（MVP 阶段标准，不要求 80%）
  - 关键用例：
    - [ ] `user/login`：新用户创建 / 老用户返回 / openid 正确获取
    - [ ] `dog/create`：dogId 唯一性 / 字段完整性 / 头像上传
    - [ ] `friend/request`：重复请求拦截 / pending 状态写入
    - [ ] `friend/confirm`：status 更新为 confirmed
    - [ ] `moment/create`：内容安全审核通过时写入 / 审核失败时拒绝
    - [ ] `moment/list`：只返回狗友动态 / 分页正确
    - [ ] `moment/like`：toggle 逻辑（点赞→取消点赞）
    - [ ] `walk/create`：invitedDogIds 正确存储 / responses 初始化
  - 所有单测在远端开发机通过
- **Execution**：_(e2e-remote-test 填充)_
- **Results**：_(e2e-remote-test 填充)_
- **Issues**：_(如有)_

---

## § 3. BOE 集成测试

- **Owner**：`e2e-deploy-pipeline`
- **Status**：pending
- **Acceptance Criteria**：
  - 小程序在真机（微信客户端）可正常打开
  - 4 个核心流程全部跑通：
    - [ ] 流程 A：注册登录 → 创建狗狗 → 出示二维码 → 扫码添加狗友 → 确认
    - [ ] 流程 B：发布动态（图文）→ 狗友在首页看到 → 点赞 → 评论
    - [ ] 流程 C：发起约遛 → 狗友收到 → 接受 → 查看约遛详情
    - [ ] 流程 D：内容安全测试（发布敏感词被拒绝 / 正常内容通过）
  - 边界场景：
    - [ ] 无狗友时的首页空状态提示
    - [ ] 多狗切换时身份正确
    - [ ] 网络异常时的错误提示（非白屏）
  - 性能指标：
    - [ ] 首页信息流加载 ≤ 3 秒（含云函数冷启动）
    - [ ] 图片加载 ≤ 2 秒（单张，WiFi 环境）
  - 无 JS 报错（Console 无红色错误）
- **Execution**：_(e2e-deploy-pipeline 填充)_
- **Results**：_(e2e-deploy-pipeline 填充)_
- **Issues**：_(如有)_

---

## § 4. PPE 验证

- **Owner**：`e2e-deploy-pipeline`
- **Status**：pending
- **Acceptance Criteria**：
  - **灰度策略**：
    - DogChat 作为小程序，无传统服务端灰度概念。验证策略为"体验版 → 审核版 → 正式版"：
    - Stage 1：体验版（仅开发者 + 体验成员可用）→ 内部测试 3 天 → 无异常 → Stage 2
    - Stage 2：提交代码审核 → 审核通过 → Stage 3
    - Stage 3：正式发布 → 种子用户（10-30 人）使用 1 周 → 无异常 → 扩大推广
  - **每 Stage 通过条件**：
    - 无功能崩溃（小程序不闪退）
    - 核心流程成功率 ≥ 95%
    - 云函数错误率 < 1%
    - 云开发用量在免费额度内（或 19.9 元套餐内）
  - **回滚条件**（任一触发立即回退到上一版本）：
    - 小程序闪退率 > 5%
    - 云函数错误率 > 5%，持续 1 小时
    - 用户投诉内容安全问题（审核漏过违规内容）
    - 数据丢失或错乱
- **Execution**：_(e2e-deploy-pipeline 填充)_
- **Results**：_(e2e-deploy-pipeline 填充)_
- **Issues**：_(如有)_

---

## § 5. 人工 UAT

- **Owner**：`human`
- **Status**：pending
- **Acceptance Criteria**：
  - **验收人**：创始人（你本人）+ 2-3 位种子用户
  - **验收场景**：
    - [ ] 作为新用户，3 步内完成注册 + 创建狗狗档案
    - [ ] 添加至少 1 位狗友（面对面扫码）
    - [ ] 发布 1 条带图片的狗狗圈动态
    - [ ] 狗友能看到动态并点赞/评论
    - [ ] 发起 1 条约遛，狗友能响应
    - [ ] 整体体验流畅，无卡顿或明显 Bug
  - **验收标准**：
    - [ ] 创始人确认所有 PRD 验收标准（AC1-AC7）满足
    - [ ] 至少 2 位种子用户反馈"愿意继续使用"
    - [ ] 无 P0 级 Bug（功能不可用 / 数据丢失 / 安全漏洞）
- **Execution**：_(human 填充)_
- **Results**：_(human 填充)_
- **Issues**：_(如有)_
