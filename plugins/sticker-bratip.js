import { Sticker } from 'wa-sticker-formatter'
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text) return m.reply('masukkan teks nya')

    try {
        await m.reply('Tunggu sebentar ya kak🕒')

        const response = `https://aqul-brat.hf.space?text=${encodeURIComponent(text)}`

        let stiker = await createSticker(false, response, 'Frieren - Ai')
        if (stiker) await conn.sendFile(m.chat, stiker, '', '', m)

    } catch (e) {
        throw e
    }
}

handler.help = ['brat']
handler.tags = ['sticker']
handler.command = /^(brat)$/i
export default handler

async function createSticker(img, url, packName, authorName, quality) {
    let stickerMetadata = {
        type: 'crop',
        pack: packName,
        author: authorName,
        quality
    }
    return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}