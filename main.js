import { Plugin, Notice } from "obsidian";
export default class XpPlugin extends Plugin {
    async onload() {
        console.log("✅ XP Progress Bar 插件已加载");
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText("Lv.1 | 0/100 XP");
        this.addRibbonIcon("dice", "显示 XP 提示", () => {
            new Notice("你获得了 5 点经验！");
        });
    }
    onunload() {
        console.log("❌ XP Progress Bar 插件已卸载");
    }
}
//# sourceMappingURL=main.js.map