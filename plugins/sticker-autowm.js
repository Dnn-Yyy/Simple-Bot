import { addExif } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  let sender = m.sender.split('@')[0]
  let isOwner = global.config?.owner?.some(([id]) => id == sender)
  if (!isOwner) return

  if (!m.quoted || m.quoted.mtype !== 'stickerMessage') return

  try {
    let stickerBuffer = await m.quoted.download()

    let newSticker = await addExif(stickerBuffer, 'ini punya cuki', 'love youu')
    await conn.sendMessage(m.chat, { sticker: newSticker }, { quoted: m })
  } catch (err) {
    m.reply(`❌ Error\nLogs error : ${err}`)
  }
}

handler.customPrefix = /🌜/
handler.command = /(?:)/i

export default handler