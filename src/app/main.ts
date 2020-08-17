import {ImapSimple, ImapSimpleOptions} from "imap-simple";
import imaps from "imap-simple";
import {ParsedMail, simpleParser} from "mailparser";
import {myLog} from "./logger"
try {
    require("../config/config")
} catch (e) {
    console.log("ERROR: Can't import config.js");
    console.log(`if you use Docker, check  -v "$PWD/config":/home/node/config`);
    process.exit(1);
}
import {notifyConfig, imapConfig} from "../config/config"
import _ from "lodash";
import {sendMailToRocketChat} from "./rc";

let imapConnection: ImapSimple;
let dayDeep = 5
const watch_emails = Object.keys(notifyConfig)

export interface Imail {
    from: string,
    to: string,
    subject: string,
    body: string,
    date: Date
}

const config: ImapSimpleOptions = {
    imap: imapConfig,
    onmail: function (numNewMail: number) {
        myLog(`New mails num: ${numNewMail} -`)
        processMails().catch(() => {
            myLog(`Error mail process`)
        })
    },
    onupdate: function (seqno: number, info: string) {
        myLog(info)
        processMails().catch(() => {
            myLog(`Error mail process`)
        })
    },

};

imaps.connect(config).then(function (connection: ImapSimple) {
    imapConnection = connection
    processMails().then(()=>{
        dayDeep = 1
    })
});

const loadMails = async (connection: ImapSimple): Promise<Imail[]> => {
    await connection.openBox('INBOX');

    const searchCriteria = [
        'UNSEEN',
        ['SINCE', new Date(new Date().setDate(new Date().getDate() - 5))]
    ];
    const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false
    };

    let results = await connection.search(searchCriteria, fetchOptions);

    let mails: Array<Imail> = []
    for (const mail of results){
        // EXtract header
        const header = mail.parts.filter(function (part) {
            return part.which === 'HEADER';
        })[0].body

        // Check email in config list
        const email_from: string = header.from[0].match(/(?<=<).*?(?=>)/)[0]
        if (watch_emails.includes(email_from)) {
            myLog(`TRIGGERED <${email_from}> ${header.subject}`)
            connection.addFlags(String(mail.attributes.uid), '\\Seen').then(() => {
                myLog(`Marked ${mail.attributes.uid} as \\Seen`)
            })
        }

        // Parse email
        const all = _.find(mail.parts, {"which": ""});
        const id = mail.attributes.uid;
        const idHeader = "Imap-Id: " + id + "\r\n";
        const parsedMail: ParsedMail = await new Promise((resolve) => {
            try {
                simpleParser(idHeader+all?.body, (err: any, parsedMail: ParsedMail) => {
                    // access to the whole mail object
                    resolve(parsedMail)
                });
            } catch {
                resolve(undefined)
                myLog(`Error parsing message from ${email_from} ${header.date}`)
            }
        })

        // Append object to result array
        mails.push({
            from: email_from,
            to: header.to[0].match(/(?<=<).*?(?=>)/)[0],
            subject: parsedMail.subject || "Undefined :)",
            body: parsedMail.html || "Error extracting mail body",
            date: parsedMail.date || new Date(0)
        })

    }

    return mails
}


const processMails = async () => {
    const mails = await loadMails(imapConnection)
    let cdown = 0
    mails.forEach((mail) => {
        setTimeout(sendMailToRocketChat, cdown, mail)
        cdown += 10000
    })
}


