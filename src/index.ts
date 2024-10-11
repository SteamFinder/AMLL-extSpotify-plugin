import { SettingPage } from "./settings";

pluginContext.registerSettingPage(SettingPage);

pluginContext.addEventListener("plugin-load", () => {
    console.log("extSpotify plugin loaded");
    console.log(pluginContext.playerStates);
    console.log(pluginContext.amllStates);
    console.log(pluginContext.amllStates.musicNameAtom);

    // const [musicName, setMusicName] = useAtom(pluginContext.amllStates.musicNameAtom);
    // setMusicName("你好世界");

/*
    const [MusicContextMode, pluginContext.playerStates.MusicContextMode;
    const [hideLyricViewAtom, pluginContext.amllStates.
    const [musicAlbumNameAtom,
    const [musicArtistsAtom,
    const [musicCoverAtom,
    const [musicDurationAtom,
    const [musicLyricLinesAtom,
    const [musicNameAtom,
    const [musicPlayingAtom,
    const [musicPlayingPositionAtom,
    */

});

pluginContext.addEventListener("plugin-unload", () => {
    console.log("extSpotify plugin unloaded");
});
