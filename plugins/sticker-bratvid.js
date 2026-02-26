import axios from 'axios';
import { Sticker } from 'wa-sticker-formatter';

let handler = async (m, { conn, text, usedPrefix }) => {
    if (!text) {
        return conn.reply(m.chat, `Gunakan perintah ini dengan format: ${usedPrefix}brat <teks>`, m);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        const url = `https://skyzxu-brat.hf.space/brat-animated?text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        if (!response.data) {
            await conn.reply(m.chat, 'Maaf, API tidak memberikan data gambar stiker.', m);
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return;
        }

        const sticker = new Sticker(response.data, {
            pack: 'Stiker By',
            author: `${global.namebot}`,
            type: 'full',
        });

        const stikerBuffer = await sticker.toBuffer();
        let sentMessage = await conn.sendMessage(m.chat, { sticker: stikerBuffer }, { quoted: m });
        
        await conn.sendMessage(m.chat, { react: { text: '🎉', key: sentMessage.key } });

    } catch (error) {
        console.error('Error saat membuat stiker brat:', error);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await conn.reply(m.chat, 'Maaf, terjadi kesalahan saat mencoba membuat stiker brat. Coba lagi nanti.', m);
    }
};

handler.help = ['bratvideo <teks>'];
handler.tags = ['sticker'];
handler.command = /^(bratvideo|bratvid)$/i;
handler.limit = 5;
handler.register = true;
handler.premium = false;

export default handler;