import { Plugin, Notice } from "obsidian";
export default class XpPlugin extends Plugin {
    async onload() {
        console.log("XP Progress Bar 插件已加载 ✅");
        this.addRibbonIcon("dice", "XP 插件", () => {
            new Notice("Hello from XP Progress Bar!");
        });
    }
    onunload() {
        console.log("XP Progress Bar 插件已卸载 ❌");
    }
}
//# sourceMappingURL=main.js.map