import { useEffect, useState, type FC } from "react";
import {
    consoleLog,
    extSpotifySwitchAtom,
    extSpotifyIntervalAtom,
    extSpotifyAccessTokenAtom,
    extSpotifyClientIDAtom,
    extSpotifyDelayAtom,
    extSpotifyRedirectUrlAtom
} from "./settings"
import { atomWithStorage } from "jotai/utils";
import { type WritableAtom, atom, useAtom, useAtomValue } from "jotai";
import { parseTTML } from "./amll-core-src/lyric/ttml";

export const ExtensionContext: FC = () => {

    // ======================== extSpotify ========================

    // Reg
    const [extSpotifySwitch, setExtSpotifySwitch] = useAtom(extSpotifySwitchAtom);
    const [extSpotifyInterval, setExtSpotifyInterval] = useAtom(extSpotifyIntervalAtom);
    const [extSpotifyClientID, setExtSpotifyClientID] = useAtom(
        extSpotifyClientIDAtom,
    );
    const [extSpotifyRedirectUrl, setExtSpotifyRedirectUrl] = useAtom(
        extSpotifyRedirectUrlAtom,
    );
    const [extSpotifyAccessToken, setExtSpotifyAccessToken] = useAtom(
        extSpotifyAccessTokenAtom,
    );
    const [extSpotifyDelay, setExtSpotifyDelay] = useAtom(extSpotifyDelayAtom);

    // Playing
    const [musicCover, setMusicCover] = useAtom<string>(extensionContext.amllStates.musicCoverAtom);
    const [musicDuration, setMusicDuration] = useAtom<number>(extensionContext.amllStates.musicDurationAtom);
    const [musicName, setMusicName] = useAtom<string>(extensionContext.amllStates.musicNameAtom);
    const [musicPlayingPosition, setMusicPlayingPosition] = useAtom<number>(
        extensionContext.amllStates.musicPlayingPositionAtom,
    );
    const [musicPlaying, setMusicPlaying] = useAtom<boolean>(extensionContext.amllStates.musicPlayingAtom);
    const [musicAlbumName, setMusicAlbumName] = useAtom<string>(extensionContext.amllStates.musicAlbumNameAtom);
    const [musicArtists, setMusicArtists] = useAtom(extensionContext.amllStates.musicArtistsAtom);
    const [musicLyricLines, setMusicLyricLines] = useAtom(extensionContext.amllStates.musicLyricLinesAtom);
    const [hideLyricView, setHideLyricView] = useAtom<boolean>(extensionContext.amllStates.hideLyricViewAtom);
    const [musicContextMode, setMusicContextMode] = useAtom(extensionContext.playerStates.musicContextModeAtom);
    const [fetching, setFetching] = useState(false);

    const accessToken = extSpotifyAccessToken;

    // 轮询 SpotifyAPI

    // 防止重复使用钩子
    var oldMusicID = "";
    var oldIsPlaying = false;

    async function getCurrentPlayingTrack(accessToken: string) {
        const response = await fetch(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        if (response.status === 200) {
            const jsonData = await response.json();
            consoleLog("INFO", "context", "从SpotifyAPI读取数据成功");

            // 获取歌词
            if (oldMusicID != jsonData.item.id) {
                oldMusicID = jsonData.item.id;

                setMusicCover(jsonData.item.album.images[0].url);
                setMusicDuration(jsonData.item.duration_ms);
                setMusicName(jsonData.item.name);
                setMusicAlbumName(jsonData.item.album.name);
                const MusicArtistsInfo = {
                    name: jsonData.item.artists[0].name,
                    id: jsonData.item.artists[0].id,
                };
                setMusicArtists([MusicArtistsInfo]);

                try {
                    const lyricsResponse = await fetch(
                        "https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/refs/heads/main/spotify-lyrics/" +
                        jsonData.item.id +
                        ".ttml",
                        {
                            method: "GET",
                        },
                    );
                    if (lyricsResponse.status === 200) {
                        // 获取到歌词后进行转换
                        const lyricsData = await lyricsResponse.text();
                        const parsedResult = parseTTML(lyricsData);
                        // const parsedResult = parseTTML(lyricsData).lines;
                        setHideLyricView(false);
                        setMusicLyricLines(parsedResult);
                    } else {
                        setHideLyricView(true);
                        setMusicLyricLines([]);
                        consoleLog("INFO", "context", "Github-未搜索到/Proxy-未尝试");
                    }
                } catch (error) {
                    // 未获取到歌词时设置为空
                    consoleLog("INFO", "context", "Github-访问失败/Proxy-未尝试");
                    try {
                        const lyricsProxyResponse = await fetch(
                            "https://cf.ghproxy.cc/" +
                            "https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/refs/heads/main/spotify-lyrics/" +
                            jsonData.item.id +
                            ".ttml",
                            {
                                method: "GET",
                            },
                        );
                        if (lyricsProxyResponse.status === 200) {
                            const lyricsProxyData = await lyricsProxyResponse.text();
                            const parsedProxyResult = parseTTML(lyricsProxyData);
                            // const parsedProxyResult = parseTTML(lyricsProxyData).lines;
                            setHideLyricView(false);
                            setMusicLyricLines(parsedProxyResult);
                        } else {
                            setHideLyricView(true);
                            setMusicLyricLines([]);
                            consoleLog("INFO", "context", "Github-访问失败/Proxy-未搜索到");
                        }
                    } catch (error) {
                        setHideLyricView(true);
                        setMusicLyricLines([]);
                        consoleLog("INFO", "context", "Github-访问失败/Proxy-访问失败");
                    }
                }
            }

            // 刷新进度条 由于延迟 进行 50ms 的补偿
            setMusicPlayingPosition(jsonData.progress_ms + 50);
            // 判断是否在播放 同时注意不要循环调用钩子

            if (jsonData.is_playing && !oldIsPlaying) {
                setMusicPlaying(true);
                oldIsPlaying = true;
            } else if (!jsonData.is_playing && oldIsPlaying) {
                setMusicPlaying(false);
                oldIsPlaying = false;
            }

        } else if (response.status === 204) {
            consoleLog("INFO", "context", "当前未播放歌曲");
            setMusicPlaying(false);
            return null;
        } else {
            console.error("extSpotify::无法从SpotifyAPI读取数据", response.status);
            return null;
        }
    }

    // 修复轮询在 Android 设备上的问题
    useEffect(() => {
        consoleLog("INFO", "context", "检测到功能开关变化");
        console.log(extSpotifySwitch);

        if (extSpotifySwitch) {

            // 接管Player
            consoleLog("INFO", "context", "接管Player");
            setMusicContextMode("extSpotify");

            const intervalId = setInterval(() => {
                getCurrentPlayingTrack(accessToken);
            }, extSpotifyInterval); // 每0.5秒调用一次

            return () => clearInterval(intervalId); // 清除定时器
        }
    }, [extSpotifySwitch, extSpotifyDelay, accessToken]);

    useEffect(() => {
        consoleLog("INFO", "context", "挂载成功");
    }, []);
    return null;
}