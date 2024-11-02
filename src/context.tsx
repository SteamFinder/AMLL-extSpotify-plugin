import { useEffect, useState, type FC } from "react";
import {
    consoleLog,
    extSpotifySwitchAtom,
    extSpotifyIntervalAtom,
    extSpotifyAccessTokenAtom,
    extSpotifyClientIDAtom,
    extSpotifyDelayAtom,
    extSpotifyRedirectUrlAtom,
    extSpotifyDelaySwitchAtom,
    extSpotifyInterpolationMaxAtom,
    extSpotifyInterpolationCalcAtom,
    extSpotifyInterpolationSwitchAtom,
    extSpotifyDebugSwitchAtom,
    tokenExpireAtom,
    amllFontSizeAtom,
    amllLightModeAtom,
} from "./settings"
import { atomWithStorage } from "jotai/utils";
import { type WritableAtom, atom, useAtom, useAtomValue, useStore } from "jotai";
import { type TTMLDBLyricEntry } from "./dexie";
import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";
import { Converter } from 'opencc-js';

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
    const [extSpotifyDelaySwitch, setExtSpotifyDelaySwitch] = useAtom(extSpotifyDelaySwitchAtom);
    const [extSpotifyInterpolationMax, setExtSpotifyInterpolationMax] = useAtom(extSpotifyInterpolationMaxAtom);
    const [extSpotifyInterpolationCalc, setExtSpotifyInterpolationCalc] = useAtom(extSpotifyInterpolationCalcAtom);
    const [extSpotifyInterpolationSwitch, setExtSpotifyInterpolationSwitch] = useAtom(extSpotifyInterpolationSwitchAtom);
    const [extSpotifyDebugSwitch, setExtSpotifyDebugSwitch] = useAtom(extSpotifyDebugSwitchAtom);
    const [tokenExpire, setTokenExpire] = useAtom(tokenExpireAtom);
    const [amllFontSize, setAmllFontSize] = useAtom(amllFontSizeAtom);
    const [amllLightMode, setAmllLightMode] = useAtom(amllLightModeAtom);

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
    const [currentPlaylist, setCurrentPlaylist] = useAtom<any>(extensionContext.playerStates.currentPlaylistAtom);

    const store = useStore();

    const accessToken = extSpotifyAccessToken;
    var token: string;

    const toEmitThread = (type: string, data: number) => ({
        onEmit() {
            if (type === "nextSong") {
                try {
                    fetch(
                        "https://api.spotify.com/v1/me/player/next",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                } catch (error) {
                    consoleLog("WARN", "context", "向Spotify API 请求下一首失败");
                    console.log(error);
                }
            } else if (type === "prevSong") {
                try {
                    fetch(
                        "https://api.spotify.com/v1/me/player/previous",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                } catch (error) {
                    consoleLog("WARN", "context", "向Spotify API 请求上一首失败");
                    console.log(error);
                }
            } else if (type === "changePlay") {
                if (musicPlaying) {
                    try {
                        fetch(
                            "https://api.spotify.com/v1/me/player/pause",
                            {
                                method: "PUT",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            },
                        );
                    } catch (error) {
                        consoleLog("WARN", "context", "向Spotify API 请求暂停失败");
                        console.log(error);
                    }
                } else {
                    try {
                        fetch(
                            "https://api.spotify.com/v1/me/player/play",
                            {
                                method: "PUT",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            },
                        );
                    } catch (error) {
                        consoleLog("WARN", "context", "向Spotify API 请求继续播放失败");
                        console.log(error);
                    }
                }
            }
        },
    });

    const toEmit = <T,>(onEmit: T) => ({
        onEmit,
    });

    function overridePlayControl() {
        store.set(extensionContext.amllStates.onRequestNextSongAtom, toEmitThread("nextSong", -1));
        store.set(extensionContext.amllStates.onRequestPrevSongAtom, toEmitThread("prevSong", -1));
        store.set(extensionContext.amllStates.onPlayOrResumeAtom, toEmitThread("changePlay", -1));
        store.set(
            extensionContext.amllStates.onLyricLineClickAtom,
            toEmit((evt) => {
                try {
                    fetch(
                        "https://api.spotify.com/v1/me/player/seek?position_ms=" + evt.line.getLine().startTime,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                } catch (error) {
                    consoleLog("WARN", "context", "向Spotify API 请求跳转到时间轴" + evt.line.getLine().startTime + "ms失败");
                    console.log(error);
                }
            }),
        );
    }

    // 接管播放控制
    useEffect(() => {
        token = extSpotifyAccessToken;
        if (extSpotifySwitch) {
            overridePlayControl();
        }
    }, [extSpotifyAccessToken, musicPlaying, extSpotifySwitch])

    // 从TTML DB读取歌词信息
    async function readTTMLDB(id: string, name: string, artist: string) {
        const converter = Converter({ from: 'tw', to: 'cn' });
        const word = converter(name.trim());
        consoleLog("INFO", "context", "搜索歌词 convertedName:" + word)
        if (word.length > 0) {
            let pattern: string | RegExp = word.toLowerCase();
            let musicID: string = id;
            let musicName: string = name;
            let musicArtist: string = artist;
            try {
                pattern = new RegExp(word, "i");
            } catch { }
            const matchResult = await extensionContext.playerDB.ttmlDB
                .toCollection()
                .reverse()
                .filter((x) => !!isTTMLEntryMatch(x, pattern, musicID, musicName, musicArtist))
                .limit(10)
                .sortBy("name")
                .then((x) =>
                    x.map((x) => isTTMLEntryMatch(x, pattern, musicID, musicName, musicArtist)).filter((v) => !!v),
                );
            console.log(matchResult);
            if (matchResult.length === 0) {
                consoleLog("WARN", "context", "未在TTML DB找到该歌词");
                return [];
            } else {
                for (let i = 0; i < matchResult.length; i++) {
                    if (matchResult[i].songID.match(id)) {
                        consoleLog("INFO", "context", "成功在TTML DB寻找到歌词, method:byId");
                        return extensionContext.lyric.parseTTML(matchResult[i].raw).lines;
                    } else if (matchResult[i].songArtists.match(artist)) {
                        consoleLog("INFO", "context", "成功在TTML DB寻找到歌词, method:byArtist");
                        return extensionContext.lyric.parseTTML(matchResult[i].raw).lines;
                    } else if (i === matchResult.length - 1) {
                        consoleLog("INFO", "context", "成功在TTML DB寻找到歌词, method:byFuzzySearch");
                        return extensionContext.lyric.parseTTML(matchResult[0].raw).lines;
                    }
                }
            }
        }
        consoleLog("WARN", "context", "通过Dexie查询TTML DB失败");
        return [];
    }

    function getMetadataValue(ttml: TTMLLyric, key: string) {
        let result = "";
        for (const [k, v] of ttml.metadata) {
            if (k === key) {
                result += v.join(", ");
            }
        }
        return result;
    }

    function isTTMLEntryMatch(entry: TTMLDBLyricEntry, pattern: string | RegExp, id: string, name: string, artist: string) {
        const result = {
            name: entry.name,
            raw: entry.raw,
            songID: getMetadataValue(entry.content, "spotifyId"),
            songName: getMetadataValue(entry.content, "musicName"),
            songArtists: getMetadataValue(entry.content, "artists"),
        };

        if (result.songID.match(id)) {
            return result;
        } else if (result.songName.includes(name) || name.includes(result.songName)) {
            if (!result.songArtists || !result.songName) {
                return undefined;
            } else {
                return result;
            }
        }

        return undefined;
    }

    // 轮询 SpotifyAPI
    // 防止重复使用钩子
    var oldMusicID = "";
    var oldIsPlaying = false;
    var oldPlayTime = 0;
    var interpolationData = [];
    var offset = 0;
    var delay = 0;
    var isShowUpd = false;

    async function getCurrentPlayingTrack(accessToken: string) {

        // 验证Access Token是否失效
        const timestamp = new Date().getTime();
        const timeDistance = timestamp - tokenExpire;
        if (timeDistance > 3500000) {
            function getAuth() {
                alert("Access Token已失效, 请重新设置");
                var client_id = extSpotifyClientID;
                var redirect_uri = extSpotifyRedirectUrl;

                var scope = "user-read-currently-playing user-modify-playback-state";

                var url = "https://accounts.spotify.com/authorize";
                url += "?response_type=token";
                url += "&client_id=" + encodeURIComponent(client_id);
                url += "&scope=" + encodeURIComponent(scope);
                url += "&redirect_uri=" + encodeURIComponent(redirect_uri);

                window.open(url);

                const timestampNew = new Date().getTime();
                setTokenExpire(timestampNew);
                isShowUpd = true;
            }

            // 防止重复弹出
            if (!isShowUpd) {
                getAuth();
            }
        }

        // 自动修正时间点 起点
        const startTime = Date.now();

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

            // 自动修正时间点 终点
            const endTime = Date.now();
            // Http Fetch Delay
            const latency = endTime - startTime;
            if (extSpotifyDelaySwitch) {
                delay = latency;
            }

            const jsonData = await response.json();

            if (extSpotifyDebugSwitch) {
                consoleLog("INFO", "context", "从SpotifyAPI读取数据成功");
            }

            // 切歌 获取歌词
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
                setMusicPlayingPosition(jsonData.progress_ms + extSpotifyDelay + delay);
                interpolationData.splice(0, interpolationData.length);

                const parsedResult = readTTMLDB(jsonData.item.id, jsonData.item.name, jsonData.item.artists[0].name)
                if ((await parsedResult).length === 0) {
                    setHideLyricView(true);
                    setMusicLyricLines(parsedResult);
                } else {
                    setHideLyricView(false);
                    setMusicLyricLines(parsedResult);
                }

            } else {

                // 开启自动插值
                if (extSpotifyInterpolationSwitch) {
                    // 未切歌, 进行插值
                    const oldPlayTimeAbs = Math.abs(oldPlayTime);
                    const nowPlayTimeAbs = Math.abs(jsonData.progress_ms + extSpotifyDelay + delay);
                    const playDistanceAbs = Math.abs(oldPlayTimeAbs - nowPlayTimeAbs);
                    const playInterpolation = Math.abs(playDistanceAbs - extSpotifyInterval)

                    if (interpolationData.length <= extSpotifyInterpolationCalc) {
                        interpolationData.push(playInterpolation);
                    } else {

                        function calculateAverageExcludingExtremes(data: number[]): number {
                            // 排序数组
                            const sortedData = [...data].sort((a, b) => a - b);
                            // 去掉一个最大值和一个最小值
                            const trimmedData = sortedData.slice(1, -1);
                            // 计算平均值
                            const sum = trimmedData.reduce((acc, val) => acc + val, 0);
                            const average = Math.round(sum / trimmedData.length);
                            return average;
                        }

                        const averageInterpolationData = calculateAverageExcludingExtremes(interpolationData);
                        if (extSpotifyDebugSwitch) {
                            console.log("计算自动插值测量点成功", averageInterpolationData);
                        }
                        offset = averageInterpolationData;
                        interpolationData.splice(0, interpolationData.length);
                        interpolationData.push(playInterpolation);
                    }

                    if (0 <= playInterpolation && playInterpolation < extSpotifyInterpolationMax) {
                        if (extSpotifyDebugSwitch) {
                            console.log("自动插值",
                                "oldPlayTimeAbs", oldPlayTimeAbs,
                                "nowPlayTimeAbs", nowPlayTimeAbs,
                                "playInterpolation", playInterpolation,
                                "extSpotifyInterval", extSpotifyInterval,
                                "offset", offset,
                                "extSpotifyDelay", extSpotifyDelay,
                                "delay", delay
                            );
                        }
                        setMusicPlayingPosition(oldPlayTime + extSpotifyInterval + extSpotifyDelay + offset);
                        oldPlayTime = oldPlayTime + extSpotifyInterval;
                    } else {
                        if (extSpotifyDebugSwitch) {
                            console.log("超出自动插值范围, 正在校准",
                                "oldPlayTimeAbs", oldPlayTimeAbs,
                                "nowPlayTimeAbs", nowPlayTimeAbs,
                                "playInterpolation", playInterpolation,
                                "extSpotifyInterval", extSpotifyInterval,
                                "offset", offset,
                                "extSpotifyDelay", extSpotifyDelay,
                                "delay", delay
                            );
                        }
                        setMusicPlayingPosition(jsonData.progress_ms + extSpotifyDelay + delay);
                        oldPlayTime = jsonData.progress_ms + extSpotifyDelay + delay;
                    }
                } else {
                    // 关闭自动插值
                    setMusicPlayingPosition(jsonData.progress_ms + extSpotifyDelay + delay);
                }

            }

            // 判断是否在播放 同时注意不要循环调用钩子

            if (jsonData.is_playing && !oldIsPlaying) {
                setMusicPlaying(true);
                oldIsPlaying = true;
            } else if (!jsonData.is_playing && oldIsPlaying) {
                setMusicPlaying(false);
                oldIsPlaying = false;
            }

        } else if (response.status === 204) {
            if (extSpotifyDebugSwitch) {
                consoleLog("INFO", "context", "当前未播放歌曲");
            }
            setMusicPlaying(false);
            return null;
        } else {
            if (extSpotifyDebugSwitch) {
                consoleLog("WARN", "context", "无法从SpotifyAPI读取数据");
            }
            setMusicPlaying(false);
            console.error(response.status);
            return null;
        }
    }

    // 挂载时设置css属性
    useEffect(() => {
        // AMLL Font Size
        const storedFontSizeAtom = localStorage.getItem('amllFontSizeAtom');
        if (storedFontSizeAtom) {
            const storedFontSize = storedFontSizeAtom.replace(/"/g, '');
            if (storedFontSize === "default") {
                consoleLog("INFO", "context", "(挂载时)未设置amllFontSize " + storedFontSize);
            } else {
                consoleLog("INFO", "context", "(挂载时)已设置amllFontSize " + storedFontSize);
                const lyricPlayerElement = document.querySelector(".amll-lyric-player") as HTMLElement;
                lyricPlayerElement.style.setProperty('--amll-lp-font-size', storedFontSize);
            }
        } else {
            consoleLog("INFO", "context", "(挂载时)未设置amllFontSize NULL");
        }

        // AMLL Light Mode
        /*
        const storedLightModeAtom = localStorage.getItem('amllLightModeAtom');
        if (storedLightModeAtom === "true") {
            // 开启light mode
            const modeElement = document.querySelector(".radix-themes");
            const classList = modeElement.classList;
            if (classList.contains("light")) {
                consoleLog("INFO", "settings", "已为Light Mode, 不再覆盖设置");
            } else {
                consoleLog("INFO", "settings", "已设置Light Mode");
                if (classList.contains("dark")) {
                    // 去除dark
                    classList.remove("dark");
                }
                classList.add("light");
            }
        } else {
            // 关闭light mode
            const modeElement = document.querySelector(".radix-themes");
            const classList = modeElement.classList;
            if (classList.contains("dark")) {
                consoleLog("INFO", "settings", "已为Dark Mode, 不再覆盖设置");
            } else {
                consoleLog("INFO", "settings", "已设置Dark Mode");
                if (classList.contains("light")) {
                    // 去除light
                    classList.remove("light");
                }
                classList.add("dark");
            }
        }
        */
    }, [])

    // 修复轮询在 Android 设备上的问题
    useEffect(() => {
        consoleLog("INFO", "context", "检测到功能开关变化 extSpotifySwitch:" + extSpotifySwitch);

        if (extSpotifySwitch) {

            // 接管Player
            consoleLog("INFO", "context", "接管Player");
            setMusicContextMode("extSpotify");

            const intervalId = setInterval(() => {
                getCurrentPlayingTrack(accessToken);
            }, extSpotifyInterval);

            return () => clearInterval(intervalId); // 清除定时器
        }
    }, [amllLightMode, amllFontSize, extSpotifySwitch, extSpotifyDebugSwitch, extSpotifyInterpolationSwitch, extSpotifyDelaySwitch, extSpotifyInterval, extSpotifyDelay, extSpotifyInterpolationMax, extSpotifyInterpolationCalc, accessToken]);

    useEffect(() => {
        consoleLog("INFO", "context", "挂载成功");
    }, []);
    return null;
}