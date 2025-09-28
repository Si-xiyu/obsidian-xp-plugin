"use strict";
// src/main.ts
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
// 2. 为新用户提供默认设置
const DEFAULT_SETTINGS = {
    level: 1,
    experience: 0,
    createdDailyNotes: [] // 新增：初始化为空数组
};
// 3. 经验值常量
const XP_REWARDS = {
    CREATE_DAILY_NOTE: 50, // 创建日记奖励
    COMPLETE_TASK: 50, // 完成任务奖励
    CANCEL_TASK: 50, // 取消任务扣除
};
const LEVEL_SYSTEM = {
    BASE_XP: 100, // 基础经验需求
    XP_MULTIPLIER: 1.2, // 经验需求倍率
    LEVEL_BONUS: 25, // 每级额外经验需求
};
class XpPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.checkboxStateCache = new Map();
        this.statusBarElement = null;
    }
    async onload() {
        await this.loadSettings();
        // 初始化状态栏
        this.initStatusBar();
        // 初始化已存在的日记文件的复选框状态
        await this.initializeExistingDailyNotes();
        // --- 功能：创建日记时增加经验 ---
        this.registerEvent(this.app.vault.on('create', async (file) => {
            if (file instanceof obsidian_1.TFile && this.isDailyNote(file)) {
                const dailyNoteKey = this.getDailyNoteKey(file);
                // 检查是否已经记录过这个日记的创建
                if (!this.settings.createdDailyNotes.includes(dailyNoteKey)) {
                    console.log(`检测到日记创建: ${file.path}`);
                    await this.addExperience(XP_REWARDS.CREATE_DAILY_NOTE, "创建日记");
                    // 记录这个日记已经被创建过了
                    this.settings.createdDailyNotes.push(dailyNoteKey);
                    await this.saveSettings();
                }
                // 初始化复选框缓存
                await this.initializeCheckboxCache(file);
            }
        }));
        // --- 功能：修改日记中的勾选框时改变经验 ---
        this.registerEvent(this.app.vault.on('modify', async (file) => {
            if (!(file instanceof obsidian_1.TFile) || !this.isDailyNote(file))
                return;
            const content = await this.app.vault.cachedRead(file);
            const newCount = this.countCheckedCheckboxes(content);
            const oldCount = this.checkboxStateCache.get(file.path);
            if (oldCount === undefined) {
                // 如果缓存中没有，初始化缓存
                await this.initializeCheckboxCache(file);
                return;
            }
            if (newCount > oldCount) {
                await this.addExperience((newCount - oldCount) * XP_REWARDS.COMPLETE_TASK, "完成任务");
            }
            else if (newCount < oldCount) {
                await this.subtractExperience((oldCount - newCount) * XP_REWARDS.CANCEL_TASK, "取消任务");
            }
            this.checkboxStateCache.set(file.path, newCount);
        }));
    }
    // 新增：初始化已存在的日记文件
    async initializeExistingDailyNotes() {
        const files = this.app.vault.getMarkdownFiles();
        for (const file of files) {
            if (this.isDailyNote(file)) {
                await this.initializeCheckboxCache(file);
            }
        }
    }
    // 新增：初始化状态栏
    initStatusBar() {
        this.statusBarElement = this.addStatusBarItem();
        this.statusBarElement.addClass('xp-status-bar');
        this.updateStatusBar();
    }
    // 新增：更新状态栏显示
    updateStatusBar() {
        if (!this.statusBarElement)
            return;
        const currentLevel = this.settings.level;
        const currentXp = this.settings.experience;
        const requiredXp = this.getRequiredXpForLevel(currentLevel);
        const progress = (currentXp / requiredXp) * 100;
        this.statusBarElement.innerHTML = `
            <div class="xp-container">
                <span class="xp-level">Level ${currentLevel}</span>
                <div class="xp-progress-bar">
                    <div class="xp-progress-fill" style="width: ${progress}%"></div>
                    <span class="xp-progress-text">${currentXp} / ${requiredXp} XP</span>
                </div>
            </div>
        `;
    }
    // 新增：初始化单个文件的复选框缓存
    async initializeCheckboxCache(file) {
        const content = await this.app.vault.cachedRead(file);
        const checkedCount = this.countCheckedCheckboxes(content);
        this.checkboxStateCache.set(file.path, checkedCount);
        console.log(`初始化 ${file.path} 的复选框状态: ${checkedCount}`);
    }
    // 新增：生成日记的唯一标识符
    getDailyNoteKey(file) {
        return `${file.basename}`; // 使用文件名作为唯一标识
    }
    async addExperience(amount, source) {
        console.log(`来源: ${source}, 经验 +${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience += amount;
        new obsidian_1.Notice(`You got ${amount} exp!`);
        this.checkForLevelUp(); // 检查是否升级
        this.updateStatusBar(); // 更新状态栏
        await this.saveSettings(); // 保存数据
    }
    async subtractExperience(amount, source) {
        console.log(`来源: ${source}, 经验 -${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience = Math.max(0, this.settings.experience - amount);
        new obsidian_1.Notice(`You lost ${amount} exp!`);
        this.updateStatusBar(); // 更新状态栏
        await this.saveSettings(); // 保存数据
    }
    checkForLevelUp() {
        const requiredXp = this.getRequiredXpForLevel(this.settings.level);
        while (this.settings.experience >= requiredXp) {
            this.settings.level++;
            this.settings.experience -= requiredXp;
            new obsidian_1.Notice(`Level Up! Now you are ${this.settings.level} level !`);
        }
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    // --- 辅助函数 ---
    getRequiredXpForLevel(level) {
        return Math.floor(LEVEL_SYSTEM.BASE_XP * Math.pow(LEVEL_SYSTEM.XP_MULTIPLIER, level - 1));
    }
    isDailyNote(file) {
        if (!file || file.extension !== 'md') {
            return false;
        }
        const dailyNoteSettings = this.getDailyNoteSettings();
        const expectedFilename = window.moment().format(dailyNoteSettings.format);
        const expectedFolderPath = (0, obsidian_1.normalizePath)(dailyNoteSettings.folder);
        const fileFolderPath = file.parent ? (0, obsidian_1.normalizePath)(file.parent.path) : '';
        return file.basename === expectedFilename && fileFolderPath === expectedFolderPath;
    }
    countCheckedCheckboxes(content) {
        const checkedRegex = /-\s\[[xX]\]/g;
        return (content.match(checkedRegex) || []).length;
    }
    getDailyNoteSettings() {
        try {
            // @ts-ignore
            const periodicNotes = this.app.plugins.getPlugin("periodic-notes");
            if (periodicNotes && periodicNotes.settings?.daily?.enabled) {
                const settings = periodicNotes.settings.daily;
                return { format: settings.format || 'YYYY-MM-DD', folder: settings.folder?.trim() || '' };
            }
            // @ts-ignore
            const dailyNotesSettings = this.app.internalPlugins.getPluginById('daily-notes')?.instance?.options;
            if (dailyNotesSettings) {
                return { format: dailyNotesSettings.format || 'YYYY-MM-DD', folder: dailyNotesSettings.folder?.trim() || '' };
            }
        }
        catch (e) {
            console.error("获取日记配置失败", e);
        }
        return { format: 'YYYY-MM-DD', folder: '' };
    }
    onunload() {
        console.log("❌ XP 插件已卸载");
    }
}
exports.default = XpPlugin;
//# sourceMappingURL=main.js.map