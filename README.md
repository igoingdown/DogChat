# DogChat

DogChat 是一个微信小程序 + 微信云开发项目。产品目标是让狗主人以狗狗身份维护低压力的狗友社交关系，MVP 包含登录、狗狗档案、狗友关系、狗狗圈、点赞评论和约遛狗。

## 目录结构

- `miniprogram/`：微信小程序前端页面、样式和工具方法
- `cloudfunctions/`：微信云函数，前端调用 `user`、`dog`、`friend`、`moment`、`walk` 这 5 个聚合函数
- `docs/`：PRD 和上线前待办
- `specs/dogchat/`：方案、任务和验证文档

## 本地运行

1. 安装并打开微信开发者工具。
2. 用微信开发者工具导入当前仓库根目录。
3. 默认已开启本地 mock 模式，可以直接编译体验。

## 接入真实云开发

1. 修改 `project.config.json` 里的 `appid` 为你的真实小程序 AppID。
2. 将 `miniprogram/utils/config.js` 里的 `enableMock` 改为 `false`。
3. 在微信开发者工具中开通云开发，并创建默认云环境。
4. 进入云开发控制台，创建集合：`users`、`dogs`、`friendships`、`moments`、`comments`、`likes`、`walks`。
5. 分别右键部署这 5 个云函数目录，并选择“创建并部署：云端安装依赖”：
   - `cloudfunctions/user`
   - `cloudfunctions/dog`
   - `cloudfunctions/friend`
   - `cloudfunctions/moment`
   - `cloudfunctions/walk`
6. 点击微信开发者工具的“编译/预览”开始体验。

如果你有多个云开发环境，在 `miniprogram/app.js` 的 `wx.cloud.init` 中显式加入 `env: '你的环境ID'`。

## 当前注意事项

- `project.config.json` 当前使用 `touristappid` 方便本地导入，必须替换为真实 AppID 才能使用真实云开发能力。
- `miniprogram/images/` 里的图片是可运行占位图，后续应替换为正式视觉资源。
- 狗狗二维码页当前只是 canvas 文本展示，不是真正可扫码的小程序码。
- `moment/create` 只做了文本安全检查，图片内容安全还需要接入 `mediaCheckAsync`。
