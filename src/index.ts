import { ExtensionContext } from "./context";
import { SettingPage, consoleLog } from "./settings";

extensionContext.registerComponent("settings", SettingPage);
extensionContext.registerComponent("context", ExtensionContext);

extensionContext.addEventListener("extension-load", () => {
    consoleLog("INFO","index","加载成功");
    console.log(extensionContext.playerStates);
    console.log(extensionContext.amllStates);
});

extensionContext.addEventListener("extension-unload", () => {
    consoleLog("INFO","index","卸载成功");
});
