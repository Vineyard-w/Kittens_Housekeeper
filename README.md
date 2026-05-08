# 猫国建设者小管家 (Kittens Game Auto Helper)

适用于 [猫国建设者](https://lolitalibrary.com/maomao/index.html) 的油猴（Tampermonkey/Greasemonkey）自动化辅助脚本。

## 基本信息

| 项目 | 内容 |
|------|------|
| 脚本名称 | 猫国建设者小管家 |
| 版本 | 1.5.1 |
| 作者 | Vineyard |
| 运行环境 | Tampermonkey / Greasemonkey |
| 匹配网址 | `https://lolitalibrary.com/maomao/index.html*` |
| 运行时机 | 页面加载完成后（`document-idle`） |

## 功能概览

### 基础功能

| 功能 | 说明 | 默认间隔 |
|------|------|----------|
| 自动采集猫薄荷 | 定时点击猫薄荷采集按钮 | 10ms |
| 自动观测天空 | 定时点击观测天空按钮，捕捉天文事件 | 2000ms |

### 资源自动转换（阈值触发）

当资源库存达到上限的指定百分比时，自动执行转换。每种转换均可独立设置触发阈值（1%~100%）。

| 转换路径 | 监控资源 | 默认阈值 |
|----------|----------|----------|
| 猫薄荷 → 木材 | 猫薄荷 | 80% |
| 木材 → 木梁 | 木材 | 90% |
| 矿物 → 石板 | 矿物 | 90% |
| 煤 → 钢 | 煤 | 90% |
| 铁 → 金属板 | 铁 | 90% |
| 赞美太阳 | 信仰 | 90% |
| 羊皮纸 → 手稿 | 文化 | 90% |
| 手稿 → 概要 | 科学 | 90% |
| 概要 → 蓝图 | 科学 | 90% |
| 钛 → 合金 | 钛 | 90% |
| 派出猎人 | 喵力 | 90% |

### 定时转换

| 转换路径 | 说明 | 默认间隔 |
|----------|------|----------|
| 毛皮 → 羊皮纸 | 按固定时间间隔执行转换 | 10秒 |

### 辅助功能

- **可视化控制面板**：浮动于页面右上角，可逐项开关各功能、调整阈值和间隔参数
- **配置持久化存储**：所有设置通过 `GM_setValue` / `GM_getValue` 保存，刷新页面后自动恢复
- **转换日志记录**：实时显示最近 20 条转换记录（含时间戳和转换数量），带 10 秒冷却防刷屏
- **油猴菜单命令**：支持通过油猴菜单「重置所有设置」一键恢复默认配置

## 工作原理

1. **XPath 定位**：脚本通过 XPath 精确定位游戏界面中的资源数值和按钮元素
2. **阈值检测**：定时读取资源当前值与上限值，当比值 ≥ 设定阈值时触发转换
3. **定时循环**：基础采集和观测使用 `setInterval` 定时执行；资源转换统一由一个 3 秒间隔的定时器轮询检查
4. **数值解析**：支持带 K（千）单位和逗号分隔符的数值文本解析
5. **冷却机制**：转换日志记录带 10 秒冷却时间，避免同类型转换短时间内重复刷屏

## 安装使用

1. 在浏览器中安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 点击 Tampermonkey 图标 → 添加新脚本
3. 将 `kittens-game-auto-helper.user.js` 的内容粘贴到编辑器中并保存
4. 打开 [猫国建设者](https://lolitalibrary.com/maomao/index.html) 游戏页面
5. 页面右上角将出现「猫国小管家」控制面板，按需开启功能即可

## 默认配置

所有功能默认关闭，首次使用需在控制面板中手动开启。默认配置如下：

```javascript
{
    autoHarvestCatnip: false,           // 自动采集猫薄荷
    autoObserveSky: false,              // 自动观测天空
    harvestInterval: 10,                // 采集间隔（毫秒）
    observeInterval: 2000,              // 观测间隔（毫秒）
    catnipToWoodThreshold: 0.8,         // 猫薄荷转木材阈值
    woodToBeamThreshold: 0.9,           // 木材转木梁阈值
    mineralToSlabThreshold: 0.9,        // 矿物转石板阈值
    coalToSteelThreshold: 0.9,          // 煤转钢阈值
    ironToPlateThreshold: 0.9,          // 铁转金属板阈值
    praiseSunThreshold: 0.9,            // 赞美太阳阈值
    parchmentToManuscriptThreshold: 0.9, // 羊皮纸转手稿阈值
    manuscriptToCompendiumThreshold: 0.9, // 手稿转概要阈值
    compendiumToBlueprintThreshold: 0.9, // 概要转蓝图阈值
    titaniumToAlloyThreshold: 0.9,      // 钛合成合金阈值
    huntThreshold: 0.9,                 // 派出猎人阈值
    furToParchmentInterval: 10,         // 毛皮转羊皮纸间隔（秒）
    convertInterval: 3000               // 资源转换检测间隔（毫秒）
}
```
