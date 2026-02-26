import baileys from '@whiskeysockets/baileys'

const { proto, generateWAMessage, areJidsSameUser } = baileys

const before = async (m, chatUpdate) => {
  if (m.isBaileys) return
  if (!m.message) return

  if (
    m.mtype === 'interactiveResponseMessage' &&
    m.quoted &&
    m.quoted.fromMe
  ) {
    const id = JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id
    await appendTextMessage(m, id, chatUpdate)
  }
}

const appendTextMessage = async (m, text, chatUpdate) => {
  const msg = await generateWAMessage(
    m.chat,
    { text, mentions: m.mentionedJid || [] },
    {
      userJid: conn.user.id,
      quoted: m.quoted && m.quoted.fakeObj
    }
  )

  msg.key.fromMe = areJidsSameUser(m.sender, conn.user.id)
  msg.key.id = m.key.id
  msg.pushName = m.pushName

  if (m.isGroup) msg.participant = m.sender

  const upsert = {
    ...chatUpdate,
    messages: [proto.WebMessageInfo.fromObject(msg)],
    type: 'append'
  }

  conn.ev.emit('messages.upsert', upsert)
}

export { before }