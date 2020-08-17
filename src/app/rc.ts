import {IemailData, notifyConfig, RC_HOOK_URL} from "../config/config";
import axios from "axios";
import {Imail} from "./main";
import {myLog} from "./logger";
const htmlToText = require('html-to-text');

const parseEmail = (mail: Imail) => {
    let data: IemailData = notifyConfig[mail.from](mail.body)
    if (data.text == mail.body){
        data.text = htmlToText.fromString(data.text, {
            wordwrap: 180,
            ignoreImage: true,
            ignoreHref: true
        }).trim().replace(/(\r\n|\n|\r|-{2,})+/gm, "\n")
    }
    return data
}

export const sendMailToRocketChat = (mail: Imail) => {
    const sendData = parseEmail(mail)
    const message = {
        username: "Email Interceptor",
        channel: sendData.channel,
        icon_emoji: ":email:",
        text: `${mail.date.toString()} ${mail.subject}`,
        attachments: [{
            text: sendData.text,
            color: "#2563ba"
        }]
    }
    return axios.post(RC_HOOK_URL, message)
        .then((res) => {
            myLog(`Sended to ${sendData.channel}  statusCode: ${res.status}`)
        })
        .catch((error) => {
            console.error(error)
        })
}
