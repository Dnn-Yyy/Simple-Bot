import fs from 'fs';
import archiver from 'archiver';
import path from 'path';

let cuki = async (m, { conn }) => {
    if (conn.user.jid !== global.conn.user.jid) return;

    let backupName = path.join('/home/container/tmp/', `backup_Script.zip`);
    let Namebackup = `backup_Script.zip`
    let output = fs.createWriteStream(backupName);
    let archive = archiver('zip', { zlib: { level: 9 } });
    await conn.reply(m.chat, '🔄 *Sedang membackup script...*', m);
    output.on('close', async function () {
        let caption = `Berikut adalah file backup bot kamu:\nNama file: backup_Script.zip\n\nUkuran file: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB\n\n*Demi Keamanan, File akan di hapus dalam 30 Menit*\n*Silahkan Simpan Script ini secara Manual*`;
        const privateChatId = m.sender;
        let sentMessage = await conn.sendFile(privateChatId, backupName, Namebackup, caption, m);
        setTimeout(async () => {
            await conn.sendMessage(privateChatId, { delete: { remoteJid: privateChatId, id: sentMessage.key.id } })
                .catch(err => console.error(`Gagal menghapus pesan: ${err}`));
        }, 1800000);
    });
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });
    archive.on('error', function (err) {
        throw err;  
    });
    archive.pipe(output);
    archive.glob('**/*', {
        ignore: [
            'node_modules/**', 
            'tmp/**', 
            '.npm/**', 
            '.cache/**', 
            'sessions/**', 
            backupName
        ]
    });

    await archive.finalize();
}

cuki.help = ['backup'];
cuki.tags = ['owner'];
cuki.command = /^(backup)$/i;
cuki.owner = true;

export default cuki;