import fetch from "node-fetch"
import { format } from "util"
import path from "path"

let handler = async (m, { text, conn, usedPrefix, command }) => {
    try {
        if (!/^https?:\/\//.test(text)) return m.reply(`Awali *URL* dengan http:// atau https:// \n\nContoh: \n${usedPrefix + command} https://google.com`)

        if (!/^https?:\/\//.test(text)) {
            text = "http://" + text
        } else if (/^https:\/\//.test(text)) {
            text = text
        }

        let url = text

        let maxRedirects = 999999
        let redirectCount = 0
        let redirectUrl = url

        while (redirectCount < maxRedirects) {
            let res = await fetch(redirectUrl)

            if (res.headers.get("content-length") > 100 * 1024 * 1024 * 1024) {
                res.body.destroy()
                return m.reply(`Content-Length: ${res.headers.get("content-length")}`)
            }

            const contentType = res.headers.get("content-type")
            const contentDisposition = res.headers.get("content-disposition")
            let filename

            if (contentDisposition && contentDisposition.includes("filename=")) {
                filename = contentDisposition.split("filename=")[1].trim()
            } else if (contentDisposition) {
                filename = contentDisposition.replace(/^filename=/i, "").trim()
            } else {
                filename = path.basename(new URL(redirectUrl).pathname)
            }

            if (/^image\//.test(contentType)) {
                try {
                    await conn.sendFile(m.chat, redirectUrl, filename, text, m)
                } catch (err) {
                    await m.reply("respons bukan gambar")
                    await conn.sendFile(m.chat, redirectUrl, filename, text, m)
                }
            } else if (/^application\/json/.test(contentType)) {
                try {
                    let txt = await res.json()
                    txt = format(JSON.stringify(txt, "", 2))
                    await conn.sendMessage(m.chat, {
                        text: txt.slice(0, 65536) + ""
                    }, {
                        quoted: m
                    })
                    await conn.sendFile(m.chat, Buffer.from(txt), "file.json", "", m)
                } catch (error) {
                    m.reply("Respons bukan JSON")
                }
            } else if (/^text\//.test(contentType)) {
                try {
                    let txt = await res.text()
                    await conn.sendMessage(m.chat, {
                        text: txt.slice(0, 65536) + ""
                    }, {
                        quoted: m
                    })
                    await conn.sendFile(m.chat, Buffer.from(txt), "file.txt", "", m)
                } catch (e) {
                    await m.reply("respons bukan teks")
                }
            } else if (/^text\/html/.test(contentType)) {
                try {
                    let html = await res.text()
                    await conn.sendFile(m.chat, Buffer.from(html), "file.html", "", m)
                } catch (error) {
                    await m.reply("Respons bukan HTML")
                }
            } else {
                await conn.sendFile(m.chat, redirectUrl, filename, text, m)
            }

            if (
                res.status === 301 ||
                res.status === 302 ||
                res.status === 307 ||
                res.status === 308
            ) {
                let location = res.headers.get("location")
                if (location) {
                    redirectUrl = location
                    redirectCount++
                } else {
                    break
                }
            } else {
                break
            }
        }

        if (redirectCount >= maxRedirects) {
            return m.reply(`Too many redirects (max: ${maxRedirects})`)
        }
    } catch (e) {
        throw e
    } finally {
    }
}

handler.help = ["fetch", "get"]
handler.tags = ["internet"]
handler.command = /^(fetch|get)$/i

export default handler