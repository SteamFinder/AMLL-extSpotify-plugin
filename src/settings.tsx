/**
 * @fileoverview
 * 所有有关 extSpotify 组件中用户可配置的状态都在这里
 * 如无特殊注明，此处所有配置均会被存储在 localStorage 中
 */

import { atomWithStorage } from "jotai/utils";
import { type WritableAtom, atom, useAtom, useAtomValue } from "jotai";
import {
	type ComponentProps,
	type FC,
	type PropsWithChildren,
	type ReactNode,
	Suspense, useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import {
	Box,
	Button,
	Card,
	Container,
	Flex,
	Select,
	Separator,
	Slider,
	type SliderProps,
	Switch,
	type SwitchProps,
	Text,
	TextField,
	type TextProps,
} from "@radix-ui/themes";
import { parseTTML } from "./amll-core-src/lyric/ttml";

// ======================== extSpotify ========================

export const SettingPage = () => {

// ======================== extSpotify 挂载 ========================

	// load
	useEffect(() => {
		console.log("SettingPage Loaded");
	}, []);

// ======================== extSpotify 前置组件 ========================

	// settings components
	const SettingEntry: FC<
		PropsWithChildren<{
			label: string;
			description?: string;
		}>
	> = ({ label, description, children }) => {
		return (
			<Card mt="2">
				<Flex direction="row" align="center" gap="4">
					<Flex direction="column" flexGrow="1">
						<Text as="div">{label}</Text>
						<Text as="div" color="gray" size="2">
							{description}
						</Text>
					</Flex>
					{children}
				</Flex>
			</Card>
		);
	};

	const SubTitle: FC<PropsWithChildren<TextProps>> = ({ children, ...props }) => {
		return (
			<Text weight="bold" size="4" my="4" as="div" {...props}>
				{children}
			</Text>
		);
	};

	const SwitchSettings: FC<
		{
			configAtom: WritableAtom<boolean, [boolean], void>;
		} & ComponentProps<typeof SettingEntry> &
		Omit<SwitchProps, "value" | "onChange">
	> = ({ label, description, configAtom }) => {
		const [value, setValue] = useAtom(configAtom);

		return (
			<SettingEntry label={label} description={description}>
				<Switch checked={value} onCheckedChange={setValue} />
			</SettingEntry>
		);
	};

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
    const [musicCover, setMusicCover] = useAtom(pluginContext.amllStates.musicCoverAtom);
    const [musicDuration, setMusicDuration] = useAtom(pluginContext.amllStates.musicDurationAtom);
    const [musicName, setMusicName] = useAtom(pluginContext.amllStates.musicNameAtom);
    const [musicPlayingPosition, setMusicPlayingPosition] = useAtom(
        pluginContext.amllStates.musicPlayingPositionAtom,
    );
    const [musicPlaying, setMusicPlaying] = useAtom(pluginContext.amllStates.musicPlayingAtom);
    const [musicAlbumName, setMusicAlbumName] = useAtom(pluginContext.amllStates.musicAlbumNameAtom);
    const [musicArtists, setMusicArtists] = useAtom(pluginContext.amllStates.musicArtistsAtom);
    const [musicLyricLines, setMusicLyricLines] = useAtom(pluginContext.amllStates.musicLyricLinesAtom);
    const [hideLyricView, setHideLyricView] = useAtom(pluginContext.amllStates.hideLyricViewAtom);
	const [musicContextMode, setMusicContextMode] = useAtom(pluginContext.playerStates.musicContextModeAtom);
    const [fetching, setFetching] = useState(false);
    // hideLyricViewAtom,
    // isLyricPageOpenedAtom,

    const accessToken = extSpotifyAccessToken;

    // 通过 OAuth2.0 获取 Access Token
    function getAuth() {
        var client_id = extSpotifyClientID;
        var redirect_uri = extSpotifyRedirectUrl;

        var scope = "user-read-currently-playing";

        var url = "https://accounts.spotify.com/authorize";
        url += "?response_type=token";
        url += "&client_id=" + encodeURIComponent(client_id);
        url += "&scope=" + encodeURIComponent(scope);
        url += "&redirect_uri=" + encodeURIComponent(redirect_uri);

        window.open(url);
    }

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
            console.log("extSpotify::从SpotifyAPI读取数据成功");

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
                        console.log("extSoptify::Github-未搜索到/Proxy-未尝试");
                    }
                } catch (error) {
                    // 未获取到歌词时设置为空
                    console.log("extSpotify::Github-访问失败/Proxy-未尝试")
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
							// const parsedResult = parseTTML(lyricsData).lines;
                            setHideLyricView(false);
                            setMusicLyricLines(parsedProxyResult);
                        } else {
                            setHideLyricView(true);
                            setMusicLyricLines([]);
                            console.log("extSoptify::Github-访问失败/Proxy-未搜索到");
                        }
                    } catch (error) {
                        setHideLyricView(true);
                        setMusicLyricLines([]);
                        console.log("extSpotify::Github-访问失败/Proxy-访问失败")
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
            console.log("extSpotify::当前未播放歌曲");
            setMusicPlaying(false);
            return null;
        } else {
            console.error("extSpotify::无法从SpotifyAPI读取数据", response.status);
            return null;
        }
    }

    // 修复轮询在 Android 设备上的问题
    useEffect(() => {
        console.log("extSpotifySwitch::检测到功能开关变化");
        console.log(extSpotifySwitch);
		
        if (extSpotifySwitch) {

			// 接管Player
			console.log("extSpotifySwitch::接管Player");
			setMusicContextMode("extSpotify");

            const intervalId = setInterval(() => {
                getCurrentPlayingTrack(accessToken);
            }, extSpotifyInterval); // 每0.5秒调用一次

            return () => clearInterval(intervalId); // 清除定时器
        }
    }, [extSpotifySwitch]);

