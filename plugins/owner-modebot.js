let handler = async (m, { conn, command }) => {
    let botJid = conn.decodeJid(conn.user?.jid || conn.user?.id)
    let settings = global.db.data.settings[botJid] || (global.db.data.settings[botJid] = {})

    if (!('public' in settings)) settings.public = true
    if (!('self' in settings)) settings.self = false

    if (command === 'self') {
        settings.self = true
        settings.public = false
        return m.reply('Mode bot sekarang: SELF')
    }

    if (command === 'public') {
        settings.public = true
        settings.self = false
        return m.reply('Mode bot sekarang: PUBLIC')
    }
}

handler.help = ['self', 'public']
handler.tags = ['owner']
handler.command = /^(self|public)$/i
handler.owner = true

export default handler