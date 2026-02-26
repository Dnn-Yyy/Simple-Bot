import fs from "fs"

let handler = async (m, { conn }) => {
  const qrisPath = "./media/qris.jpg"
  if (!fs.existsSync(qrisPath)) throw new Error("File QRIS tidak ditemukan!")

  const caption = `Silakan pilih metode pembayaran:
- QRIS
- DANA

Terima kasih 🤍`

  await conn.sendMessage(
    m.chat,
    {
      image: fs.readFileSync(qrisPath),
      caption,
      footer: "",
      interactiveButtons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "Copy No DANA",
            copy_code: "087761212794"
          })
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Saluran cuki",
            url: "https://whatsapp.com/channel/0029VbBbGUiFcow4neaist0T" 
          })
        }
      ]
    },
    { quoted: m }
  )
}

handler.command = ["pay"]
handler.tags = ["main"]
handler.help = ["pay"]

export default handler