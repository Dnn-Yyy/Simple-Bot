import fs from "fs"
import Jimp from "jimp"

let handler = async (m, { conn }) => {
  const thumbPath = "./media/docmenu.jpg"
  if (!fs.existsSync(thumbPath)) throw new Error("Thumbnail dokumen tidak ditemukan!")

  const thumb = await Jimp.read(thumbPath)
  const resizedThumb = await thumb
    .resize(400, Jimp.AUTO)
    .quality(90)
    .getBufferAsync(Jimp.MIME_JPEG)

  let caption = `Halo *@${m.sender.split("@")[0]}* 👋🏻
Ini adalah menu dari simple bot by cuki

*Note :*
ⓒ : khusus cuki

› LIST FITUR:
▢ tt / tiktok
▢ upswgc *[ ⓒ ]*
▢ brat
▢ bratvid
▢ ig
▢ sticker - s
▢ readviewonce - rvo
▢ ttmusic
▢ everyone
▢ pay
▢ sp *[ ⓒ ]*
▢ df *[ ⓒ ]*
▢ backup *[ ⓒ ]*
▢ sf *[ ⓒ ]*
`

  await conn.sendMessage(m.chat, {
    react: { text: "🕒", key: m.key }
  })

  const sentMenu = await conn.sendMessage(
    m.chat,
    {
      document: fs.readFileSync(thumbPath),
      mimetype: "application/octet-stream",
      fileName: `ɪɴɪ ᴄᴜᴋɪ`,
      fileLength: 999999999,
      caption,
      jpegThumbnail: resizedThumb,
      footer: `2025 - ᴄᴜᴋɪ ᴅɪɢɪᴛᴀʟ`,
      interactiveButtons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "☯",
            url: "https://whatsapp.com/channel/0029VbBbGUiFcow4neaist0T",
          }),
        },
      ],
      headerType: 6,
      viewOnce: true,
    },
    { quoted: m }
  )

  const songs = [
    "https://uploader.zenzxz.dpdns.org/uploads/1767501976346.mpga",
    "https://uploader.zenzxz.dpdns.org/uploads/1767501957436.mpga",
  ]
  const pick = songs[Math.floor(Math.random() * songs.length)]

  await conn.sendMessage(
    m.chat,
    {
      audio: { url: pick },
      mimetype: "audio/mpeg",
      ptt: true,
    },
    { quoted: sentMenu }
  )

  await conn.sendMessage(m.chat, {
    react: { text: "", key: m.key }
  })
}

handler.command = ["menu"]
handler.tags = ["main"]
handler.help = ["menu"]
handler.register = false

export default handler