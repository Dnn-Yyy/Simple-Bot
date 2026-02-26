import fs from "fs"
import path from "path"

const getTextFromQuoted = (q) => {
  const msg = q?.message || q?.msg || {}
  if (typeof q?.text === "string" && q.text) return q.text
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text
  if (msg.imageMessage?.caption) return msg.imageMessage.caption
  if (msg.videoMessage?.caption) return msg.videoMessage.caption
  return ""
}

const getInnerMessage = (q) => {
  const msg = q?.msg || q?.message || {}
  return (
    msg?.viewOnceMessageV2?.message ||
    msg?.viewOnceMessage?.message ||
    q?.message?.viewOnceMessageV2?.message ||
    q?.message?.viewOnceMessage?.message ||
    msg ||
    q?.message ||
    q
  )
}

const getType = (q, inner) => {
  return q?.mtype || Object.keys(inner || {})[0] || ""
}

let handler = async (m, { conn }) => {
  if (m.isGroup) return m.reply("❌ Command ini hanya bisa digunakan di chat pribadi!")
  if (!m.quoted) return m.reply("📌 Balas status (teks/gambar/video) yang ingin diambil!")

  const q = m.quoted
  const inner = getInnerMessage(q)
  const type = getType(q, inner)

  const isImage = type === "imageMessage" || !!inner?.imageMessage
  const isVideo = type === "videoMessage" || !!inner?.videoMessage
  const isText =
    type === "conversation" ||
    type === "extendedTextMessage" ||
    !!inner?.conversation ||
    !!inner?.extendedTextMessage?.text

  if (isText && !isImage && !isVideo) {
    const txt = getTextFromQuoted(q)
    if (!txt) return m.reply("⚠️ Teks status tidak terbaca.")
    return conn.sendMessage(m.chat, { text: txt }, { quoted: m })
  }

  if (!isImage && !isVideo) return m.reply("❌ Hanya bisa mengambil status teks/gambar/video!")

  try {
    let buffer = null

    if (typeof q.download === "function") buffer = await q.download()
    if (!buffer && typeof q.downloadMedia === "function") buffer = await q.downloadMedia()

    if (!buffer) {
      try {
        buffer = await conn.downloadMediaMessage(q)
      } catch {}
    }

    if (!buffer) {
      try {
        buffer = await conn.downloadMediaMessage({ message: inner })
      } catch {}
    }

    if (!buffer) return m.reply("⚠️ Gagal mengambil status! Coba reply ulang statusnya lalu ketik sw lagi.")

    if (isImage) return conn.sendMessage(m.chat, { image: buffer }, { quoted: m })
    if (isVideo) return conn.sendMessage(m.chat, { video: buffer }, { quoted: m })
  } catch (e) {
    console.error("ambilsw error:", e)
    return m.reply("⚠️ Gagal mengambil status!")
  }
}

handler.help = ["ambilsw", "sw"]
handler.tags = ["tools"]
handler.command = ["ambilsw", "sw"]
handler.owner = true

export default handler