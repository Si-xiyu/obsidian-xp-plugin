"use strict";
// src/main.ts
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
// 2. 为新用户提供默认设置
const DEFAULT_SETTINGS = {
    level: 1,
    experience: 0
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
    }
    async onload() {
        await this.loadSettings();
        // --- 功能：创建日记时增加经验 ---
        this.registerEvent(this.app.vault.on('create', async (file) => {
            if (this.isDailyNote(file)) {
                console.log(`检测到日记创建: ${file.path}`);
                await this.addExperience(XP_REWARDS.CREATE_DAILY_NOTE, "创建日记");
                this.checkboxStateCache.set(file.path, 3);
            }
        }));
        // --- 功能：修改日记中的勾选框时改变经验 ---
        this.registerEvent(this.app.vault.on('modify', async (file) => {
            if (!this.isDailyNote(file))
                return;
            const content = await this.app.vault.cachedRead(file);
            const newCount = this.countCheckedCheckboxes(content);
            const oldCount = this.checkboxStateCache.get(file.path);
            if (oldCount === undefined) {
                this.checkboxStateCache.set(file.path, newCount);
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
    async addExperience(amount, source) {
        console.log(`来源: ${source}, 经验 +${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience += amount;
        new obsidian_1.Notice(`You got ${amount} exp!`);
        this.checkForLevelUp(); // 检查是否升级
        await this.saveSettings(); // 保存数据
    }
    async subtractExperience(amount, source) {
        console.log(`来源: ${source}, 经验 -${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience = Math.max(0, this.settings.experience - amount);
        new obsidian_1.Notice(`You lost ${amount} exp!`);
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
        if (!(file instanceof obsidian_1.TFile) || file.extension !== 'md') {
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