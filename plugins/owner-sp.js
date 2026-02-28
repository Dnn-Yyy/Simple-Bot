import fs from 'fs'
import syntaxError from 'syntax-error'
import path from 'path'
import util from 'util'

const _fs = fs.promises

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
    if (!text) throw `
Penggunaan: ${usedPrefix}${command} <nama file>
Contoh: ${usedPrefix}sp owner
`.trim()

    if (!m.quoted) throw `Reply kodenya dulu.`

    if (/p(lugin)?/i.test(command)) {
        const folder = path.join(process.cwd(), 'plugins')
        if (!fs.existsSync(folder)) await _fs.mkdir(folder, { recursive: true })

        let filename = text.replace(/plugin(s)?\//i, '').replace(/\.js$/i, '') + '.js'

        const error = syntaxError(m.quoted.text, filename, {
            sourceType: 'module',
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true
        })
        if (error) throw error

        const pathFile = path.join(folder, filename)

        await _fs.writeFile(pathFile, m.quoted.text)

        m.reply(`
✅ File berhasil disimpan (ditimpa jika sudah ada)
📂 Lokasi: *cuki-plugins_esm/${filename}*

\`\`\`
${util.format(m.quoted.text)}
\`\`\`
`.trim())

    } else {
        const isJavascript = m.quoted.text && !m.quoted.mediaMessage && /\.js$/i.test(text)

        if (isJavascript) {
            const error = syntaxError(m.quoted.text, text, {
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true
            })
            if (error) throw error

            await _fs.writeFile(text, m.quoted.text)
            m.reply(`
✅ File berhasil disimpan (ditimpa jika sudah ada)
📂 Lokasi: *${text}*

\`\`\`
${util.format(m.quoted.text)}
\`\`\`
`.trim())

        } else if (m.quoted.mediaMessage) {
            const media = await m.quoted.download()
            await _fs.writeFile(text, media)
            m.reply(`✅ Media berhasil disimpan (ditimpa jika sudah ada)\n📂 Lokasi: *${text}*`)
        } else {
            throw 'Tidak support format tersebut.'
        }
    }
}

handler.help = ['saveplugin']
handler.tags = ['owner']
handler.command = /^(sf|sp)$/i
handler.owner = true

export default handler