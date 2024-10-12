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
    Badge,
    Button,
    Card,
    Container,
    Flex,
    DataList,
    Code,
    Switch,
    type SwitchProps,
    Text,
    TextField,
    type TextProps,
} from "@radix-ui/themes";
import chalk from "chalk";
import extVerInfos from "./static/version.json";

// ======================== extSpotify setLog ========================

const WARN_TAG = chalk.bgHex("#FFAA00").hex("#FFFFFF")(" WARN ");
const INFO_TAG = chalk.bgHex("#FF7700").hex("#FFFFFF")(" INFO ");
const NAME_TAG = chalk.bgHex("#1ed760").hex("#FFFFFF")(" extSpotify ");

export function consoleLog(type: string, func: string, info: string) {

    if (type === "INFO") {
        console.log(NAME_TAG + INFO_TAG, func + "::" + info)

    } else if (type === "WARN") {
        console.log(NAME_TAG + WARN_TAG, func + "::" + info)

    } else if (type === "LOG") {
        console.log(NAME_TAG + NAME_TAG, func + "::" + info)

    } else {
        console.log(NAME_TAG + WARN_TAG, func + "::" + info)
    }

}

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
    const [extSpotifyCallbackUrl, setExtSpotifyCallbackUrl] = useAtom(
        extSpotifyCallbackUrlAtom
    )
    const [extSpotifyDelay, setExtSpotifyDelay] = useAtom(extSpotifyDelayAtom);
    const [extSpotifyProxy, setExtSpotifyProxy] = useAtom(extSpotifyProxyAtom);
    const [extSpotifyVer, setExtsportifyVer] = useState("unknown extSpotifyVer");
    const [extSpotifyOnlineVer, setExtsportifyOnlineVer] = useState("unknown extSpotifyOnlineVer");
    const [extSpotifyChannel, setExtsportifyChannel] = useState("unknown extSpotifyChannel");
    const [extSpotifyMinApi, setExtsportifyMinApi] = useState("unknown extSpotifyMinApi");
    const [extSpotifyUpdTime, setExtsportifyUpdTime] = useState("unknown extSpotifyUpdTime");

    const accessToken = extSpotifyAccessToken;

    // 检查更新信息
    async function checkUpdate() {
        consoleLog("INFO", "settings", "检查更新中");
        try {
            const updateInfosResponse = await fetch(
                "https://cdn.jsdelivr.net/gh/SteamFinder/AMLL-extSpotify-plugin@main/src/static/version.json",
                {
                    method: "GET",
                },
            );
            if (updateInfosResponse.status === 200) {
                const updateInfos = await updateInfosResponse.json();
                setExtsportifyVer(extVerInfos.extVer);
                setExtsportifyChannel(extVerInfos.extChannel);
                setExtsportifyMinApi(extVerInfos.minApi);
                setExtsportifyUpdTime(extVerInfos.updTime);
                setExtsportifyOnlineVer(updateInfos.extVer);
                consoleLog("INFO", "settings", "检查更新成功");
            } else {
                consoleLog("INFO", "settings", "检查更新失败");
            }
        } catch (error) {
            consoleLog("INFO", "settings", "检查更新失败");
        }
    }

    useEffect(() => {
        checkUpdate();
    }, []);

    // 通过 OAuth2.0 获取 Access Token
    function setExtSpotifyCallbackUrlFunc(url: string) {
        const accessTokenMatch = url.match(/access_token=([^&]*)/);
        if (accessTokenMatch) {
            setExtSpotifyAccessToken(accessTokenMatch[1]);
        } else {
            consoleLog("INFO", "settings", "未从Callback URL中匹配到AccessToken");
            setExtSpotifyAccessToken("unknown-access-token");
        }
    }

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

    // ======================== extSpotify界面 ========================
    return (
        <>
            {/* 扩展 Spotify BEGIN */}

            <SubTitle>extSpotify 设置</SubTitle>

            <Card mt="2">
                <DataList.Root>
                    <DataList.Item align="center">
                        <DataList.Label minWidth="88px">Channel</DataList.Label>
                        <DataList.Value>
                            <Badge color="jade" variant="soft" radius="full">
                                {extSpotifyChannel}
                            </Badge>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">版本</DataList.Label>
                        <DataList.Value>
                            <Flex align="center" gap="2">
                                <Code variant="ghost">{extSpotifyVer}</Code>
                            </Flex>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">最新版本</DataList.Label>
                        <DataList.Value>
                            <Flex align="center" gap="2">
                                <Code variant="ghost">{extSpotifyOnlineVer}</Code>
                            </Flex>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">最低兼容API</DataList.Label>
                        <DataList.Value>
                            <Flex align="center" gap="2">
                                <Code variant="ghost">{extSpotifyMinApi}</Code>
                            </Flex>
                        </DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label minWidth="88px">构建时间</DataList.Label>
                        <DataList.Value>
                            <Flex align="center" gap="2">
                                <Code variant="ghost">{extSpotifyUpdTime}</Code>
                            </Flex>
                        </DataList.Value>
                    </DataList.Item>
                </DataList.Root>
            </Card>

            <SwitchSettings
                label={"启用Spotify Player API"}
                description={"开启后可以同步Spotify播放的歌曲"}
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
                        <Text as="div">Redirect URL</Text>
                        <Text as="div" color="gray" size="2" >
                            从开发者平台设置的 Redirect URL
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
                        <Text as="div">Callback URL</Text>
                        <Text as="div" color="gray" size="2" >
                            请把登录后返回的Callback URL粘贴至此处, 将会自动解析Access Token
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyCallbackUrl}
                        onChange={(e) => setExtSpotifyCallbackUrlFunc(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

            
            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">AccessToken</Text>
                        <Text as="div" color="gray" size="2" >
                            可手动填写, 也可通过Callback URL自动解析
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
                        <Text as="div">Github Proxy URL</Text>
                        <Text as="div" color="gray" size="2" >
                            设置后可以提高资源加载速度, 需加/, 例如https://example.com/
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyProxy}
                        onChange={(e) => setExtSpotifyProxy(e.currentTarget.value)}
                    />
                </Flex>
            </Card>

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
 * 粘贴的Callback URL
 */
export const extSpotifyCallbackUrlAtom = atomWithStorage(
    "extSpotifyCallbackUrlAtom",
    "CallbackURL",
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
/**
 * Github Proxy
 */
export const extSpotifyProxyAtom = atomWithStorage(
    "extSpotifyProxyAtom",
    "https://cf.ghproxy.cc/",
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