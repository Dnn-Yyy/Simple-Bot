const cuki = async (m, { conn, isGroup, participants, text }) => {
  try {
    const inGroup = isGroup || (m.chat || "").endsWith("@g.us")
    const t = (text || "").trim()

    if (inGroup) {
      let mem = (participants || []).map(a => a.id)

      await conn.sendMessage(m.chat, {
        text: `@${m.chat}${t ? " " + t : ""}`,
        contextInfo: {
          mentionedJid: mem,
          groupMentions: [
            {
              groupSubject: `ini cuki`,
              groupJid: m.chat,
            },
          ],
        },
      })
      return
    }

    const all = await conn.groupFetchAllParticipating()
    const groups = Object.values(all || {})
    if (!groups.length) return m.reply("Bot tidak ada di group manapun.")

    const showList = () => {
      const list = groups.map((g, i) => `${i + 1}. ${g.subject}`).join("\n")
      return m.reply(
        `📌 List Group\n\n${list}\n\nCara pakai:\n.everyone <teks> | nomor\n.everyone | nomor\n.everyone nomor\n.everyone <teks> nomor\nContoh:\n.everyone 15\n.everyone tes 15\n.everyone tes | 15`
      )
    }

    if (!t) return showList()

    let msgText = ""
    let num = ""

    if (t.includes("|")) {
      let [a, b] = t.split("|")
      msgText = (a || "").trim()
      num = (b || "").trim()
    } else {
      const parts = t.split(/\s+/).filter(Boolean)
      const last = parts[parts.length - 1]
      if (/^\d+$/.test(last)) {
        num = last
        msgText = parts.slice(0, -1).join(" ").trim()
      } else {
        return showList()
      }
    }

    let index = parseInt(num, 10) - 1
    if (isNaN(index) || !groups[index]) return m.reply("Nomor group tidak valid.")

    const target = groups[index]
    const meta = await conn.groupMetadata(target.id)
    const mem = (meta.participants || []).map(a => a.id)

    const finalText = `@${target.id}${msgText ? " " + msgText : ""}`

    await conn.sendMessage(target.id, {
      text: finalText,
      contextInfo: {
        mentionedJid: [target.id, ...mem],
        groupMentions: [
          {
            groupSubject: `ini cuki`,
            groupJid: target.id,
          },
        ],
      },
    })

    return m.reply(`✅ Terkirim ke: ${target.subject}`)
  } catch (e) {
    m.reply(`❌ Error\nLogs error : ${e.message}`)
  }
}

cuki.command = ['everyone']
cuki.help = ['everyone <teks opsional> <nomor_group>']
cuki.tags = ['group']
cuki.group = false
cuki.owner = true
cuki.admin = false

export default cuki