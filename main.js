"use strict";
// src/main.ts
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
// 2. 为新用户提供默认设置
const DEFAULT_SETTINGS = {
    level: 1,
    experience: 0
};
class XpPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        // 内存缓存保持不变
        this.checkboxStateCache = new Map();
    }
    async onload() {
        console.log("✅ XP 插件 (纯逻辑版) 已加载");
        // 加载已保存的数据
        await this.loadSettings();
        // --- 功能1：点击图标增加经验 ---
        this.addRibbonIcon("dice", "手动增加 10 点经验", async () => {
            await this.addExperience(10, "手动点击");
        });
        // --- 功能2：创建日记时增加经验 ---
        this.registerEvent(this.app.vault.on('create', async (file) => {
            if (this.isDailyNote(file)) {
                console.log(`检测到日记创建: ${file.path}`);
                await this.addExperience(50, "创建日记");
            }
        }));
        // --- 功能3：修改日记中的勾选框时改变经验 ---
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
                await this.addExperience((newCount - oldCount) * 50, "完成任务");
            }
            else if (newCount < oldCount) {
                await this.subtractExperience((oldCount - newCount) * 50, "取消任务");
            }
            this.checkboxStateCache.set(file.path, newCount);
        }));
    }
    // --- 核心功能函数 (已升级，包含数据保存和升级逻辑) ---
    async addExperience(amount, source) {
        console.log(`来源: ${source}, 经验 +${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience += amount;
        new obsidian_1.Notice(`🎉 你获得了 ${amount} 点经验！`);
        this.checkForLevelUp(); // 检查是否升级
        await this.saveSettings(); // 保存数据
    }
    async subtractExperience(amount, source) {
        console.log(`来源: ${source}, 经验 -${amount}, 当前等级: ${this.settings.level}, 当前经验: ${this.settings.experience}`);
        this.settings.experience = Math.max(0, this.settings.experience - amount);
        new obsidian_1.Notice(`😅 你失去了 ${amount} 点经验！`);
        await this.saveSettings(); // 保存数据
    }
    // 4. 处理升级的逻辑
    checkForLevelUp() {
        const requiredXp = this.getRequiredXpForLevel(this.settings.level);
        while (this.settings.experience >= requiredXp) {
            this.settings.level++;
            this.settings.experience -= requiredXp;
            new obsidian_1.Notice(`🚀 等级提升！你现在是 ${this.settings.level} 级了！`);
        }
    }
    // 5. 数据加载和保存的函数
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    // --- 辅助函数 (Helpers) ---
    getRequiredXpForLevel(level) {
        return 100 + (level - 1) * 50;
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