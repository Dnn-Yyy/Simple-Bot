import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.prefix = ["."]
global.cuki = {
    api: "https://api.cuki.biz.id",
    apiKey: "cuki-x"
    }
global.config = {
    owner: [
['628xxx', 'Cuki', true], // isi nomor own dan nama nya
        ['628xxx', 'Mayy', true]
    ],
    pairingNumber: "628xxx", // isi nomor bot
    pairingAuth: true,
    gris: '`',
    watermark: 'cuki??',
    author: 'Halo kak',
    stickpack: 'Sticker by',
    stickauth: "cuki's api"
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'config.js'"))
    import(`${file}?update=${Date.now()}`)
})