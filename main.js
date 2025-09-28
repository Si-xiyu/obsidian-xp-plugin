"use strict";
// src/main.ts
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
class XpPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        /**
         * ✅ 新增：一个内存缓存
         * - 键 (string): 文件的路径 (e.g., "dailies/2025-09-28.md")
         * - 值 (number): 该文件中已完成勾选框的数量
         * 这个缓存让我们能够比较文件修改前后的状态。
         */
        this.checkboxStateCache = new Map();
    }
    async onload() {
        console.log("✅ XP 插件 [测试模式] 已加载");
        // --- 功能1：点击图标增加经验 (保持不变) ---
        this.addRibbonIcon("dice", "测试：手动增加 10 点经验", () => {
            this.addExperience(10);
        });
        // --- 功能2：创建日记时增加经验 (保持不变) ---
        this.registerEvent(this.app.vault.on('create', (file) => {
            if (this.isDailyNote(file)) {
                console.log(`检测到日记创建: ${file.path}`);
                this.addExperience(50);
            }
        }));
        // --- ✅ 新增功能3：修改日记中的勾选框时改变经验 ---
        this.registerEvent(this.app.vault.on('modify', async (file) => {
            // 首先，确保被修改的是一个日记文件
            if (!this.isDailyNote(file)) {
                return;
            }
            // 读取文件当前的内容
            const content = await this.app.vault.cachedRead(file);
            const newCount = this.countCheckedCheckboxes(content);
            // 从缓存中获取上一次的勾选框数量
            const oldCount = this.checkboxStateCache.get(file.path) ?? 0;
            // 如果这是我们第一次处理这个文件，先初始化缓存
            if (!this.checkboxStateCache.has(file.path)) {
                this.checkboxStateCache.set(file.path, newCount);
                return; // 第一次不增减经验，只记录状态
            }
            // 比较新旧数量
            if (newCount > oldCount) {
                const diff = newCount - oldCount;
                const xpGained = diff * 50; // 每个勾选框获得50经验
                this.addExperience(xpGained);
            }
            else if (newCount < oldCount) {
                const diff = oldCount - newCount;
                const xpLost = diff * 50; // 每个取消的勾选框减去50经验
                this.subtractExperience(xpLost);
            }
            // 无论如何，都要更新缓存为最新状态
            this.checkboxStateCache.set(file.path, newCount);
        }));
    }
    // --- 核心功能函数 ---
    addExperience(amount) {
        new obsidian_1.Notice(`🎉 你获得了 ${amount} 点经验！`);
    }
    subtractExperience(amount) {
        new obsidian_1.Notice(`😅 你失去了 ${amount} 点经验！`);
    }
    // --- 辅助函数 (Helpers) ---
    /**
     * 判断一个文件是否是当天的日记。
     * @param file TAbstractFile (可能是文件或文件夹)
     * @returns boolean
     */
    isDailyNote(file) {
        // 基础过滤
        if (!(file instanceof obsidian_1.TFile) || file.extension !== 'md') {
            return false;
        }
        const dailyNoteSettings = this.getDailyNoteSettings();
        const expectedFilename = window.moment().format(dailyNoteSettings.format);
        const expectedFolderPath = (0, obsidian_1.normalizePath)(dailyNoteSettings.folder);
        const fileFolderPath = file.parent ? (0, obsidian_1.normalizePath)(file.parent.path) : '';
        return file.basename === expectedFilename && fileFolderPath === expectedFolderPath;
    }
    /**
     * 计算字符串中已完成的勾选框数量。
     * 使用正则表达式匹配 `- [x]` 或 `- [X]` 格式。
     */
    countCheckedCheckboxes(content) {
        const checkedRegex = /-\s\[[xX]\]/g;
        return (content.match(checkedRegex) || []).length;
    }
    /**
     * 获取用户的日记配置。
     */
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
        console.log("❌ XP 插件 [测试模式] 已卸载");
    }
}
exports.default = XpPlugin;
//# sourceMappingURL=main.js.map