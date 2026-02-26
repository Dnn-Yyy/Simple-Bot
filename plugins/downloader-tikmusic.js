/*

# Fitur : TikTok Music Downloader
# Type : Plugins ESM
# Created by : https://whatsapp.com/channel/0029Vb2qri6JkK72MIrI8F1Z
# Api : https://www.sankavolereii.my.id

   ⚠️ _Note_ ⚠️
jangan hapus wm ini banggg

*/

let handler = async (m, { conn, text }) => {
  try {
    if (!text) return m.reply('❌ Masukkan URL TikTok-nya!\nContoh: .ttmusic https://vt.tiktok.com/ZSFxYcCdr/')

    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

    const apiKey = global.api.sankaKey
    const url = `${global.api.sanka}/download/tiktok?apikey=${apiKey}&url=${encodeURIComponent(text)}`
    let res = await fetch(url)
    let json = await res.json()

    if (!json.status) return m.reply('❌ Gagal mengambil data audio TikTok.')

    let audio = json.result.music
    let title = json.result.music_info?.title || 'tiktok-audio'

    await conn.sendMessage(m.chat, {
      audio: { url: audio },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m })
  } catch (e) {
    console.error(e)
    throw `❌ Error\nLogs error : ${e}`
  }
}

handler.command = ['ttmusic', 'tiktokmusic']
handler.help = ['ttmusic <url>']
handler.tags = ['downloader']

export default handler