/**
  » Fitur : Play Spotify
  » Type     : Plugin ESM
  » Channel   : https://whatsapp.com/channel/0029Vay0apKJZg49rZz1OF33
  » Creator  : MifNity
  » Api      : [ https://api.deline.web.id ]
  » Note    : Enjoy Your Life
**/

import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
    try {
        if (!args[0]) return m.reply("Contoh: .plays sparks");

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        const query = args.join(" ");
        const url = `https://api.deline.web.id/downloader/spotifyplay?q=${encodeURIComponent(query)}`;
        const r = await fetch(url);
        const json = await r.json();

        if (!json.status) {
            await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            return m.reply("Gagal mengambil data.");
        }

        const meta = json.result.metadata;
        const audioUrl = json.result.dlink;

        let caption = `🎵 *Spotify Play*\n\n` +
        `• *Judul:* ${meta.title}\n` +
        `• *Artist:* ${meta.artist}\n` +
        `• *Durasi:* ${meta.duration}\n` +
        `• *Link:* ${meta.url}\n\n` +
        `> wait sending music...`;

        await conn.sendMessage(m.chat, {
            image: { url: meta.cover },
            caption
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg"
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: "✔️", key: m.key } });

    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(String(e));
    }
};

handler.help = ['plays'];
handler.command = ['plays', 'playspotify'];
handler.tags = ['music'];

export default handler;