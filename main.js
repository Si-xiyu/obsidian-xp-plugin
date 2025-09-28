"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
class XpPlugin extends obsidian_1.Plugin {
    async onload() {
        console.log("✅ XP Progress Bar 插件已加载");
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText("Lv.1 | 0/100 XP");
        this.addRibbonIcon("dice", "显示 XP 提示", () => {
            new obsidian_1.Notice("你获得了 5 点经验！");
        });
    }
    onunload() {
        console.log("❌ XP Progress Bar 插件已卸载");
    }
}
exports.default = XpPlugin;
//# sourceMappingURL=main.js.map