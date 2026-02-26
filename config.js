import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.prefix = ["."]
global.config = {
    owner: [
['6287858086256', 'Linz', true],
        ['6285974900047', 'vella', true]
    ],
    pairingNumber: "6285974900047",
    pairingAuth: true,
    gris: '`',
    watermark: 'Linz??',
    author: 'Halo kak',
    stickpack: 'Sticker by',
    stickauth: 'Linzz'
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'config.js'"))
    import(`${file}?update=${Date.now()}`)
})