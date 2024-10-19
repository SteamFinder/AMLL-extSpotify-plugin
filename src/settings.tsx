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

const WARN_TAG = chalk.bgHex("#FF7700").hex("#FFFFFF")(" WARN ");
const INFO_TAG = chalk.bgHex("#00aaff").hex("#FFFFFF")(" INFO ");
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
        consoleLog("INFO", "settings", "SettingPage Loaded");
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
    const [extSpotifyUpdSrc, setExtsportifyUpdSrc] = useState("unknown extSpotifyUpdSrc");
    const [extSpotifyInterpolationMax, setExtSpotifyInterpolationMax] = useAtom(extSpotifyInterpolationMaxAtom);
    const [extSpotifyInterpolationCalc, setExtSpotifyInterpolationCalc] = useAtom(extSpotifyInterpolationCalcAtom);
    const [extSpotifyInterpolationSwitch, setExtSpotifyInterpolationSwitch] = useAtom(extSpotifyInterpolationSwitchAtom);
    const [extSpotifyDebugSwitch, setExtSpotifyDebugSwitch] = useAtom(extSpotifyDebugSwitchAtom);
    const [tokenExpire, setTokenExpire] = useAtom(tokenExpireAtom);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const accessToken = extSpotifyAccessToken;

    // 检查更新信息
    async function checkUpdate() {
        consoleLog("INFO", "settings", "检查更新中");
        try {
            const updateInfosResponse = await fetch(
                "https://cdn.jsdelivr.net/gh/SteamFinder/AMLL-extSpotify-plugin/src/static/version.json",
                {
                    method: "GET",
                    cache: 'no-cache'
                },
            );
            if (updateInfosResponse.status === 200) {
                const updateInfos = await updateInfosResponse.json();
                if (updateInfos.verNum > extVerInfos.verNum) {
                    setUpdateAvailable(true);
                }
                setExtsportifyVer(extVerInfos.extVer);
                setExtsportifyChannel(extVerInfos.extChannel);
                setExtsportifyMinApi(extVerInfos.minApi);
                setExtsportifyUpdTime(extVerInfos.updTime);
                setExtsportifyOnlineVer(updateInfos.extVer);
                setExtsportifyUpdSrc(extVerInfos.updSrc);
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
        setExtSpotifyCallbackUrl(url);
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

        const timestamp = new Date().getTime();
        setTokenExpire(timestamp);
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
                        <DataList.Label minWidth="88px">TargetAPI</DataList.Label>
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
                    {updateAvailable && (
                        <DataList.Item>
                            <DataList.Label minWidth="88px">更新地址</DataList.Label>
                            <DataList.Value>
                                <Flex align="center" gap="2">
                                    <Code variant="ghost"><a href="{extSpotifyUpdSrc}" target="_blank">{extSpotifyUpdSrc}</a></Code>
                                </Flex>
                            </DataList.Value>
                        </DataList.Item>
                    )}
                </DataList.Root>
            </Card>

            <SubTitle>Spotify API</SubTitle>

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

            <Button m="2" onClick={() => getAuth()}>
                登录Spotify
            </Button>

            <SubTitle>extSpotify 扩展行为</SubTitle>

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

            <SwitchSettings
                label={"时间轴自动修正"}
                description={"开启后可以自动管理时间轴修正, 使用前请先把下面的时间轴修正调整为0"}
                configAtom={extSpotifyDelaySwitchAtom}
            />

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">时间轴修正</Text>
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

            <SubTitle>自动插值</SubTitle>

            <SwitchSettings
                label={"自动计算插值"}
                description={"开启后可以自动管理插值, 本功能依赖时间轴自动修正"}
                configAtom={extSpotifyInterpolationSwitchAtom}
            />

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">自动插值范围最大值</Text>
                        <Text as="div" color="gray" size="2" >
                            超出插值范围后将自动修正数据, 可能会造成歌词速度不均匀
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyInterpolationMax}
                        onChange={(e) => setExtSpotifyInterpolationMax(Number(e.currentTarget.value))}
                    />
                    ms
                </Flex>
            </Card>

            <Card mt="2">
                <Flex direction="row" align="center" gap="4" my="2">
                    <Flex direction="column" flexGrow="1">
                        <Text as="div">自动插值测量点数量</Text>
                        <Text as="div" color="gray" size="2" >
                            影响自动插值补偿的计算, 不建议过少
                        </Text>
                    </Flex>
                    <TextField.Root
                        value={extSpotifyInterpolationCalc}
                        onChange={(e) => setExtSpotifyInterpolationCalc(Number(e.currentTarget.value))}
                    />
                </Flex>
            </Card>

            <SubTitle>杂项</SubTitle>

            <SwitchSettings
                label={"Debug"}
                description={"开启后可以看到Debug信息"}
                configAtom={extSpotifyDebugSwitchAtom}
            />

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

            <Button m="2" onClick={() => window.open(extSpotifyUpdSrc)}>
                前往插件Release页面
            </Button>

            <Text as="div">extSpotify</Text>
            <Text as="div">Created By SteamFinder</Text>
            <Text as="div">Powered By AMLL Player Extension Platform</Text>

            {/* Spotify END */}
        </>
    )
}

// ======================== extSpotify配置 Atom ========================

/**
 * 是否启用Spotify功能 默认关闭
 */
export const extSpotifySwitchAtom = atomWithStorage(
    "extSpotifySwitchAtom",
    false,
);

/**
 * 是否启用自动修正 默认开启
 */
export const extSpotifyDelaySwitchAtom = atomWithStorage(
    "extSpotifyDelaySwitchAtom",
    true,
);

/**
 * 是否启用自动插值 默认开启
 */
export const extSpotifyInterpolationSwitchAtom = atomWithStorage(
    "extSpotifyInterpolationSwitchAtom",
    true,
);

/**
 * 是否启用Debug, 默认关闭
 */
export const extSpotifyDebugSwitchAtom = atomWithStorage(
    "extSpotifyDebugSwitchAtom",
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
 * 自动插值 范围最大值
 */
export const extSpotifyInterpolationMaxAtom = atomWithStorage(
    "extSpotifyInterpolationMaxAtom",
    200,
);

/**
 * 自动插值 采样点数量
 */
export const extSpotifyInterpolationCalcAtom = atomWithStorage(
    "extSpotifyInterpolationCalcAtom",
    30,
);

/**
 * Github Proxy
 */
export const extSpotifyProxyAtom = atomWithStorage(
    "extSpotifyProxyAtom",
    "",
);

/**
 * Access Token Expire Time
 */
export const tokenExpireAtom = atomWithStorage(
    "tokenExpireAtom",
    1,
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