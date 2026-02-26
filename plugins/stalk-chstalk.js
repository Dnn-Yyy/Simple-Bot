const toWAImageURL = (directPath) => {
  if (!directPath) return null
  // kalau ternyata udah url lengkap
  if (/^https?:\/\//i.test(directPath)) return directPath
  // normalisasi path
  const p = directPath.startsWith("/") ? directPath : `/${directPath}`
  return `https://mmg.whatsapp.net${p}`
}

const handler = async (m, { text }) => {
  if (!text) return m.reply("Masukkan link channel\nContoh: .chstalk https://whatsapp.com/channel/0029V...")
  if (!text.includes("https://whatsapp.com/channel/")) return m.reply("Link tautan tidak valid.")

  const code = text.split("https://whatsapp.com/channel/")[1]?.trim()
  if (!code) return m.reply("Kode channel tidak ditemukan.")

  await m.reply("⏳ Mengambil info channel...")

  try {
    const res = await m.conn.newsletterMetadata("invite", code)

    const id = res?.id || "N/A"
    const name = res?.name || "N/A"
    const subs = res?.subscribers ?? "N/A"
    const state = res?.state || "N/A"
    const verified = res?.verification === "VERIFIED" ? "Terverifikasi" : "Tidak"
    const desc = res?.description || "-"

    const caption = `📣 CHANNEL STALK

ID : ${id}
Nama : ${name}
Total Pengikut : ${subs}
Status : ${state}
Verified : ${verified}
Deskripsi : ${desc}`

    // ✅ ambil dari metadata langsung (lebih cocok buat newsletter)
    const imgUrl = toWAImageURL(res.picture) || toWAImageURL(res.preview)

    if (imgUrl) {
      return await m.conn.sendMessage(
        m.chat,
        { image: { url: imgUrl }, caption },
        { quoted: m }
      )
    }

    return m.reply(caption + "\n\n⚠️ PP tidak tersedia di metadata (channel mungkin tidak punya foto).")
  } catch (e) {
    console.error(e)
    return m.reply("Gagal mengambil data channel. Pastikan link benar / channel publik.")
  }
}

handler.command = /^chstalk|channelstalk$/i
export default handler