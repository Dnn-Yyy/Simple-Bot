import axios from "axios"

function secToMMSS(sec) {
  sec = Number(sec || 0)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}.${String(s).padStart(2, "0")}`
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const input = (text || "").trim()
  if (!input) return conn.reply(m.chat, `Format\n${usedPrefix + command} https://vt.tiktok.com/xxxx/`, m)

  try {
    await conn.sendMessage(m.chat, { react: { text: "🕐", key: m.key } })
  } catch {}

  const endpoint = `${global.cuki.api}/api/downloader/tiktok-music?apikey=${encodeURIComponent(global.cuki.apiKey)}&url=${encodeURIComponent(input)}`

  const res = await axios.get(endpoint, {
    timeout: 60000,
    validateStatus: () => true,
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json"
    }
  })

  if (res.status < 200 || res.status >= 300 || !res.data?.success) {
    return conn.reply(m.chat, `Gagal ambil musik`, m)
  }

  const r = res.data?.results || {}
  if (!r?.url) return conn.reply(m.chat, `Musik tidak ditemukan`, m)

  const cap =
    `TikTok Music\n\n` +
    `Title ${r.title || "-"}\n` +
    `Author ${r.author || "-"}\n` +
    `Duration ${secToMMSS(r.duration)}\n` +
    `Original ${r.original ? "yes" : "no"}`

  await conn.sendMessage(
    m.chat,
    {
      audio: { url: r.url },
      mimetype: "audio/mpeg",
      ptt: false,
      caption: cap
    },
    { quoted: m }
  )

  try {
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
  } catch {}
}

handler.command = ["ttmusic", "tiktokmusic"]
handler.tags = ["downloader"]
handler.help = ["ttmusic <url>"]

export default handler