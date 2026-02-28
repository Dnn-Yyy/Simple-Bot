import axios from "axios"
import pkg from "@whiskeysockets/baileys"

const { generateWAMessageContent, generateWAMessageFromContent, proto } = pkg

const API_BASE = global.cuki.api
const KEY = global.cuki.apiKey

async function createImage(conn, url) {
  const { imageMessage } = await generateWAMessageContent(
    { image: { url } },
    { upload: conn.waUploadToServer }
  )
  return imageMessage
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Masukkan query\nContoh\n${usedPrefix + command} Frieren | 5`)

  const [queryRaw, jumlahRaw] = text.split("|").map(v => (v || "").trim())
  const query = (queryRaw || "").trim()
  const jumlah = Math.min(Math.max(parseInt(jumlahRaw || "5"), 1), 10)

  if (!query) return m.reply(`Masukkan query\nContoh\n${usedPrefix + command} Frieren | 5`)

  try {
    await conn.sendMessage(m.chat, { react: { text: "🕐", key: m.key } })
  } catch {}

  const endpoint = `${API_BASE}/api/search/pinterest?apikey=${encodeURIComponent(KEY)}&query=${encodeURIComponent(query)}&type=image`

  try {
    const { data } = await axios.get(endpoint, {
      timeout: 60000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    })

    if (!data?.status || !data?.data?.results || !Array.isArray(data.data.results) || !data.data.results.length) {
      try {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      } catch {}
      return m.reply("Tidak ada gambar ditemukan")
    }

    const results = data.data.results
      .filter(v => v?.image_url)
      .map(v => ({
        image_url: v.image_url,
        pin: v.pin,
        grid_title: v.grid_title,
        description: v.description,
        pinner: v.pinner
      }))

    if (!results.length) {
      try {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
      } catch {}
      return m.reply("Tidak ada gambar ditemukan")
    }

    shuffle(results)
    const pick = results.slice(0, jumlah)
    const cards = []

    for (let i = 0; i < pick.length; i++) {
      const it = pick[i]
      const imageMsg = await createImage(conn, it.image_url)

      const title = (it.grid_title || "").trim()
      const desc = (it.description || "").trim()
      const user = it.pinner?.username ? `@${it.pinner.username}` : "-"
      const name = it.pinner?.full_name || "-"

      const bodyText =
        `Gambar ${i + 1} dari ${pick.length}\n` +
        `Judul ${title || "-"}\n` +
        `Pinner ${name} ${user}\n` +
        `Deskripsi ${desc || "-"}`

      const pinUrl =
        typeof it.pin === "string" && it.pin.startsWith("http")
          ? it.pin
          : `https://www.pinterest.com/pin/${encodeURIComponent(String(it.pin || ""))}`

      cards.push({
        body: proto.Message.InteractiveMessage.Body.fromObject({ text: bodyText }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: "cuki digital" }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: true,
          imageMessage: imageMsg
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Lihat di Pinterest",
                url: pinUrl,
                merchant_url: pinUrl
              })
            }
          ]
        })
      })
    }

    const carousel = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `Hasil Pinterest\nQuery ${query}\nTotal ${data.data.total || results.length}`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: "" }),
              header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
              carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                cards
              })
            })
          }
        }
      },
      {}
    )

    await conn.relayMessage(m.chat, carousel.message, { messageId: carousel.key.id })

    try {
      await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
    } catch {}
  } catch (err) {
    try {
      await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } })
    } catch {}
    return m.reply(`Error ${err?.message || err}`)
  }
}

handler.help = ["pinterest <query> | <jumlah>"]
handler.tags = ["search"]
handler.command = /^pinterest|pin$/i

export default handler