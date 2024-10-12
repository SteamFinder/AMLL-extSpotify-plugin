import chalk from "chalk";

const INFO_TAG = chalk.bgHex("#FFAA00").hex("#FFFFFF")(" INFO ");
const WARN_TAG = chalk.bgHex("#FF7700").hex("#FFFFFF")(" WARN  ");
const NAME_TAG = chalk.bgHex("#00AAFF").hex("#FFFFFF")(" extSpotify ");

export function consoleLog(type, func, info){

    if(type === "INFO"){
        console.log(NAME_TAG, INFO_TAG, func, "::", info)

    }else if(type === "WARN"){
        console.log(NAME_TAG, WARN_TAG, func, "::", info)

    }else if(type === "LOG"){
        console.log(NAME_TAG, NAME_TAG, func, "::", info)

    }else{
        console.log(NAME_TAG, WARN_TAG, func, "::", info)
    }

}