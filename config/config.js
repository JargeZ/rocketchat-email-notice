exports.RC_HOOK_URL = 'https://chat.site.ru/hooks/HxS4F/ZExrP7PRMWEqFTcyFhejYgoz'

exports.imapConfig = {
    user: 'example@site.ru',
    password: 'p@ssword',
    host: 'mail.site.ru',
    port: 993,
    tls: true,
    keepalive: {
        interval: 9000,
        idleInterval: 200000,
        forceNoop: true
    },
    authTimeout: 3000
}

exports.notifyConfig = {
    "jargez@site.ru": (HTMLBody) => {
        // perform any action and return object
        return {
            channel: '@jargez', // #channel or @username
            text: HTMLBody // if object isn't edited, then the whole letter will be sent in text form
        }
    }
}
