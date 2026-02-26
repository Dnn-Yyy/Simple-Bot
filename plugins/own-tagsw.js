import util from "util"

const groupListKey = "upswgc_groups"
global[groupListKey] = global[groupListKey] || {}

let handler = async (m, { conn, usedPrefix, command, text, isOwner }) => {
  if (!isOwner) return m.reply("❌ Khusus owner.")

  const isPm = !m.isGroup

  if (isPm) {
    const groupsObj = await conn.groupFetchAllParticipating().catch(() => ({}))
    const groups = Object.values(groupsObj)

    if (!groups.length) return m.reply("⚠️ Tidak ada grup yang ditemukan.")

    global[groupListKey][m.sender] = groups.map(g => ({
      id: g.id,
      name: g.subject || g.name || g.id
    }))

    if (!text) {
      const list = groups
        .map((g, i) => `${i + 1}. ${g.subject || g.name || g.id}`)
        .join("\n")

      return m.reply(
`Silakan pilih grup tujuan untuk upload status:

${list}

Cara pakai:
1. Balas *media* yang mau di-upload.
2. Ketik: *${usedPrefix + command} <nomor_grup>*
   Contoh: *${usedPrefix + command} 2*`
      )
    }

    if (!m.quoted) {
      return m.reply(
`⚠️ Balas *media* yang mau di-upload*, lalu gunakan:
*${usedPrefix + command} <nomor_grup>*

Contoh:
${usedPrefix + command} 2`
      )
    }

    const idx = parseInt(text.trim())
    if (isNaN(idx)) return m.reply("⚠️ Nomor grup tidak valid.")

    const saved = global[groupListKey][m.sender]
    if (!saved || !saved[idx - 1]) {
      return m.reply("⚠️ Nomor grup di luar jangkauan.")
    }

    const target = saved[idx - 1]
    const targetJid = target.id

    try {
      const q = m.quoted
      const muani = JSON.parse(JSON.stringify({ [q.mtype]: q }))

      await conn.relayMessage(
        targetJid,
        { groupStatusMessageV2: { message: muani } },
        {}
      )

      return m.reply(`✅ Berhasil upload ke status grup:\n${target.name || targetJid}`)
    } catch (error) {
      console.error("❌ Terjadi error saat upload status:", error)
      return m.reply("⚠️ Gagal upload ke status grup! Cek log untuk detailnya.")
    }
  }

  if (!m.quoted) {
    return m.reply(
      `❌ Balas media yang ingin diupload ke status dengan perintah *${usedPrefix + command}*`
    )
  }

  try {
    const q = m.quoted
    const muani = JSON.parse(JSON.stringify({ [q.mtype]: q }))

    await conn.relayMessage(
      m.chat,
      { groupStatusMessageV2: { message: muani } },
      {}
    )

    await m.reply("✅ Berhasil upload ke status grup.")
  } catch (error) {
    console.error("❌ Terjadi error saat upload status:", error)
    m.reply("⚠️ Gagal upload ke status grup! Cek log untuk detailnya.")
  }
}

handler.help = ["upswgroup", "upswgc"]
handler.tags = ["owner"]
handler.command = ["upswgroup", "upswgc"]
handler.owner = true

export default handler