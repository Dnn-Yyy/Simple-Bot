import fs from 'fs';

let handler = async (m, { conn }) => {
    let mtype = m.quoted?.mediaMessage;

    await conn.sendMessage(m.chat, {
        react: {
            text: '⏳',
            key: m.key
        }
    });

    const thumbs = [
        './media/thumb-1.jpg',
        './media/thumb-2.jpg'
    ];
    const randomThumb = fs.readFileSync(thumbs[Math.floor(Math.random() * thumbs.length)]);

    if (mtype?.imageMessage) {
        let caption = mtype.imageMessage.caption || '*donee sayanggg*';

        try {
            let buffer = await m.quoted.download();

            await conn.sendMessage(m.chat, {
                image: buffer,
                caption,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: "cuki? i love u",
                        newsletterJid: global.config.chanel
                    },
                    externalAdReply: {
                        title: global.namaBot,
                        body: global.namaOwn,
                        thumbnail: randomThumb,
                        sourceUrl: '',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

            await conn.sendMessage(m.chat, {
                react: {
                    text: '✅',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('❌ Gagal unduh imageMessage:', error);
            m.reply('Terjadi kesalahan saat mengunduh gambar.');

            await conn.sendMessage(m.chat, {
                react: {
                    text: '❌',
                    key: m.key
                }
            });
        }

    } else if (mtype?.videoMessage) {
        let caption = mtype.videoMessage.caption || '*donee sayanggg*';

        try {
            let buffer = await m.quoted.download();

            await conn.sendMessage(m.chat, {
                video: buffer,
                caption,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: "cuki? i love you",
                        newsletterJid: global.config.chanel
                    },
                    externalAdReply: {
                        title: global.namaBot,
                        body: global.namaOwn,
                        thumbnail: randomThumb,
                        sourceUrl: '',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

            await conn.sendMessage(m.chat, {
                react: {
                    text: '✅',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('❌ Gagal unduh videoMessage:', error);
            m.reply('Terjadi kesalahan saat mengunduh video.');

            await conn.sendMessage(m.chat, {
                react: {
                    text: '❌',
                    key: m.key
                }
            });
        }

    } else {
        m.reply('❌ Tidak ada media yang bisa diakses (image/video). Reply ke pesan viewOnce!');
        await conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });
    }
};

handler.help = ['readviewonce', 'rvo'];
handler.tags = ['tools'];
handler.command = /^retrieve|readviewonce|rvo$/i;

export default handler;