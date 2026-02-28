import util from "util"

const groupListKey = "upswgc_groups"
global[groupListKey] = global[groupListKey] || {}

function parseTargets(raw = "") {
  return raw
    .split(",")
    .map(v => parseInt(String(v).trim(), 10))
    .filter(n => Number.isFinite(n) && n > 0)
}

function splitCaptionAndTargets(text = "") {
  const t = String(text || "").trim()
  if (!t) return { caption: "", targetsRaw: "" }

  if (t.includes("|")) {
    const parts = t.split("|")
    const left = parts.slice(0, -1).join("|").trim()
    const right = parts[parts.length - 1].trim()
    return { caption: left, targetsRaw: right }
  }

  return { caption: "", targetsRaw: t }
}

function buildStatusPayloadFromQuoted(q, caption = "") {
  const muani = JSON.parse(JSON.stringify({ [q.mtype]: q }))
  const inner = muani?.[q.mtype]

  const cap = String(caption || "").trim()
  if (cap) {
    if (inner && typeof inner === "object") {
      if ("caption" in inner) inner.caption = cap
      else inner.caption = cap
    }
  }

  return { groupStatusMessageV2: { message: muani } }
}

function buildStatusPayloadText(text = "") {
  const t = String(text || "").trim()
  return { groupStatusMessageV2: { message: { conversation: t } } }
}

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

    if (!String(text || "").trim()) {
      const list = groups
        .map((g, i) => `${i + 1}. ${g.subject || g.name || g.id}`)
        .join("\n")

      return m.reply(
`Silakan pilih grup tujuan untuk upload status:

${list}

Cara pakai:
1) Reply media:
   *${usedPrefix + command} caption | 1,2,3*
   Contoh: *${usedPrefix + command} ini tes foto | 2,5*

2) Tanpa caption (reply media):
   *${usedPrefix + command} 1,2,3*

3) Text doang (tanpa reply):
   *${usedPrefix + command} ini text | 1,2,3*`
      )
    }

    const saved = global[groupListKey][m.sender] || []
    const { caption, targetsRaw } = splitCaptionAndTargets(text)

    const targets = parseTargets(targetsRaw)
    if (!targets.length) return m.reply("⚠️ Format nomor grup tidak valid.\nContoh: .upswgc 1,2,3")

    const invalid = []
    const uniqueIdx = [...new Set(targets)]
    const targetGroups = []

    for (const idx of uniqueIdx) {
      const item = saved[idx - 1]
      if (!item) invalid.push(idx)
      else targetGroups.push(item)
    }

    if (!targetGroups.length) {
      return m.reply("⚠️ Semua nomor grup di luar jangkauan.")
    }

    if (!m.quoted) {
      const plainText = String(caption || "").trim()
      if (!plainText) {
        return m.reply(
`⚠️ Kamu tidak reply media.
Kalau mau kirim TEXT doang, formatnya:
*${usedPrefix + command} ini text | 12,13*`
        )
      }

      const payload = buildStatusPayloadText(plainText)

      const ok = []
      const fail = []

      for (const g of targetGroups) {
        try {
          await conn.relayMessage(g.id, payload, {})
          ok.push(g.name || g.id)
        } catch (e) {
          console.error("❌ upswgc text relay error:", g.id, e)
          fail.push(g.name || g.id)
        }
      }

      let msg = `✅ Selesai upload TEXT ke status grup.\n\n✅ Berhasil (${ok.length}):\n- ${ok.join("\n- ")}`
      if (invalid.length) msg += `\n\n⚠️ Nomor invalid: ${invalid.join(", ")}`
      if (fail.length) msg += `\n\n❌ Gagal (${fail.length}):\n- ${fail.join("\n- ")}`
      return m.reply(msg)
    }

    const q = m.quoted
    const payload = buildStatusPayloadFromQuoted(q, caption)

    const ok = []
    const fail = []

    for (const g of targetGroups) {
      try {
        await conn.relayMessage(g.id, payload, {})
        ok.push(g.name || g.id)
      } catch (e) {
        console.error("❌ upswgc media relay error:", g.id, e)
        fail.push(g.name || g.id)
      }
    }

    let msg = `✅ Selesai upload MEDIA ke status grup.\n\n✅ Berhasil (${ok.length}):\n- ${ok.join("\n- ")}`
    if (String(caption || "").trim()) msg += `\n\n📝 Caption: ${String(caption).trim()}`
    if (invalid.length) msg += `\n\n⚠️ Nomor invalid: ${invalid.join(", ")}`
    if (fail.length) msg += `\n\n❌ Gagal (${fail.length}):\n- ${fail.join("\n- ")}`
    return m.reply(msg)
  }

  const raw = String(text || "").trim()

  if (!m.quoted) {
    if (!raw) {
      return m.reply(`❌ Balas media atau kirim text.\nContoh:\n- Reply media: *${usedPrefix + command} caption*\n- Text: *${usedPrefix + command} ini text*`)
    }
    try {
      const payload = buildStatusPayloadText(raw)
      await conn.relayMessage(m.chat, payload, {})
      return m.reply("✅ Berhasil upload TEXT ke status grup ini.")
    } catch (error) {
      console.error("❌ Terjadi error saat upload status text:", error)
      return m.reply("⚠️ Gagal upload text ke status grup! Cek log untuk detailnya.")
    }
  }

  try {
    const q = m.quoted
    const payload = buildStatusPayloadFromQuoted(q, raw)
    await conn.relayMessage(m.chat, payload, {})
    return m.reply("✅ Berhasil upload MEDIA ke status grup ini.")
  } catch (error) {
    console.error("❌ Terjadi error saat upload status media:", error)
    return m.reply("⚠️ Gagal upload media ke status grup! Cek log untuk detailnya.")
  }
}

handler.help = ["upswgroup", "upswgc"]
handler.tags = ["owner"]
handler.command = ["upswgroup", "upswgc"]
handler.owner = true

export default handler