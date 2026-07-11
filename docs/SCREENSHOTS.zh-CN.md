<p align="right">
  <a href="./SCREENSHOTS.en.md">English</a> · <strong>简体中文</strong>
</p>

# 截图索引

这里列出中文 README 和中文展示资料使用的页面截图。所有图片都直接截取自真实运行的应用，不是手工拼出来的效果图。

## 1. 输入页

文件：`docs/assets/screenshot-input-zh.png`

![中文输入页](assets/screenshot-input-zh.png)

截图中可以看到：

- 中文界面。
- CNY 货币格式。
- 一天 24 小时电价时间轴。
- 负价、低价和高价时段。
- 四类可调度设备。
- 设备总成本输入框。
- 高级参数入口。
- 主要计算操作。

## 2. 电价编辑器

文件：`docs/assets/screenshot-tariff-editor-zh.png`

![中文电价编辑器](assets/screenshot-tariff-editor-zh.png)

截图中可以看到：

- 从页面底部打开的编辑交互。
- 开始时间和结束时间控制。
- 支持负电价的每 kWh 价格输入。
- 保存、取消和删除操作。
- 编辑器后方仍然可见被选中的电价时段。

## 3. 结果页

文件：`docs/assets/screenshot-result-zh.png`

![中文结果页](assets/screenshot-result-zh.png)

截图中可以看到：

- 中文结果文案。
- 预计回本时间。
- 预计每年节省。
- 结果来源状态。
- 按设备分类的节省明细。
- 每日用电建议。
- 分享和修改操作。

## 4. 桌面宽屏布局

文件：`docs/assets/screenshot-desktop-zh.png`

![中文桌面布局](assets/screenshot-desktop-zh.png)

截图中可以看到：

- 移动端优先应用在宽屏浏览器中的呈现方式。
- 居中并限制宽度的应用主体。
- 输入流程在桌面上不会被过度拉伸。

## 截图生成方式

这些截图来自本地构建后的生产页面，由 Express 服务托管：

```text
http://localhost:8787
```

移动页面使用手机尺寸视口，桌面页面使用宽屏视口。截图统一放在 `docs/assets/`，方便 GitHub 在 README 和文档中直接显示。

可以返回[中文项目说明](../README.zh-CN.md)，或者继续查看[中文展示流程](DEMO.zh-CN.md)。
