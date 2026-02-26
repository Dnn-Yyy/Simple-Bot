
import axios from "axios"

const API_BASE = global.cuki.api
const KEY = global.cuki.apiKey

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const url = (args[0] || "").trim()

  if (!url) {
    return m.reply(
      `Format salah.\nContoh:\n${usedPrefix + command} https://vt.tiktok.com/xxxx/`
    )
  }
  
  try {
    await m.react("🕐")
  } catch {}

  try {
    const endpoint =
      `${API_BASE}/api/downloader/tiktok` +
      `?apikey=${encodeURIComponent(global?.config?.apikey || "cuki-x")}` +
      `&url=${encodeURIComponent(url)}`

    const { data } = await axios.get(endpoint, {
      timeout: 60_000,
      validateStatus: () => true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
        Accept: "application/json",
      },
    })

    if (!data || data.success !== true || !data.results) {
      const msg =
        data?.message ||
        data?.error ||
        `Gagal ambil data TikTok (status: ${data?.statusCode || "?"}).`
      try {
        await m.react("❌")
      } catch {}
      return m.reply(msg)
    }

    const r = data.results
    if (r.type !== "video" || !r.nowm) {
      try {
        await m.react("❌")
      } catch {}
      return m.reply("Hasil bukan video / link video tidak ditemukan.")
    }

    const author = r.author || {}
    const musicInfo = r.music_info || {}
    const stats = r.stats || {}

    const caption =
      `✅ TikTok Downloader\n` +
      `• Username: @${author.unique_id || "-"}\n` +
      `• Nickname: ${author.nickname || "-"}\n` +
      `• Judul: ${r.title || "-"}\n` +
      `• Durasi: ${typeof r.duration === "number" ? r.duration + "s" : "-"}\n` +
      `• Music: ${musicInfo.title || "-"}\n` +
      `• Views: ${stats.play_count ?? "-"} | Likes: ${stats.digg_count ?? "-"} | Comments: ${stats.comment_count ?? "-"} | Share: ${stats.share_count ?? "-"}\n` +
      `\n` +
      `Caption Asli:\n${r.caption || "-"}`

    await conn.sendMessage(
      m.chat,
      {
        video: { url: r.nowm },
        caption,
        fileName: `tiktok-${r.id || Date.now()}.mp4`,
        mimetype: "video/mp4",
      },
      { quoted: m }
    )

    try {
      await m.react("✅")
    } catch {}
  } catch (e) {
    try {
      await m.react("❌")
    } catch {}
    return m.reply(`Error: ${e?.message || e}`)
  }
}

handler.help = ["tt <url tiktok>"]
handler.tags = ["downloader"]
handler.command = /^tt$/i

export default handler