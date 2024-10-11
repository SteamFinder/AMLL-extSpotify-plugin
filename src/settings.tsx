import { atom, useAtom } from "jotai";
import { useEffect, type FC } from "react";

const testAtom = atom(0)

export const SettingPage: FC = () => {
    const [test, setTest] = useAtom(testAtom);
    useEffect(() => {
        console.log("SettingPage Loaded");
    }, []);
    
    return <div>
        Test Plugin Setting Page
        <div>{test}</div>
        <button onClick={() => setTest(v => v + 1)}>
            Increase
        </button>
    </div>
}