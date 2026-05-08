// ==UserScript==
// @name         猫国建设者小管家
// @namespace    kittens-game-helper
// @version      1.5.1
// @description  自动采集猫薄荷、自动观测天空、资源自动转换
// @author       Vineyard
// @match        https://lolitalibrary.com/maomao/index.html*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

/**
 * 猫国建设者小管家
 * 
 * 功能：
 * 1. 自动采集猫薄荷
 * 2. 自动观测天空
 * 3. 自动转换猫薄荷成木材
 * 4. 自动转换木材成木梁
 * 5. 自动转换矿物成石板
 * 6. 自动转换煤成钢
 * 7. 自动转换铁成金属板
 * 8. 自动赞美太阳
 * 9. 自动转换羊皮纸成手稿
 * 10. 自动转换手稿成概要
 * 11. 自动转换概要成蓝图
 * 12. 自动合成合金
 * 13. 自动转换毛皮成羊皮纸（定时）
 * 14. 可视化控制面板
 * 15. 配置持久化存储
 * 16. 转换日志记录
 */
(function() {
    'use strict';

    /**
     * 默认配置
     * @type {Object}
     */
    const DEFAULT_CONFIG = {
        autoHarvestCatnip: false,       // 自动采集猫薄荷开关
        autoObserveSky: false,          // 自动观测天空开关
        harvestInterval: 10,          // 采集猫薄荷间隔（毫秒）
        observeInterval: 2000,          // 观测天空间隔（毫秒）
        autoCatnipToWood: false,        // 自动转换猫薄荷成木材开关
        catnipToWoodThreshold: 0.8,     // 猫薄荷转木材触发阈值（0.9 = 90%）
        autoWoodToBeam: false,          // 自动转换木材成木梁开关
        woodToBeamThreshold: 0.9,       // 木材转木梁触发阈值
        autoMineralToSlab: false,       // 自动转换矿物成石板开关
        mineralToSlabThreshold: 0.9,    // 矿物转石板触发阈值
        autoCoalToSteel: false,         // 自动转换煤成钢开关
        coalToSteelThreshold: 0.9,      // 煤转钢触发阈值
        autoIronToPlate: false,         // 自动转换铁成金属板开关
        ironToPlateThreshold: 0.9,      // 铁转金属板触发阈值
        autoPraiseSun: false,           // 自动赞美太阳开关
        praiseSunThreshold: 0.9,        // 赞美太阳触发阈值
        autoParchmentToManuscript: false, // 自动转换羊皮纸成手稿开关
        parchmentToManuscriptThreshold: 0.9, // 羊皮纸转手稿触发阈值
        autoManuscriptToCompendium: false, // 自动转换手稿成概要开关
        manuscriptToCompendiumThreshold: 0.9, // 手稿转概要触发阈值
        autoCompendiumToBlueprint: false, // 自动转换概要成蓝图开关
        compendiumToBlueprintThreshold: 0.9, // 概要转蓝图触发阈值
        autoTitaniumToAlloy: false,     // 自动合成合金开关
        titaniumToAlloyThreshold: 0.9,  // 钛合成合金触发阈值
        autoFurToParchment: false,      // 自动转换毛皮成羊皮纸开关
        furToParchmentInterval: 10,     // 毛皮转羊皮纸间隔（秒）
        autoHunt: false,                // 自动派出猎人开关
        huntThreshold: 0.9,             // 喵力触发派出猎人阈值
        convertInterval: 3000           // 资源转换检测间隔（毫秒）
    };

    /**
     * XPath 路径配置
     * @type {Object}
     */
    const XPATH = {
        // 基础功能
        catnip: '//*[@id="gameContainerId"]/div[2]/div/div/table/tr/td[1]/div[1]/div',  // 猫薄荷采集按钮
        observeBtn: '//*[@id="observeBtn"]',  // 观测天空按钮
        
        // 猫薄荷转木材
        catnipCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[1]/div[2]',  // 猫薄荷当前库存
        catnipMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[1]/div[3]',      // 猫薄荷库存上限
        catnipToWoodBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[1]/div[4]/div/span[2]',  // 猫薄荷转木材按钮
        
        // 木材转木梁
        woodCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[2]/div[2]',  // 木材当前库存
        woodMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[2]/div[3]',      // 木材库存上限
        woodToBeamBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[2]/div[4]/div/span[2]',  // 木材转木梁按钮
        
        // 矿物转石板
        mineralCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[3]/div[2]',  // 矿物当前库存
        mineralMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[3]/div[3]',      // 矿物库存上限
        mineralToSlabBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[3]/div[4]/div/span[2]',  // 矿物转石板按钮
        
        // 煤转钢
        coalCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[4]/div[2]',  // 煤当前库存
        coalMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[4]/div[3]',      // 煤库存上限
        coalToSteelBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[5]/div[4]/div/span[2]',  // 煤转钢按钮
        
        // 铁转金属板
        ironCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[5]/div[2]',  // 铁当前库存
        ironMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[5]/div[3]',      // 铁库存上限
        ironToPlateBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[4]/div[4]/div/span[2]',  // 铁转金属板按钮
        
        // 赞美太阳
        faithCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[12]/div[2]',  // 信仰当前值
        faithMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[12]/div[3]',      // 信仰上限
        praiseSunBtn: '//*[@id="fastPraiseContainer"]/a',  // 赞美太阳按钮
        
        // 羊皮纸转手稿
        cultureCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[11]/div[2]',  // 文化当前库存
        cultureMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[11]/div[3]',      // 文化库存上限
        parchmentToManuscriptBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[12]/div[4]/div/span[2]',  // 羊皮纸转手稿按钮
        
        // 手稿转概要
        scienceCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[10]/div[2]',  // 科学当前库存
        scienceMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[10]/div[3]',      // 科学库存上限
        manuscriptToCompendiumBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[13]/div[3]/div/span[2]',  // 手稿转概要按钮
        
        // 概要转蓝图
        compendiumToBlueprintBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[14]/div[3]/div/span[2]',  // 概要转蓝图按钮
        
        // 钛合成合金
        titaniumCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[6]/div[2]',  // 钛当前库存
        titaniumMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[6]/div[3]',      // 钛库存上限
        titaniumToAlloyBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[8]/div[3]/div/span[2]',  // 钛合成合金按钮
        
        // 毛皮转羊皮纸
        furToParchmentBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[11]/div[3]/div/span[2]',  // 毛皮转羊皮纸按钮
        
        // 派出猎人
        manpowerCurrent: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[9]/div[2]',  // 喵力当前库存
        manpowerMax: '//*[@id="leftColumnViewport"]/div/div[1]/div[2]/div/div[9]/div[3]',      // 喵力库存上限
        huntBtn: '//*[@id="fastHuntContainerCount"]/span[1]'  // 派出猎人按钮
    };

    /**
     * 当前配置（从存储加载）
     * @type {Object}
     */
    let config = loadConfig();

    /**
     * 定时器引用
     * @type {Object}
     */
    let timers = {
        harvest: null,
        observe: null,
        convert: null,
        furToParchment: null
    };

    /**
     * 转换日志记录
     * @type {Array<{time: string, action: string}>}
     */
    let convertLogs = [];

    /**
     * 最大日志条数
     * @type {number}
     */
    const MAX_LOGS = 20;

    /**
     * 转换冷却时间（毫秒）
     * 避免同一种转换在短时间内重复记录日志
     * @type {number}
     */
    const LOG_COOLDOWN = 10000;

    /**
     * 上次转换时间记录
     * @type {Object<string, number>}
     */
    let lastConvertTime = {};

    /**
     * 从油猴存储加载配置
     * @returns {Object} 配置对象
     */
    function loadConfig() {
        const saved = GM_getValue('kittensHelperConfig');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { ...DEFAULT_CONFIG };
            }
        }
        return { ...DEFAULT_CONFIG };
    }

    /**
     * 保存配置到油猴存储
     */
    function saveConfig() {
        GM_setValue('kittensHelperConfig', JSON.stringify(config));
    }

    /**
     * 通过 XPath 获取页面元素
     * @param {string} xpath - XPath 表达式
     * @returns {Element|null} 找到的元素，未找到则返回 null
     */
    function getElementByXPath(xpath) {
        const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );
        return result.singleNodeValue;
    }

    /**
     * 点击指定 XPath 的元素
     * @param {string} xpath - XPath 表达式
     * @returns {boolean} 是否成功点击
     */
    function clickElement(xpath) {
        const element = getElementByXPath(xpath);
        if (element) {
            element.click();
            return true;
        }
        return false;
    }

    /**
     * 解析带单位的数值文本
     * 支持 K（千）单位，如 1.5K = 1500
     * @param {string} text - 文本内容
     * @returns {number|null} 解析后的数值，解析失败返回 null
     */
    function parseValueWithUnit(text) {
        text = text.trim();
        if (!text) return null;
        
        // 检查是否带 K 单位（千）
        const hasK = text.toUpperCase().endsWith('K');
        if (hasK) {
            text = text.slice(0, -1).trim();
        }
        
        // 移除逗号分隔符
        text = text.replace(/,/g, '');
        
        const num = parseFloat(text);
        if (isNaN(num)) return null;
        
        // 如果带 K 单位，乘以 1000
        return hasK ? num * 1000 : num;
    }

    /**
     * 获取元素文本内容并解析为数值
     * @param {string} xpath - XPath 表达式
     * @returns {number|null} 解析后的数值，解析失败返回 null
     */
    function getResourceValue(xpath) {
        const element = getElementByXPath(xpath);
        if (!element) return null;
        return parseValueWithUnit(element.textContent);
    }

    /**
     * 获取库存上限数值（处理'/'前缀和K单位）
     * @param {string} xpath - XPath 表达式
     * @returns {number|null} 解析后的数值，解析失败返回 null
     */
    function getMaxValue(xpath) {
        const element = getElementByXPath(xpath);
        if (!element) return null;
        let text = element.textContent.trim();
        // 去除'/'前缀
        if (text.startsWith('/')) {
            text = text.substring(1).trim();
        }
        return parseValueWithUnit(text);
    }

    /**
     * 检查是否应该执行转换
     * @param {string} currentXpath - 当前库存的 XPath
     * @param {string} maxXpath - 库存上限的 XPath
     * @param {number} threshold - 触发阈值（0-1）
     * @returns {boolean} 是否应该转换
     */
    function shouldConvert(currentXpath, maxXpath, threshold) {
        const current = getResourceValue(currentXpath);
        const max = getMaxValue(maxXpath);
        if (current === null || max === null || max === 0) return false;
        return (current / max) >= threshold;
    }

    /**
     * 启动自动采集猫薄荷
     */
    function startAutoHarvest() {
        if (timers.harvest) return;
        timers.harvest = setInterval(() => {
            if (config.autoHarvestCatnip) {
                clickElement(XPATH.catnip);
            }
        }, config.harvestInterval);
        updateStatusPanel();
    }

    /**
     * 停止自动采集猫薄荷
     */
    function stopAutoHarvest() {
        if (timers.harvest) {
            clearInterval(timers.harvest);
            timers.harvest = null;
        }
        updateStatusPanel();
    }

    /**
     * 启动自动观测天空
     */
    function startAutoObserve() {
        if (timers.observe) return;
        timers.observe = setInterval(() => {
            if (config.autoObserveSky) {
                clickElement(XPATH.observeBtn);
            }
        }, config.observeInterval);
        updateStatusPanel();
    }

    /**
     * 停止自动观测天空
     */
    function stopAutoObserve() {
        if (timers.observe) {
            clearInterval(timers.observe);
            timers.observe = null;
        }
        updateStatusPanel();
    }

    /**
     * 检查是否在冷却时间内
     * @param {string} type - 转换类型标识
     * @returns {boolean} 是否在冷却中
     */
    function isInCooldown(type) {
        const now = Date.now();
        return lastConvertTime[type] && (now - lastConvertTime[type]) < LOG_COOLDOWN;
    }

    /**
     * 执行转换并记录日志（带冷却时间检查）
     * @param {string} xpath - 转换按钮的 XPath
     * @param {string} action - 转换动作描述
     * @param {string} type - 转换类型标识
     */
    function convertWithCooldown(xpath, action, type) {
        if (isInCooldown(type)) {
            return;
        }
        
        const element = getElementByXPath(xpath);
        if (element) {
            const buttonText = element.textContent.trim();
            const convertValue = parseValueWithUnit(buttonText);
            element.click();
            lastConvertTime[type] = Date.now();
            const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const logAction = convertValue !== null ? `${action} (${convertValue})` : action;
            convertLogs.unshift({ time, action: logAction });
            if (convertLogs.length > MAX_LOGS) {
                convertLogs.pop();
            }
            updateLogPanel();
        }
    }

    /**
     * 更新日志面板显示
     */
    function updateLogPanel() {
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;
        
        logContainer.innerHTML = convertLogs.map(log => 
            `<div class="log-entry"><span class="log-time">[${log.time}]</span> ${log.action}</div>`
        ).join('') || '<div class="log-empty">暂无转换记录</div>';
    }

    /**
     * 执行资源转换检查
     */
    function checkAndConvert() {
        if (config.autoCatnipToWood && shouldConvert(XPATH.catnipCurrent, XPATH.catnipMax, config.catnipToWoodThreshold)) {
            convertWithCooldown(XPATH.catnipToWoodBtn, '猫薄荷 → 木材', 'catnip');
        }
        if (config.autoWoodToBeam && shouldConvert(XPATH.woodCurrent, XPATH.woodMax, config.woodToBeamThreshold)) {
            convertWithCooldown(XPATH.woodToBeamBtn, '木材 → 木梁', 'wood');
        }
        if (config.autoMineralToSlab && shouldConvert(XPATH.mineralCurrent, XPATH.mineralMax, config.mineralToSlabThreshold)) {
            convertWithCooldown(XPATH.mineralToSlabBtn, '矿物 → 石板', 'mineral');
        }
        if (config.autoCoalToSteel && shouldConvert(XPATH.coalCurrent, XPATH.coalMax, config.coalToSteelThreshold)) {
            convertWithCooldown(XPATH.coalToSteelBtn, '煤 → 钢', 'coal');
        }
        if (config.autoIronToPlate && shouldConvert(XPATH.ironCurrent, XPATH.ironMax, config.ironToPlateThreshold)) {
            convertWithCooldown(XPATH.ironToPlateBtn, '铁 → 金属板', 'iron');
        }
        if (config.autoPraiseSun && shouldConvert(XPATH.faithCurrent, XPATH.faithMax, config.praiseSunThreshold)) {
            convertWithCooldown(XPATH.praiseSunBtn, '赞美太阳', 'faith');
        }
        if (config.autoParchmentToManuscript && shouldConvert(XPATH.cultureCurrent, XPATH.cultureMax, config.parchmentToManuscriptThreshold)) {
            convertWithCooldown(XPATH.parchmentToManuscriptBtn, '羊皮纸 → 手稿', 'parchment');
        }
        if (config.autoManuscriptToCompendium && shouldConvert(XPATH.scienceCurrent, XPATH.scienceMax, config.manuscriptToCompendiumThreshold)) {
            convertWithCooldown(XPATH.manuscriptToCompendiumBtn, '手稿 → 概要', 'manuscript');
        }
        if (config.autoCompendiumToBlueprint && shouldConvert(XPATH.scienceCurrent, XPATH.scienceMax, config.compendiumToBlueprintThreshold)) {
            convertWithCooldown(XPATH.compendiumToBlueprintBtn, '概要 → 蓝图', 'compendium');
        }
        if (config.autoTitaniumToAlloy && shouldConvert(XPATH.titaniumCurrent, XPATH.titaniumMax, config.titaniumToAlloyThreshold)) {
            convertWithCooldown(XPATH.titaniumToAlloyBtn, '钛 → 合金', 'titanium');
        }
        if (config.autoHunt && shouldConvert(XPATH.manpowerCurrent, XPATH.manpowerMax, config.huntThreshold)) {
            convertWithCooldown(XPATH.huntBtn, '派出猎人', 'hunt');
        }
    }

    /**
     * 启动自动转换定时器
     */
    function startAutoConvert() {
        if (timers.convert) return;
        timers.convert = setInterval(checkAndConvert, config.convertInterval);
        updateStatusPanel();
    }

    /**
     * 停止自动转换定时器
     */
    function stopAutoConvert() {
        if (timers.convert) {
            clearInterval(timers.convert);
            timers.convert = null;
        }
        updateStatusPanel();
    }

    /**
     * 启动自动转换毛皮成羊皮纸
     */
    function startAutoFurToParchment() {
        if (timers.furToParchment) return;
        timers.furToParchment = setInterval(() => {
            if (config.autoFurToParchment) {
                const element = getElementByXPath(XPATH.furToParchmentBtn);
                if (element) {
                    const buttonText = element.textContent.trim();
                    const convertValue = parseValueWithUnit(buttonText);
                    element.click();
                    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const logAction = convertValue !== null ? `毛皮 → 羊皮纸 (${convertValue})` : '毛皮 → 羊皮纸';
                    convertLogs.unshift({ time, action: logAction });
                    if (convertLogs.length > MAX_LOGS) {
                        convertLogs.pop();
                    }
                    updateLogPanel();
                }
            }
        }, config.furToParchmentInterval * 1000);
        updateStatusPanel();
    }

    /**
     * 停止自动转换毛皮成羊皮纸
     */
    function stopAutoFurToParchment() {
        if (timers.furToParchment) {
            clearInterval(timers.furToParchment);
            timers.furToParchment = null;
        }
        updateStatusPanel();
    }

    /**
     * 创建状态控制面板
     */
    function createStatusPanel() {
        const panel = document.createElement('div');
        panel.id = 'kittens-helper-panel';
        panel.innerHTML = `
            <style>
                #kittens-helper-panel {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.85);
                    color: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    z-index: 99999;
                    min-width: 220px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                #kittens-helper-panel h3 {
                    margin: 0 0 10px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #444;
                    font-size: 14px;
                }
                .helper-section {
                    margin: 10px 0;
                    padding-top: 8px;
                    border-top: 1px solid #333;
                }
                .helper-section-title {
                    font-size: 11px;
                    color: #aaa;
                    margin-bottom: 6px;
                }
                .helper-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 6px 0;
                }
                .helper-row label {
                    flex: 1;
                    font-size: 11px;
                }
                .helper-status {
                    font-weight: bold;
                    font-size: 10px;
                    min-width: 40px;
                    text-align: center;
                }
                .status-on { color: #4CAF50; }
                .status-off { color: #f44336; }
                .helper-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 3px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                    margin-left: 5px;
                }
                .helper-btn:hover {
                    background: #1976D2;
                }
                .helper-btn.active {
                    background: #f44336;
                }
                .threshold-input {
                    width: 35px;
                    background: #333;
                    color: #fff;
                    border: 1px solid #555;
                    border-radius: 3px 0 0 3px;
                    padding: 2px 4px;
                    font-size: 10px;
                    text-align: center;
                }
                .threshold-unit {
                    background: #555;
                    color: #ccc;
                    padding: 2px 4px;
                    border: 1px solid #555;
                    border-left: none;
                    border-radius: 0 3px 3px 0;
                    font-size: 10px;
                }
                .log-section {
                    margin-top: 10px;
                    padding-top: 8px;
                    border-top: 1px solid #333;
                }
                .log-title {
                    font-size: 11px;
                    color: #aaa;
                    margin-bottom: 6px;
                }
                #log-container {
                    background: #222;
                    border-radius: 4px;
                    padding: 6px;
                    max-height: 120px;
                    overflow-y: auto;
                    font-size: 10px;
                }
                .log-entry {
                    padding: 2px 0;
                    border-bottom: 1px solid #333;
                }
                .log-entry:last-child {
                    border-bottom: none;
                }
                .log-time {
                    color: #888;
                }
                .log-empty {
                    color: #666;
                    text-align: center;
                    padding: 10px;
                }
            </style>
            <h3>🐱 锚国小管家</h3>
            
            <div class="helper-section">
                <div class="helper-section-title">基础功能</div>
                <div class="helper-row">
                    <label>采集猫薄荷</label>
                    <span id="harvest-status" class="helper-status status-off">关闭</span>
                    <button id="harvest-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>观测天空</label>
                    <span id="observe-status" class="helper-status status-off">关闭</span>
                    <button id="observe-toggle" class="helper-btn">开启</button>
                </div>
            </div>
            
            <div class="helper-section">
                <div class="helper-section-title">资源转换（触发阈值）</div>
                <div class="helper-row">
                    <label>猫薄荷→木材</label>
                    <input type="number" id="catnip-threshold" class="threshold-input" value="${Math.round(config.catnipToWoodThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="catnip-status" class="helper-status status-off">关闭</span>
                    <button id="catnip-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>木材→木梁</label>
                    <input type="number" id="wood-threshold" class="threshold-input" value="${Math.round(config.woodToBeamThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="wood-status" class="helper-status status-off">关闭</span>
                    <button id="wood-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>矿物→石板</label>
                    <input type="number" id="mineral-threshold" class="threshold-input" value="${Math.round(config.mineralToSlabThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="mineral-status" class="helper-status status-off">关闭</span>
                    <button id="mineral-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>煤→钢</label>
                    <input type="number" id="coal-threshold" class="threshold-input" value="${Math.round(config.coalToSteelThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="coal-status" class="helper-status status-off">关闭</span>
                    <button id="coal-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>铁→金属板</label>
                    <input type="number" id="iron-threshold" class="threshold-input" value="${Math.round(config.ironToPlateThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="iron-status" class="helper-status status-off">关闭</span>
                    <button id="iron-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>赞美太阳</label>
                    <input type="number" id="faith-threshold" class="threshold-input" value="${Math.round(config.praiseSunThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="faith-status" class="helper-status status-off">关闭</span>
                    <button id="faith-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>羊皮纸→手稿</label>
                    <input type="number" id="parchment-threshold" class="threshold-input" value="${Math.round(config.parchmentToManuscriptThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="parchment-status" class="helper-status status-off">关闭</span>
                    <button id="parchment-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>手稿→概要</label>
                    <input type="number" id="manuscript-threshold" class="threshold-input" value="${Math.round(config.manuscriptToCompendiumThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="manuscript-status" class="helper-status status-off">关闭</span>
                    <button id="manuscript-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>概要→蓝图</label>
                    <input type="number" id="compendium-threshold" class="threshold-input" value="${Math.round(config.compendiumToBlueprintThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="compendium-status" class="helper-status status-off">关闭</span>
                    <button id="compendium-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>钛→合金</label>
                    <input type="number" id="titanium-threshold" class="threshold-input" value="${Math.round(config.titaniumToAlloyThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="titanium-status" class="helper-status status-off">关闭</span>
                    <button id="titanium-toggle" class="helper-btn">开启</button>
                </div>
                <div class="helper-row">
                    <label>派出猎人</label>
                    <input type="number" id="hunt-threshold" class="threshold-input" value="${Math.round(config.huntThreshold * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                    <span id="hunt-status" class="helper-status status-off">关闭</span>
                    <button id="hunt-toggle" class="helper-btn">开启</button>
                </div>
            </div>
            
            <div class="helper-section">
                <div class="helper-section-title">定时转换</div>
                <div class="helper-row">
                    <label>毛皮→羊皮纸</label>
                    <input type="number" id="fur-interval" class="threshold-input" value="${config.furToParchmentInterval}" min="1" max="3600"><span class="threshold-unit">s</span>
                    <span id="fur-status" class="helper-status status-off">关闭</span>
                    <button id="fur-toggle" class="helper-btn">开启</button>
                </div>
            </div>
            
            <div class="log-section">
                <div class="log-title">📋 转换日志</div>
                <div id="log-container">
                    <div class="log-empty">暂无转换记录</div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('harvest-toggle').addEventListener('click', toggleHarvest);
        document.getElementById('observe-toggle').addEventListener('click', toggleObserve);
        document.getElementById('catnip-toggle').addEventListener('click', toggleCatnipToWood);
        document.getElementById('wood-toggle').addEventListener('click', toggleWoodToBeam);
        document.getElementById('mineral-toggle').addEventListener('click', toggleMineralToSlab);
        document.getElementById('coal-toggle').addEventListener('click', toggleCoalToSteel);
        document.getElementById('iron-toggle').addEventListener('click', toggleIronToPlate);
        document.getElementById('faith-toggle').addEventListener('click', togglePraiseSun);
        document.getElementById('parchment-toggle').addEventListener('click', toggleParchmentToManuscript);
        document.getElementById('manuscript-toggle').addEventListener('click', toggleManuscriptToCompendium);
        document.getElementById('compendium-toggle').addEventListener('click', toggleCompendiumToBlueprint);
        document.getElementById('titanium-toggle').addEventListener('click', toggleTitaniumToAlloy);
        document.getElementById('hunt-toggle').addEventListener('click', toggleHunt);
        document.getElementById('fur-toggle').addEventListener('click', toggleFurToParchment);

        document.getElementById('catnip-threshold').addEventListener('change', (e) => {
            config.catnipToWoodThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.catnipToWoodThreshold * 100);
            saveConfig();
        });
        document.getElementById('wood-threshold').addEventListener('change', (e) => {
            config.woodToBeamThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.woodToBeamThreshold * 100);
            saveConfig();
        });
        document.getElementById('mineral-threshold').addEventListener('change', (e) => {
            config.mineralToSlabThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.mineralToSlabThreshold * 100);
            saveConfig();
        });
        document.getElementById('coal-threshold').addEventListener('change', (e) => {
            config.coalToSteelThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.coalToSteelThreshold * 100);
            saveConfig();
        });
        document.getElementById('iron-threshold').addEventListener('change', (e) => {
            config.ironToPlateThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.ironToPlateThreshold * 100);
            saveConfig();
        });
        document.getElementById('faith-threshold').addEventListener('change', (e) => {
            config.praiseSunThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.praiseSunThreshold * 100);
            saveConfig();
        });
        document.getElementById('parchment-threshold').addEventListener('change', (e) => {
            config.parchmentToManuscriptThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.parchmentToManuscriptThreshold * 100);
            saveConfig();
        });
        document.getElementById('manuscript-threshold').addEventListener('change', (e) => {
            config.manuscriptToCompendiumThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.manuscriptToCompendiumThreshold * 100);
            saveConfig();
        });
        document.getElementById('compendium-threshold').addEventListener('change', (e) => {
            config.compendiumToBlueprintThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.compendiumToBlueprintThreshold * 100);
            saveConfig();
        });
        document.getElementById('titanium-threshold').addEventListener('change', (e) => {
            config.titaniumToAlloyThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.titaniumToAlloyThreshold * 100);
            saveConfig();
        });
        document.getElementById('hunt-threshold').addEventListener('change', (e) => {
            config.huntThreshold = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
            e.target.value = Math.round(config.huntThreshold * 100);
            saveConfig();
        });
        document.getElementById('fur-interval').addEventListener('change', (e) => {
            config.furToParchmentInterval = Math.max(1, Math.min(3600, parseInt(e.target.value) || 10));
            e.target.value = config.furToParchmentInterval;
            saveConfig();
            if (config.autoFurToParchment) {
                stopAutoFurToParchment();
                startAutoFurToParchment();
            }
        });
    }

    /**
     * 更新状态面板显示
     */
    function updateStatusPanel() {
        const harvestStatus = document.getElementById('harvest-status');
        const harvestBtn = document.getElementById('harvest-toggle');
        const observeStatus = document.getElementById('observe-status');
        const observeBtn = document.getElementById('observe-toggle');
        const catnipStatus = document.getElementById('catnip-status');
        const catnipBtn = document.getElementById('catnip-toggle');
        const woodStatus = document.getElementById('wood-status');
        const woodBtn = document.getElementById('wood-toggle');
        const mineralStatus = document.getElementById('mineral-status');
        const mineralBtn = document.getElementById('mineral-toggle');
        const coalStatus = document.getElementById('coal-status');
        const coalBtn = document.getElementById('coal-toggle');
        const ironStatus = document.getElementById('iron-status');
        const ironBtn = document.getElementById('iron-toggle');
        const faithStatus = document.getElementById('faith-status');
        const faithBtn = document.getElementById('faith-toggle');
        const parchmentStatus = document.getElementById('parchment-status');
        const parchmentBtn = document.getElementById('parchment-toggle');
        const manuscriptStatus = document.getElementById('manuscript-status');
        const manuscriptBtn = document.getElementById('manuscript-toggle');
        const compendiumStatus = document.getElementById('compendium-status');
        const compendiumBtn = document.getElementById('compendium-toggle');
        const titaniumStatus = document.getElementById('titanium-status');
        const titaniumBtn = document.getElementById('titanium-toggle');
        const huntStatus = document.getElementById('hunt-status');
        const huntBtn = document.getElementById('hunt-toggle');
        const furStatus = document.getElementById('fur-status');
        const furBtn = document.getElementById('fur-toggle');

        if (harvestStatus && harvestBtn) {
            if (config.autoHarvestCatnip) {
                harvestStatus.textContent = '运行';
                harvestStatus.className = 'helper-status status-on';
                harvestBtn.textContent = '关闭';
                harvestBtn.classList.add('active');
            } else {
                harvestStatus.textContent = '关闭';
                harvestStatus.className = 'helper-status status-off';
                harvestBtn.textContent = '开启';
                harvestBtn.classList.remove('active');
            }
        }

        if (observeStatus && observeBtn) {
            if (config.autoObserveSky) {
                observeStatus.textContent = '运行';
                observeStatus.className = 'helper-status status-on';
                observeBtn.textContent = '关闭';
                observeBtn.classList.add('active');
            } else {
                observeStatus.textContent = '关闭';
                observeStatus.className = 'helper-status status-off';
                observeBtn.textContent = '开启';
                observeBtn.classList.remove('active');
            }
        }

        if (catnipStatus && catnipBtn) {
            if (config.autoCatnipToWood) {
                catnipStatus.textContent = '运行';
                catnipStatus.className = 'helper-status status-on';
                catnipBtn.textContent = '关闭';
                catnipBtn.classList.add('active');
            } else {
                catnipStatus.textContent = '关闭';
                catnipStatus.className = 'helper-status status-off';
                catnipBtn.textContent = '开启';
                catnipBtn.classList.remove('active');
            }
        }

        if (woodStatus && woodBtn) {
            if (config.autoWoodToBeam) {
                woodStatus.textContent = '运行';
                woodStatus.className = 'helper-status status-on';
                woodBtn.textContent = '关闭';
                woodBtn.classList.add('active');
            } else {
                woodStatus.textContent = '关闭';
                woodStatus.className = 'helper-status status-off';
                woodBtn.textContent = '开启';
                woodBtn.classList.remove('active');
            }
        }

        if (mineralStatus && mineralBtn) {
            if (config.autoMineralToSlab) {
                mineralStatus.textContent = '运行';
                mineralStatus.className = 'helper-status status-on';
                mineralBtn.textContent = '关闭';
                mineralBtn.classList.add('active');
            } else {
                mineralStatus.textContent = '关闭';
                mineralStatus.className = 'helper-status status-off';
                mineralBtn.textContent = '开启';
                mineralBtn.classList.remove('active');
            }
        }

        if (coalStatus && coalBtn) {
            if (config.autoCoalToSteel) {
                coalStatus.textContent = '运行';
                coalStatus.className = 'helper-status status-on';
                coalBtn.textContent = '关闭';
                coalBtn.classList.add('active');
            } else {
                coalStatus.textContent = '关闭';
                coalStatus.className = 'helper-status status-off';
                coalBtn.textContent = '开启';
                coalBtn.classList.remove('active');
            }
        }

        if (ironStatus && ironBtn) {
            if (config.autoIronToPlate) {
                ironStatus.textContent = '运行';
                ironStatus.className = 'helper-status status-on';
                ironBtn.textContent = '关闭';
                ironBtn.classList.add('active');
            } else {
                ironStatus.textContent = '关闭';
                ironStatus.className = 'helper-status status-off';
                ironBtn.textContent = '开启';
                ironBtn.classList.remove('active');
            }
        }

        if (faithStatus && faithBtn) {
            if (config.autoPraiseSun) {
                faithStatus.textContent = '运行';
                faithStatus.className = 'helper-status status-on';
                faithBtn.textContent = '关闭';
                faithBtn.classList.add('active');
            } else {
                faithStatus.textContent = '关闭';
                faithStatus.className = 'helper-status status-off';
                faithBtn.textContent = '开启';
                faithBtn.classList.remove('active');
            }
        }

        if (parchmentStatus && parchmentBtn) {
            if (config.autoParchmentToManuscript) {
                parchmentStatus.textContent = '运行';
                parchmentStatus.className = 'helper-status status-on';
                parchmentBtn.textContent = '关闭';
                parchmentBtn.classList.add('active');
            } else {
                parchmentStatus.textContent = '关闭';
                parchmentStatus.className = 'helper-status status-off';
                parchmentBtn.textContent = '开启';
                parchmentBtn.classList.remove('active');
            }
        }

        if (manuscriptStatus && manuscriptBtn) {
            if (config.autoManuscriptToCompendium) {
                manuscriptStatus.textContent = '运行';
                manuscriptStatus.className = 'helper-status status-on';
                manuscriptBtn.textContent = '关闭';
                manuscriptBtn.classList.add('active');
            } else {
                manuscriptStatus.textContent = '关闭';
                manuscriptStatus.className = 'helper-status status-off';
                manuscriptBtn.textContent = '开启';
                manuscriptBtn.classList.remove('active');
            }
        }

        if (compendiumStatus && compendiumBtn) {
            if (config.autoCompendiumToBlueprint) {
                compendiumStatus.textContent = '运行';
                compendiumStatus.className = 'helper-status status-on';
                compendiumBtn.textContent = '关闭';
                compendiumBtn.classList.add('active');
            } else {
                compendiumStatus.textContent = '关闭';
                compendiumStatus.className = 'helper-status status-off';
                compendiumBtn.textContent = '开启';
                compendiumBtn.classList.remove('active');
            }
        }

        if (titaniumStatus && titaniumBtn) {
            if (config.autoTitaniumToAlloy) {
                titaniumStatus.textContent = '运行';
                titaniumStatus.className = 'helper-status status-on';
                titaniumBtn.textContent = '关闭';
                titaniumBtn.classList.add('active');
            } else {
                titaniumStatus.textContent = '关闭';
                titaniumStatus.className = 'helper-status status-off';
                titaniumBtn.textContent = '开启';
                titaniumBtn.classList.remove('active');
            }
        }

        if (huntStatus && huntBtn) {
            if (config.autoHunt) {
                huntStatus.textContent = '运行';
                huntStatus.className = 'helper-status status-on';
                huntBtn.textContent = '关闭';
                huntBtn.classList.add('active');
            } else {
                huntStatus.textContent = '关闭';
                huntStatus.className = 'helper-status status-off';
                huntBtn.textContent = '开启';
                huntBtn.classList.remove('active');
            }
        }

        if (furStatus && furBtn) {
            if (config.autoFurToParchment) {
                furStatus.textContent = '运行';
                furStatus.className = 'helper-status status-on';
                furBtn.textContent = '关闭';
                furBtn.classList.add('active');
            } else {
                furStatus.textContent = '关闭';
                furStatus.className = 'helper-status status-off';
                furBtn.textContent = '开启';
                furBtn.classList.remove('active');
            }
        }
    }

    /**
     * 切换自动采集猫薄荷的开关状态
     */
    function toggleHarvest() {
        config.autoHarvestCatnip = !config.autoHarvestCatnip;
        saveConfig();
        if (config.autoHarvestCatnip) {
            startAutoHarvest();
        } else {
            stopAutoHarvest();
        }
    }

    /**
     * 切换自动观测天空的开关状态
     */
    function toggleObserve() {
        config.autoObserveSky = !config.autoObserveSky;
        saveConfig();
        if (config.autoObserveSky) {
            startAutoObserve();
        } else {
            stopAutoObserve();
        }
    }

    /**
     * 切换猫薄荷转木材的开关状态
     */
    function toggleCatnipToWood() {
        config.autoCatnipToWood = !config.autoCatnipToWood;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换木材转木梁的开关状态
     */
    function toggleWoodToBeam() {
        config.autoWoodToBeam = !config.autoWoodToBeam;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换矿物转石板的开关状态
     */
    function toggleMineralToSlab() {
        config.autoMineralToSlab = !config.autoMineralToSlab;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换煤转钢的开关状态
     */
    function toggleCoalToSteel() {
        config.autoCoalToSteel = !config.autoCoalToSteel;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换铁转金属板的开关状态
     */
    function toggleIronToPlate() {
        config.autoIronToPlate = !config.autoIronToPlate;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换赞美太阳的开关状态
     */
    function togglePraiseSun() {
        config.autoPraiseSun = !config.autoPraiseSun;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换羊皮纸转手稿的开关状态
     */
    function toggleParchmentToManuscript() {
        config.autoParchmentToManuscript = !config.autoParchmentToManuscript;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换手稿转概要的开关状态
     */
    function toggleManuscriptToCompendium() {
        config.autoManuscriptToCompendium = !config.autoManuscriptToCompendium;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换概要转蓝图的开关状态
     */
    function toggleCompendiumToBlueprint() {
        config.autoCompendiumToBlueprint = !config.autoCompendiumToBlueprint;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换钛合成合金的开关状态
     */
    function toggleTitaniumToAlloy() {
        config.autoTitaniumToAlloy = !config.autoTitaniumToAlloy;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换派出猎人的开关状态
     */
    function toggleHunt() {
        config.autoHunt = !config.autoHunt;
        saveConfig();
        updateConvertTimer();
        updateStatusPanel();
    }

    /**
     * 切换毛皮转羊皮纸的开关状态
     */
    function toggleFurToParchment() {
        config.autoFurToParchment = !config.autoFurToParchment;
        saveConfig();
        if (config.autoFurToParchment) {
            startAutoFurToParchment();
        } else {
            stopAutoFurToParchment();
        }
    }

    /**
     * 更新转换定时器状态
     */
    function updateConvertTimer() {
        const needConvert = config.autoCatnipToWood || config.autoWoodToBeam || config.autoMineralToSlab || config.autoCoalToSteel || config.autoIronToPlate || config.autoPraiseSun || config.autoParchmentToManuscript || config.autoManuscriptToCompendium || config.autoCompendiumToBlueprint || config.autoTitaniumToAlloy || config.autoHunt;
        if (needConvert && !timers.convert) {
            startAutoConvert();
        } else if (!needConvert && timers.convert) {
            stopAutoConvert();
        }
    }

    /**
     * 注册油猴菜单命令
     */
    function registerMenuCommands() {
        GM_registerMenuCommand('🔄 重置所有设置', () => {
            config = { ...DEFAULT_CONFIG };
            saveConfig();
            stopAutoHarvest();
            stopAutoObserve();
            stopAutoConvert();
            stopAutoFurToParchment();
            location.reload();
        });
    }

    /**
     * 初始化函数
     */
    function init() {
        setTimeout(() => {
            createStatusPanel();
            registerMenuCommands();
            
            if (config.autoHarvestCatnip) {
                startAutoHarvest();
            }
            if (config.autoObserveSky) {
                startAutoObserve();
            }
            if (config.autoFurToParchment) {
                startAutoFurToParchment();
            }
            updateConvertTimer();
            
            updateStatusPanel();
            
            console.log('🐱 猫国建设者自动化助手已启动！v1.5.1');
        }, 2000);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