// ======================== extSpotify界面 ========================
	return (
		<>
            {/* 扩展 Spotify BEGIN */}

            <SubTitle>extSpotify 设置</SubTitle>

            <SwitchSettings
                label={"启用Spotify Player API"}
                description={"开启后可以同步Spotify播放的歌曲, 请先开启再同步状态"}
                configAtom={extSpotifySwitchAtom}
            />

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">Client ID</Text>
                        <Text as="div" color="gray" size="2" >
                            从开发者平台申请的 Client ID
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyClientID}
                        onChange={(e) => setExtSpotifyClientID(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">Redirect Url</Text>
                        <Text as="div" color="gray" size="2" >
                            从开发者平台设置的 Redirect Url
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyRedirectUrl}
                        onChange={(e) => setExtSpotifyRedirectUrl(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">Access Token</Text>
                        <Text as="div" color="gray" size="2" >
                            从Redirect Url中获取的Access Token (需手动复制)
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyAccessToken}
                        onChange={(e) => setExtSpotifyAccessToken(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">轮询间隔</Text>
                        <Text as="div" color="gray" size="2" >
                            设置从Spotify服务器获取信息的间隔
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyInterval}
                        onChange={(e) => setExtSpotifyInterval(Number(e.currentTarget.value))}
                    />
                    ms
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">Spotify时间轴修正</Text>
                        <Text as="div" color="gray" size="2" >
                            由于从API获取信息存在延迟, 需要进行修正
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyDelay}
                        onChange={(e) => setExtSpotifyDelay(Number(e.currentTarget.value))}
                    />
                    ms
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">歌曲封面设置</Text>
                        <Text as="div" color="gray" size="2" >
                            在此测试设置封面图
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={musicCover}
                        onChange={(e) => setMusicCover(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

            <Button my="2" onClick={() => getCurrentPlayingTrack(accessToken)}>
                同步播放状态
            </Button>

            <Button m="2" onClick={() => getAuth()}>
                登录Spotify
            </Button>

			<Text as="div">extSpotify测试版, 可能存在诸多Bug, 欢迎反馈</Text>
			<Text as="div">Powered by AMLL Player Extension Platform</Text>

            {/* Spotify END */}
		</>
	)
}

// ======================== extSpotify配置 Atom ========================

/**
 * 是否启用Spotify功能 默认关闭
 */
export const extSpotifySwitchAtom = atomWithStorage(
	"extSpotifyswitchAtom",
	false,
);

/**
 * Spotify开发者平台上设置的Client ID
 */
export const extSpotifyClientIDAtom = atomWithStorage(
	"extSpotifyClientIDAtom",
	"ClientID",
);

/**
 * Spotify开发者平台上设置的Callback Url
 */
export const extSpotifyRedirectUrlAtom = atomWithStorage(
	"extSpotifyRedirectUrlAtom",
	"http://localhost:8888/callback",
);

/**
 * Spotify API所需的Access Token
 */
export const extSpotifyAccessTokenAtom = atomWithStorage(
	"extSpotifyAccessTokenAtom",
	"AccessToken",
);

/**
 * Spotify API轮询间隔 默认500(ms)
 */
export const extSpotifyIntervalAtom = atomWithStorage(
	"extSpotifyIntervalAtom",
	800,
);
/**
 * Spotify API时间轴修正 默认100(ms)
 */
export const extSpotifyDelayAtom = atomWithStorage(
	"extSpotifyDelayAtom",
	100,
);

// ======================== extSpotify 使用的Player Atom ========================

/*
	fftDataAtom,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	lowFreqVolumeAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicCoverIsVideoAtom,
	musicDurationAtom,
	musicLyricLinesAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	musicQualityTagAtom,
	musicVolumeAtom,
*/