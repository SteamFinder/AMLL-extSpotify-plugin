import { useEffect, useState, type FC } from "react";
import {
    consoleLog,
    extSpotifySwitchAtom,
    extSpotifyIntervalAtom,
    extSpotifyAccessTokenAtom,
    extSpotifyClientIDAtom,
    extSpotifyDelayAtom,
    extSpotifyRedirectUrlAtom,
    extSpotifyDelaySwitchAtom
} from "./settings"
import { atomWithStorage } from "jotai/utils";
import { type WritableAtom, atom, useAtom, useAtomValue } from "jotai";
import { type TTMLDBLyricEntry } from "./dexie";
import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";

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

    // 从TTML DB读取歌词信息
    async function readTTMLDB(id: string, name: string, artist: string) {
        const word = name.trim();
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
                consoleLog("INFO", "context", "成功在TTML DB寻找到歌词");
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

    async function getCurrentPlayingTrack(accessToken: string) {

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
            if(extSpotifyDelaySwitch){
                setExtSpotifyDelay(latency);
            }

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

                const parsedResult = readTTMLDB(jsonData.item.id, jsonData.item.name, jsonData.item.artists[0].name)
                if ((await parsedResult).length === 0) {
                    setHideLyricView(true);
                    setMusicLyricLines(parsedResult);
                } else {
                    setHideLyricView(false);
                    setMusicLyricLines(parsedResult);
                }
            }

            // 刷新进度条 由于延迟 进行补偿
            setMusicPlayingPosition(jsonData.progress_ms + extSpotifyDelay);

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
            consoleLog("WARN", "context", "无法从SpotifyAPI读取数据");
            setMusicPlaying(false);
            console.error(response.status);
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
            }, extSpotifyInterval);

            return () => clearInterval(intervalId); // 清除定时器
        }
    }, [extSpotifySwitch, accessToken]);

    useEffect(() => {
        consoleLog("INFO", "context", "挂载成功");
    }, []);
    return null;
}