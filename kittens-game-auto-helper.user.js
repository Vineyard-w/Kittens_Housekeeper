// ==UserScript==
// @name         猫国建设者小管家
// @namespace    kittens-game-helper
// @version      1.7.0
// @description  自动采集猫薄荷、自动观测天空、资源自动转换、自动派出商队
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
 * 12. 自动合成合金（定时）
 * 13. 自动转换毛皮成羊皮纸（定时）
 * 14. 自动派出商队（定时）
 * 15. 可视化控制面板（可折叠、可拖拽）
 * 16. 配置持久化存储
 * 17. 转换日志记录（自动清理）
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
        harvestInterval: 100,           // 采集猫薄荷间隔（毫秒）
        observeInterval: 2000,          // 观测天空间隔（毫秒）
        autoCatnipToWood: false,        // 自动转换猫薄荷成木材开关
        catnipToWoodThreshold: 0.8,     // 猫薄荷转木材触发阈值（0.8 = 80%）
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
        titaniumToAlloyInterval: 400,   // 钛合成合金间隔（秒）
        autoFurToParchment: false,      // 自动转换毛皮成羊皮纸开关
        furToParchmentInterval: 10,     // 毛皮转羊皮纸间隔（秒）
        autoTradeCaravan: false,        // 自动派出商队开关
        tradeCaravanInterval: 300,      // 派出商队间隔（秒）
        tradeCaravanMinManpower: 1500,  // 派出商队最低喵力要求
        autoHunt: false,                // 自动派出猎人开关
        huntThreshold: 0.9,             // 喵力触发派出猎人阈值
        convertInterval: 3000,          // 资源转换检测间隔（毫秒）
        logAutoCleanMinutes: 30         // 日志自动清理时间（分钟）
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
        parchmentToManuscriptBtn: '//*[@id="leftColumnViewport"]/div/div[6]/div[2]/div/div[12]/div[3]/div/span[2]',  // 羊皮纸转手稿按钮
        
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
        huntBtn: '//*[@id="fastHuntContainerCount"]/span[1]',  // 派出猎人按钮
        
        // 派出商队
        tradeCaravanBtn: '//*[@id="gameContainerId"]/div[2]/div[5]/div[3]/div[2]/div[1]/div/span'  // 派出商队按钮
    };

    /**
     * 功能特性定义表
     * 数据驱动：所有功能的 UI 生成、状态更新、事件绑定均基于此数组
     * type: basic=基础功能, convert=阈值触发转换, timed=定时转换
     * @type {Array<Object>}
     */
    const FEATURES = [
        { id: 'harvest', label: '采集猫薄荷', configKey: 'autoHarvestCatnip', type: 'basic' },
        { id: 'observe', label: '观测天空', configKey: 'autoObserveSky', type: 'basic' },
        { id: 'catnip', label: '猫薄荷→木材', configKey: 'autoCatnipToWood', thresholdKey: 'catnipToWoodThreshold', type: 'convert' },
        { id: 'wood', label: '木材→木梁', configKey: 'autoWoodToBeam', thresholdKey: 'woodToBeamThreshold', type: 'convert' },
        { id: 'mineral', label: '矿物→石板', configKey: 'autoMineralToSlab', thresholdKey: 'mineralToSlabThreshold', type: 'convert' },
        { id: 'coal', label: '煤→钢', configKey: 'autoCoalToSteel', thresholdKey: 'coalToSteelThreshold', type: 'convert' },
        { id: 'iron', label: '铁→金属板', configKey: 'autoIronToPlate', thresholdKey: 'ironToPlateThreshold', type: 'convert' },
        { id: 'faith', label: '赞美太阳', configKey: 'autoPraiseSun', thresholdKey: 'praiseSunThreshold', type: 'convert' },
        { id: 'parchment', label: '羊皮纸→手稿', configKey: 'autoParchmentToManuscript', thresholdKey: 'parchmentToManuscriptThreshold', type: 'convert' },
        { id: 'manuscript', label: '手稿→概要', configKey: 'autoManuscriptToCompendium', thresholdKey: 'manuscriptToCompendiumThreshold', type: 'convert' },
        { id: 'compendium', label: '概要→蓝图', configKey: 'autoCompendiumToBlueprint', thresholdKey: 'compendiumToBlueprintThreshold', type: 'convert' },
        { id: 'hunt', label: '派出猎人', configKey: 'autoHunt', thresholdKey: 'huntThreshold', type: 'convert' },
        { id: 'titanium', label: '钛→合金', configKey: 'autoTitaniumToAlloy', thresholdKey: 'titaniumToAlloyThreshold', intervalKey: 'titaniumToAlloyInterval', type: 'timed' },
        { id: 'fur', label: '毛皮→羊皮纸', configKey: 'autoFurToParchment', intervalKey: 'furToParchmentInterval', type: 'timed' },
        { id: 'caravan', label: '派出商队', configKey: 'autoTradeCaravan', intervalKey: 'tradeCaravanInterval', type: 'timed' }
    ];

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
        furToParchment: null,
        titaniumToAlloy: null,
        tradeCaravan: null,
        logClean: null
    };

    /**
     * 转换日志记录
     * @type {Array<{time: string, action: string, timestamp: number}>}
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
     * 日志面板脏标记（用于 rAF 节流）
     * @type {boolean}
     */
    let logPanelDirty = false;

    /**
     * 日志面板 rAF 请求 ID
     * @type {number|null}
     */
    let logPanelRafId = null;

    /**
     * 从油猴存储加载配置
     * @returns {Object} 配置对象
     */
    function loadConfig() {
        const saved = GM_getValue('kittensHelperConfig');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_CONFIG, ...parsed };
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
     * 支持 K（千）、M（百万）、G（十亿）、T（万亿）单位
     * @param {string} text - 文本内容
     * @returns {number|null} 解析后的数值，解析失败返回 null
     */
    function parseValueWithUnit(text) {
        text = text.trim();
        if (!text) return null;

        const unitMultipliers = {
            'K': 1e3,
            'M': 1e6,
            'G': 1e9,
            'T': 1e12
        };
        const lastChar = text.slice(-1).toUpperCase();
        const multiplier = unitMultipliers[lastChar] || 1;
        if (multiplier > 1) {
            text = text.slice(0, -1).trim();
        }

        // 移除逗号分隔符
        text = text.replace(/,/g, '');

        const num = parseFloat(text);
        if (isNaN(num)) return null;

        return num * multiplier;
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
     * 获取库存上限数值（处理'/'前缀和单位）
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
     * 添加一条转换日志
     * @param {string} action - 转换动作描述
     */
    function addLog(action) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        convertLogs.unshift({ time, action, timestamp: Date.now() });
        if (convertLogs.length > MAX_LOGS) {
            convertLogs.length = MAX_LOGS;
        }
        scheduleLogPanelUpdate();
    }

    /**
     * 执行转换并记录日志（带冷却时间检查）
     * @param {string} xpath - 转换按钮的 XPath
     * @param {string} action - 转换动作描述
     * @param {string} type - 转换类型标识
     */
    function convertWithCooldown(xpath, action, type) {
        if (isInCooldown(type)) return;

        const element = getElementByXPath(xpath);
        if (element) {
            const buttonText = element.textContent.trim();
            const convertValue = parseValueWithUnit(buttonText);
            element.click();
            lastConvertTime[type] = Date.now();
            const logAction = convertValue !== null ? `${action} (${convertValue})` : action;
            addLog(logAction);
        }
    }

    /**
     * 调度日志面板更新（使用 rAF 节流）
     * 同一帧内多次调用只会触发一次实际 DOM 更新
     */
    function scheduleLogPanelUpdate() {
        if (logPanelDirty) return;
        logPanelDirty = true;
        logPanelRafId = requestAnimationFrame(updateLogPanel);
    }

    /**
     * 更新日志面板显示
     * 使用 DocumentFragment + textContent 代替 innerHTML，避免 XSS 风险
     */
    function updateLogPanel() {
        logPanelDirty = false;
        logPanelRafId = null;
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;

        // 清空现有内容
        while (logContainer.firstChild) {
            logContainer.removeChild(logContainer.firstChild);
        }

        if (convertLogs.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'log-empty';
            emptyDiv.textContent = '暂无转换记录';
            logContainer.appendChild(emptyDiv);
            return;
        }

        // 使用 DocumentFragment 批量插入，减少重排
        const fragment = document.createDocumentFragment();
        convertLogs.forEach(log => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = `[${log.time}] `;
            entry.appendChild(timeSpan);
            entry.appendChild(document.createTextNode(log.action));
            fragment.appendChild(entry);
        });
        logContainer.appendChild(fragment);
    }

    /**
     * 清理过期日志和冷却时间记录
     * 过期时间由 config.logAutoCleanMinutes 控制，默认30分钟
     * 冷却时间记录超过2倍冷却期也会被清理，防止内存泄漏
     */
    function cleanExpiredLogs() {
        const expireMs = (config.logAutoCleanMinutes || 30) * 60 * 1000;
        const now = Date.now();
        const beforeLen = convertLogs.length;
        convertLogs = convertLogs.filter(log => (now - log.timestamp) < expireMs);

        // 清理过期的冷却时间记录
        const cooldownKeys = Object.keys(lastConvertTime);
        cooldownKeys.forEach(key => {
            if ((now - lastConvertTime[key]) > LOG_COOLDOWN * 2) {
                delete lastConvertTime[key];
            }
        });

        // 仅在数据有变化时才触发面板更新
        if (convertLogs.length !== beforeLen || cooldownKeys.length !== Object.keys(lastConvertTime).length) {
            scheduleLogPanelUpdate();
        }
    }

    /**
     * 启动日志自动清理定时器（每60秒执行一次）
     */
    function startLogCleanTimer() {
        if (timers.logClean) return;
        timers.logClean = setInterval(cleanExpiredLogs, 60000);
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
     * 启动自动转换毛皮成羊皮纸（定时，带冷却）
     */
    function startAutoFurToParchment() {
        if (timers.furToParchment) return;
        timers.furToParchment = setInterval(() => {
            if (config.autoFurToParchment) {
                convertWithCooldown(XPATH.furToParchmentBtn, '毛皮 → 羊皮纸', 'fur');
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
     * 启动自动合成合金（定时，带阈值判断和冷却）
     */
    function startAutoTitaniumToAlloy() {
        if (timers.titaniumToAlloy) return;
        const interval = (config.titaniumToAlloyInterval || 400) * 1000;
        timers.titaniumToAlloy = setInterval(() => {
            if (config.autoTitaniumToAlloy && shouldConvert(XPATH.titaniumCurrent, XPATH.titaniumMax, config.titaniumToAlloyThreshold)) {
                convertWithCooldown(XPATH.titaniumToAlloyBtn, '钛 → 合金', 'titanium');
            }
        }, interval);
        updateStatusPanel();
    }

    /**
     * 停止自动合成合金
     */
    function stopAutoTitaniumToAlloy() {
        if (timers.titaniumToAlloy) {
            clearInterval(timers.titaniumToAlloy);
            timers.titaniumToAlloy = null;
        }
        updateStatusPanel();
    }

    /**
     * 启动自动派出商队（定时，带喵力检查和冷却）
     */
    function startAutoTradeCaravan() {
        if (timers.tradeCaravan) return;
        const interval = (config.tradeCaravanInterval || 300) * 1000;
        timers.tradeCaravan = setInterval(() => {
            if (config.autoTradeCaravan) {
                const manpower = getResourceValue(XPATH.manpowerCurrent);
                if (manpower !== null && manpower > (config.tradeCaravanMinManpower || 1500)) {
                    if (!isInCooldown('caravan')) {
                        const element = getElementByXPath(XPATH.tradeCaravanBtn);
                        if (element) {
                            element.click();
                            lastConvertTime['caravan'] = Date.now();
                            addLog(`派出商队 (喵力: ${manpower})`);
                        }
                    }
                }
            }
        }, interval);
        updateStatusPanel();
    }

    /**
     * 停止自动派出商队
     */
    function stopAutoTradeCaravan() {
        if (timers.tradeCaravan) {
            clearInterval(timers.tradeCaravan);
            timers.tradeCaravan = null;
        }
        updateStatusPanel();
    }

    /**
     * 更新状态面板显示（数据驱动，遍历 FEATURES 数组）
     */
    function updateStatusPanel() {
        FEATURES.forEach(feature => {
            const status = document.getElementById(`${feature.id}-status`);
            const btn = document.getElementById(`${feature.id}-toggle`);
            if (status && btn) {
                const isOn = config[feature.configKey];
                status.textContent = isOn ? '运行' : '关闭';
                status.className = `helper-status ${isOn ? 'status-on' : 'status-off'}`;
                btn.textContent = isOn ? '关闭' : '开启';
                btn.classList.toggle('active', isOn);
            }
        });
    }

    /**
     * 切换功能开关状态（数据驱动）
     * 独立定时器功能（采集/观测/毛皮/合金/商队）直接启停
     * 阈值转换功能统一通过 updateConvertTimer 管理
     * @param {Object} feature - FEATURES 中的功能定义对象
     */
    function toggleFeature(feature) {
        config[feature.configKey] = !config[feature.configKey];
        saveConfig();

        // 独立定时器功能的启停映射
        const startStopMap = {
            'harvest': [startAutoHarvest, stopAutoHarvest],
            'observe': [startAutoObserve, stopAutoObserve],
            'fur': [startAutoFurToParchment, stopAutoFurToParchment],
            'titanium': [startAutoTitaniumToAlloy, stopAutoTitaniumToAlloy],
            'caravan': [startAutoTradeCaravan, stopAutoTradeCaravan]
        };

        if (startStopMap[feature.id]) {
            const [startFn, stopFn] = startStopMap[feature.id];
            if (config[feature.configKey]) {
                startFn();
            } else {
                stopFn();
            }
        } else {
            // 阈值转换功能，统一管理定时器
            updateConvertTimer();
            updateStatusPanel();
        }
    }

    /**
     * 更新转换定时器状态
     * 当任一阈值转换功能开启时启动定时器，全部关闭时停止
     */
    function updateConvertTimer() {
        const convertKeys = [
            'autoCatnipToWood', 'autoWoodToBeam', 'autoMineralToSlab',
            'autoCoalToSteel', 'autoIronToPlate', 'autoPraiseSun',
            'autoParchmentToManuscript', 'autoManuscriptToCompendium',
            'autoCompendiumToBlueprint', 'autoHunt'
        ];
        const needConvert = convertKeys.some(key => config[key]);
        if (needConvert && !timers.convert) {
            startAutoConvert();
        } else if (!needConvert && timers.convert) {
            stopAutoConvert();
        }
    }

    /**
     * HTML 转义工具函数
     * @param {string} str - 需要转义的字符串
     * @returns {string} 转义后的安全字符串
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 创建状态控制面板
     * 包含：基础功能开关、资源转换阈值设置、定时转换设置、日志面板
     * 支持：折叠/展开、拖拽移动
     */
    function createStatusPanel() {
        // 防止重复创建
        if (document.getElementById('kittens-helper-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'kittens-helper-panel';

        // 将 CSS 样式注入到 <head> 中，避免内联在 innerHTML 里
        const style = document.createElement('style');
        style.textContent = `
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
                user-select: none;
            }
            #kittens-helper-panel.collapsed {
                max-height: none;
                overflow: visible;
            }
            #kittens-helper-panel.collapsed .helper-section,
            #kittens-helper-panel.collapsed .log-section {
                display: none;
            }
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid #444;
            }
            .panel-header h3 {
                margin: 0;
                font-size: 14px;
                pointer-events: none;
            }
            .panel-collapse-btn {
                background: none;
                border: 1px solid #555;
                color: #aaa;
                cursor: pointer;
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
                line-height: 1;
            }
            .panel-collapse-btn:hover {
                color: #fff;
                border-color: #888;
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
        `;
        document.head.appendChild(style);

        // 按类型分组生成面板 HTML
        const basicFeatures = FEATURES.filter(f => f.type === 'basic');
        const convertFeatures = FEATURES.filter(f => f.type === 'convert');
        const timedFeatures = FEATURES.filter(f => f.type === 'timed');

        let html = `
            <div class="panel-header">
                <h3>🐱 猫国小管家</h3>
                <button class="panel-collapse-btn" id="panel-collapse-btn">−</button>
            </div>
        `;

        // 基础功能区域
        html += `<div class="helper-section"><div class="helper-section-title">基础功能</div>`;
        basicFeatures.forEach(f => {
            html += `<div class="helper-row">
                <label>${f.label}</label>
                <span id="${f.id}-status" class="helper-status status-off">关闭</span>
                <button id="${f.id}-toggle" class="helper-btn">开启</button>
            </div>`;
        });
        html += `</div>`;

        // 资源转换区域（带阈值输入）
        html += `<div class="helper-section"><div class="helper-section-title">资源转换（触发阈值）</div>`;
        convertFeatures.forEach(f => {
            html += `<div class="helper-row">
                <label>${f.label}</label>
                <input type="number" id="${f.id}-threshold" class="threshold-input" value="${Math.round(config[f.thresholdKey] * 100)}" min="1" max="100"><span class="threshold-unit">%</span>
                <span id="${f.id}-status" class="helper-status status-off">关闭</span>
                <button id="${f.id}-toggle" class="helper-btn">开启</button>
            </div>`;
        });
        html += `</div>`;

        // 定时转换区域（带阈值和间隔输入）
        html += `<div class="helper-section"><div class="helper-section-title">定时转换</div>`;
        timedFeatures.forEach(f => {
            html += `<div class="helper-row">
                <label>${f.label}</label>`;
            if (f.thresholdKey) {
                html += `<input type="number" id="${f.id}-threshold" class="threshold-input" value="${Math.round(config[f.thresholdKey] * 100)}" min="1" max="100"><span class="threshold-unit">%</span>`;
            }
            if (f.intervalKey) {
                html += `<input type="number" id="${f.id}-interval" class="threshold-input" value="${config[f.intervalKey]}" min="1" max="3600"><span class="threshold-unit">s</span>`;
            }
            html += `<span id="${f.id}-status" class="helper-status status-off">关闭</span>
                <button id="${f.id}-toggle" class="helper-btn">开启</button>
            </div>`;
        });
        html += `</div>`;

        // 日志区域
        html += `<div class="log-section">
            <div class="log-title">📋 转换日志</div>
            <div id="log-container">
                <div class="log-empty">暂无转换记录</div>
            </div>
        </div>`;

        panel.innerHTML = html;
        document.body.appendChild(panel);

        // 绑定功能开关点击事件
        FEATURES.forEach(f => {
            const btn = document.getElementById(`${f.id}-toggle`);
            if (btn) btn.addEventListener('click', () => toggleFeature(f));
        });

        // 绑定阈值输入变更事件
        const thresholdFeatures = FEATURES.filter(f => f.thresholdKey);
        thresholdFeatures.forEach(f => {
            const input = document.getElementById(`${f.id}-threshold`);
            if (input) {
                input.addEventListener('change', (e) => {
                    config[f.thresholdKey] = Math.max(1, Math.min(100, parseInt(e.target.value) || 90)) / 100;
                    e.target.value = Math.round(config[f.thresholdKey] * 100);
                    saveConfig();
                });
            }
        });

        // 绑定间隔输入变更事件（修改后自动重启对应定时器）
        const intervalFeatures = FEATURES.filter(f => f.intervalKey);
        intervalFeatures.forEach(f => {
            const input = document.getElementById(`${f.id}-interval`);
            if (input) {
                input.addEventListener('change', (e) => {
                    config[f.intervalKey] = Math.max(1, Math.min(3600, parseInt(e.target.value) || 10));
                    e.target.value = config[f.intervalKey];
                    saveConfig();
                    // 如果功能正在运行，重启定时器以应用新间隔
                    if (config[f.configKey]) {
                        const startStopMap = {
                            'titanium': [startAutoTitaniumToAlloy, stopAutoTitaniumToAlloy],
                            'fur': [startAutoFurToParchment, stopAutoFurToParchment],
                            'caravan': [startAutoTradeCaravan, stopAutoTradeCaravan]
                        };
                        const [startFn, stopFn] = startStopMap[f.id];
                        if (stopFn) stopFn();
                        if (startFn) startFn();
                    }
                });
            }
        });

        // 绑定折叠按钮事件
        const collapseBtn = document.getElementById('panel-collapse-btn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
                collapseBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
            });
        }

        // 初始化拖拽功能
        initDrag(panel);
    }

    /**
     * 初始化面板拖拽功能
     * 通过拖拽标题栏移动面板位置
     * @param {HTMLElement} panel - 面板 DOM 元素
     */
    function initDrag(panel) {
        const header = panel.querySelector('.panel-header');
        if (!header) return;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            // 折叠按钮不触发拖拽
            if (e.target.closest('.panel-collapse-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.left = (startLeft + dx) + 'px';
            panel.style.top = (startTop + dy) + 'px';
            panel.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
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
            stopAutoTitaniumToAlloy();
            stopAutoTradeCaravan();
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
            startLogCleanTimer();

            // 根据保存的配置恢复各功能运行状态
            if (config.autoHarvestCatnip) {
                startAutoHarvest();
            }
            if (config.autoObserveSky) {
                startAutoObserve();
            }
            if (config.autoFurToParchment) {
                startAutoFurToParchment();
            }
            if (config.autoTitaniumToAlloy) {
                startAutoTitaniumToAlloy();
            }
            if (config.autoTradeCaravan) {
                startAutoTradeCaravan();
            }
            updateConvertTimer();

            updateStatusPanel();

            console.log('🐱 猫国建设者自动化助手已启动！v1.7.0');
        }, 2000);
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
