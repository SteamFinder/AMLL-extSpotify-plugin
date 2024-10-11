import { SettingPage } from "./settings";

pluginContext.registerSettingPage(SettingPage);

pluginContext.addEventListener("plugin-load", () => {
    console.log("plugin loaded");
});

pluginContext.addEventListener("plugin-unload", () => {
    console.log("plugin loaded");
});
