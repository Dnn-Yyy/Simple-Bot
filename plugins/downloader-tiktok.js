import axios from "axios"
let regex = /https:\/\/(www\.)?tiktok\.com\/(@[^\/]+\/(video|photo)\/\d+|\w+\/\d+|\w+)|https:\/\/(vt|vm)\.tiktok\.com\/\w+/i

let handler = async (m, { conn, usedPrefix, command, text }) => {
    try {
        if (!text) return m.reply(`🎥 *Masukkan link TikTok!*\n\nContoh:\n${usedPrefix + command} https://vt.tiktok.com/ZSFxYcCdr/`)
        let isLink = text.match(regex)?.[0]
        if (!isLink && !/tiktok-imgdl/i.test(command)) return m.reply("❌ *Itu bukan link TikTok!*")
        await global.loading(m, conn)

        if (/tiktok-imgdl/i.test(command)) {
            return await conn.sendFile(m.chat, text, "", "", m)
        }

        let { data } = await tiktok(isLink)
        if (!data) return m.reply("❌ *Gagal mengambil data dari TikTok!*\nCoba link lain atau cek apakah link valid.")

        if (data.images?.length) {
            if (data.images.length > 1) {
                let list = data.images.map((v, i) => [`${usedPrefix}tiktok-imgdl ${v}`, (i + 1).toString(), (i + 1).toString()])
                await conn.textList(
                    m.chat,
                    `📸 *Terdapat ${data.images.length} Foto Slide*\nSilakan pilih salah satu untuk didownload!`,
                    data.images[0],
                    list,
                    m,
                    { noList: true }
                )
            } else {
                await conn.sendFile(m.chat, data.images[0], "", "", m)
            }
        } else if (data.play) {
            let download = await conn.getFile(data.play)
            let caption = `👤 *Nickname*: ${data.author?.nickname || "Tidak tersedia"}\n⏱️ *Durasi*: ${data.duration || "-"} detik\n\n📝 *Caption*: ${data.title || "-"}`.trim()

            let buttons = [
                {
                    buttonId: `.ttmusic ${isLink}`,
                    buttonText: { displayText: "ᴀᴍʙɪʟ ᴀᴜᴅɪᴏ" },
                    type: 1
                }
            ]

            await conn.sendMessage(
                m.chat,
                {
                    video: download.data,
                    caption,
                    buttons,
                    headerType: 4
                },
                { quoted: m }
            )
        } else {
            return m.reply("❌ *Data video tidak ditemukan!* Mungkin formatnya tidak didukung.")
        }
    } catch (err) {
        console.log(err)
        m.reply(`❌ Error\nLogs error : ${err.message}`)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['tiktok-imgdl', 'tiktok', 'tiktokmp4', 'tiktokslide', 'tiktokfoto', 'tiktokvideo', 'ttmp4', 'ttslide', 'ttfoto', 'ttvideo']
handler.tags = ["downloader"]
handler.command = /^(tiktok-imgdl|tiktok(mp4|slide|foto|video)?|tt(mp4|slide|foto|video)?)$/i
handler.limit = true
handler.onlyprem = true
export default handler

async function tiktok(url) {
    let res = await axios.post("https://www.tikwm.com/api", {}, { params: { url, hd: 1 } })
    return res.data
}