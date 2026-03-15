# Lazy Apply Chrome Extension

一个基于 **Manifest V3 + TypeScript** 的 Chrome 扩展，用于在求职/招聘/报名类网页中自动识别常见表单字段，并使用本地个人资料进行预览和填充。

## 功能特性

- 通用表单识别（非单站点硬编码）
- 支持 `input` / `textarea` / `select`
- 字段识别依据：`label`、`placeholder`、`name`、`id`、`aria-label`、附近文本
- 预览-确认两阶段：
  1. 先高亮待填字段（不提交）
  2. 用户点击确认后执行填充
- 兼容 React / Vue 常见受控组件（触发 `input` / `change` / `blur`）
- 所有信息仅保存在 `chrome.storage.local`，不上传

## 项目结构

```text
LazyApply/
├── manifest.json
├── package.json
├── tsconfig.json
├── scripts/
│   └── build.mjs
├── src/
│   ├── background/
│   │   └── background.ts
│   ├── content/
│   │   ├── fieldRecognizer.ts
│   │   ├── fillExecutor.ts
│   │   └── index.ts
│   ├── popup/
│   │   ├── popup.css
│   │   ├── popup.html
│   │   └── popup.ts
│   └── shared/
│       ├── chrome.d.ts
│       ├── profileSchema.ts
│       └── types.ts
└── dist/                # 可直接加载到 Chrome 的产物
```

## 本地使用

### 1) 直接加载（推荐）

本仓库已包含可直接使用的 `dist/` 产物，无需额外构建。

1. 打开 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择项目下的 `dist/` 目录

### 2) TypeScript 校验（可选）

```bash
tsc --noEmit
```

## 使用方式

1. 打开任意表单页面（如招聘网站申请页面）
2. 点击扩展图标打开 popup
3. 填写并保存个人资料
4. 点击 **1. 预览高亮** 查看识别结果
5. 确认无误后点击 **2. 确认填充**
6. 若需要撤销视觉标记，点击 **清除高亮**

> 注意：扩展不会自动提交表单。

## 测试建议

1. 在本地创建一个包含姓名、邮箱、电话、教育、经历等字段的测试表单页面。
2. 在 popup 中填写对应资料并点击预览，检查高亮是否准确。
3. 点击确认填充，检查：
   - 文本是否写入
   - React/Vue 页面是否感知变化（字段是否通过校验/显示已填）
4. 检查 `select` 字段是否能匹配并选中相应选项。

## 后续扩展建议

- 新增 `adapters/` 目录，实现站点特定策略（如 Workday、Greenhouse、Lever）
- 增加字段映射可视化配置（用户手工修正识别结果）
- 增加导入/导出本地 profile（JSON 文件）
