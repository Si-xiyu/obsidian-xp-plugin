// src/main.ts

import { Notice, Plugin, TFile, normalizePath } from 'obsidian';

// 为 getDailyNoteSettings 的返回值定义一个清晰的接口
interface DailyNoteSettings {
    format: string;
    folder: string;
}

export default class XpPlugin extends Plugin {

    /**
     * 插件加载时运行的主函数
     */
    async onload() {
        console.log("✅ XP 插件 [测试模式] 已加载");

        // 功能1：添加左侧 Ribbon 图标，点击后增加经验
        this.addRibbonIcon("dice", "测试：手动增加 10 点经验", () => {
            this.addExperience(10);
        });

        // 功能2：监听文件创建事件
        this.registerEvent(
            this.app.vault.on('create', (file) => {
                // 过滤掉非 Markdown 文件
                if (!(file instanceof TFile) || file.extension !== 'md') {
                    return;
                }

                // 获取用户当前的日记设置
                const dailyNoteSettings = this.getDailyNoteSettings();

                // 根据设置，生成今天日记应有的文件名（不含后缀）
                const expectedFilename = window.moment().format(dailyNoteSettings.format);
                
                // 获取期望的文件夹路径，并规范化
                const expectedFolderPath = normalizePath(dailyNoteSettings.folder);
                
                // 获取当前创建文件的实际文件夹路径，并规范化
                const fileFolderPath = file.parent ? normalizePath(file.parent.path) : '';

                // 核心判断：文件名和文件夹路径是否都与日记配置完全匹配？
                if (file.basename === expectedFilename && fileFolderPath === expectedFolderPath) {
                    console.log(`检测到日记创建: ${file.path}`);
                    this.addExperience(50); // 为创建日记增加 50 经验
                }
            })
        );
    }

    /**
     * 极简的增加经验函数，只负责弹出提示。
     * @param amount 经验值数量
     */
    addExperience(amount: number): void {
        new Notice(`🎉 你获得了 ${amount} 点经验！`);
    }

    /**
     * 辅助函数：获取用户的日记配置（文件夹和日期格式）
     * 这段逻辑与 Calendar 插件保持一致，以确保判断的准确性。
     */
    getDailyNoteSettings(): DailyNoteSettings {
        try {
            // 优先检查 Periodic Notes 插件
            // @ts-ignore
            const periodicNotes = this.app.plugins.getPlugin("periodic-notes");
            if (periodicNotes && periodicNotes.settings?.daily?.enabled) {
                const settings = periodicNotes.settings.daily;
                return {
                    format: settings.format || 'YYYY-MM-DD',
                    folder: settings.folder?.trim() || ''
                };
            }

            // 如果没有，则检查核心的 Daily Notes 插件
            // @ts-ignore
            const dailyNotesSettings = this.app.internalPlugins.getPluginById('daily-notes')?.instance?.options;
            if (dailyNotesSettings) {
                return {
                    format: dailyNotesSettings.format || 'YYYY-MM-DD',
                    folder: dailyNotesSettings.folder?.trim() || ''
                };
            }
        } catch (e) {
            console.error("获取日记配置失败", e);
        }

        // 如果都找不到，返回一个通用的默认值
        return {
            format: 'YYYY-MM-DD',
            folder: ''
        };
    }

    /**
     * 插件卸载时运行的函数（可选，可以保留用于调试）
     */
    onunload() {
        console.log("❌ XP 插件 [测试模式] 已卸载");
    }
}