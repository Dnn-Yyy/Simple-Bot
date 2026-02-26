import { smsg } from './lib/simple.js'
import { format } from 'util'
import chalk from 'chalk'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import { watchFile, unwatchFile } from 'fs'
import NodeCache from 'node-cache'

const printMessage = (await import('./lib/print.js')).default

const isNumber = x => typeof x === 'number' && !isNaN(x)
const normJid = (conn, id) => conn.decodeJid(id || '')

const metadataCache = new NodeCache({ stdTTL: 60, checkperiod: 120 })
const activityTracker = new Map()

function ensureDB() {
  if (!global.db?.data) throw new Error('DB not loaded')
  if (!global.db.data.users) global.db.data.users = {}
  if (!global.db.data.chats) global.db.data.chats = {}
  if (!global.db.data.settings) global.db.data.settings = {}
  if (!global.db.data.stats) global.db.data.stats = {}
}

function ensureUser(db, jid, name = '') {
  if (!db.data.users[jid]) db.data.users[jid] = {}
  const u = db.data.users[jid]

  if (!isNumber(u.money)) u.money = 0
  if (!isNumber(u.exp)) u.exp = 0
  if (!isNumber(u.limit)) u.limit = 50
  if (!isNumber(u.level)) u.level = 0

  if (!('registered' in u)) u.registered = false
  if (!('name' in u)) u.name = name

  if (!('premium' in u)) u.premium = false
  if (!isNumber(u.premiumTime)) u.premiumTime = 0

  if (!isNumber(u.lastseen)) u.lastseen = 0
  if (!isNumber(u.chat)) u.chat = 0
  if (!isNumber(u.chatTotal)) u.chatTotal = 0

  return u
}

function ensureChat(db, jid) {
  if (!db.data.chats[jid]) db.data.chats[jid] = {}
  const c = db.data.chats[jid]
  if (!('mute' in c)) c.mute = false
  if (!('isBanned' in c)) c.isBanned = false
  return c
}

function ensureSettings(db, botJid) {
  if (!db.data.settings[botJid]) db.data.settings[botJid] = {}
  const s = db.data.settings[botJid]

  // mode
  if (!('self' in s)) s.self = true
  if (!('public' in s)) s.public = false
  if (!('noerror' in s)) s.noerror = false
  return s
}

function getOwners() {
  const ownersDev = (global.config.owner || [])
    .filter(([n, _, isDeveloper]) => n && isDeveloper)
    .map(([n]) => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net')

  const owners = (global.config.owner || [])
    .filter(([n, _, isDeveloper]) => n && !isDeveloper)
    .map(([n]) => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net')

  return { ownersDev, owners }
}

/**
 * PREFIX SYSTEM (same spirit as handler panjang)
 * supports:
 * - plugin.customPrefix
 * - conn.prefix
 * - opts.prefix (regex class)
 * - prefix can be RegExp | Array | String
 */
const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

function buildDefaultPrefixRe() {
  return new RegExp(
    '^[' +
      (global.opts?.prefix || '‎\\/!#.\\\\').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') +
    ']'
  )
}

function getPrefixMatch(conn, plugin, text) {
  const prefixDefault = buildDefaultPrefixRe()
  const _prefix = plugin?.customPrefix ? plugin.customPrefix : (conn?.prefix ? conn.prefix : prefixDefault)

  const list = _prefix instanceof RegExp
    ? [[_prefix.exec(text), _prefix]]
    : Array.isArray(_prefix)
      ? _prefix.map(p => {
          const re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
          return [re.exec(text), re]
        })
      : typeof _prefix === 'string'
        ? [[new RegExp(str2Regex(_prefix)).exec(text), new RegExp(str2Regex(_prefix))]]
        : [[[], new RegExp]]

  const match = list.find(p => p[1])
  const usedPrefix = (match?.[0] || '')?.[0] || ''
  return { match, usedPrefix, prefixDefault }
}

async function getGroupContext(conn, m) {
  let groupMetadata = {}
  let participants = []
  let user = {}
  let bot = {}
  let isRAdmin = false
  let isAdmin = false
  let isBotAdmin = false

  if (!m.isGroup) {
    return { groupMetadata, participants, user, bot, isRAdmin, isAdmin, isBotAdmin }
  }

  const now = Date.now()
  const lastActive = activityTracker.get(m.chat) || 0
  const timeDiff = now - lastActive
  const cached = metadataCache.get(m.chat)

  if (cached) {
    groupMetadata = cached.metadata || {}
    participants = cached.participants || []
    if (timeDiff < 30000) metadataCache.ttl(m.chat, 180)
  } else {
    groupMetadata =
      ((conn.chats?.[m.chat] || {}).metadata || (await conn.groupMetadata(m.chat).catch(() => null))) || {}
    participants = groupMetadata.participants || []
    metadataCache.set(m.chat, { metadata: groupMetadata, participants })
  }

  activityTracker.set(m.chat, now)

  const useLid = groupMetadata.addressingMode === 'lid'
  const norm = id => conn.decodeJid(id || '')
  const getNumber = jid => (jid || '').split('@')[0]

  const senderNum = getNumber(m.sender)
  const botJid = norm(conn.user?.id)
  const botNum = getNumber(botJid)

  if (useLid) {
    user = participants.find(p => getNumber(p.jid) === senderNum || getNumber(p.lid) === senderNum) || {}
    bot = participants.find(p => getNumber(p.jid) === botNum || getNumber(p.lid) === botNum) || {}
  } else {
    user = participants.find(p => norm(p.id || p.jid) === norm(m.sender)) || {}
    bot = participants.find(p => norm(p.id || p.jid) === botJid) || {}
  }

  isRAdmin = typeof user.admin === 'string' && user.admin.toLowerCase() === 'superadmin'
  isAdmin = isRAdmin || (typeof user.admin === 'string' && user.admin.toLowerCase() === 'admin')
  isBotAdmin = typeof bot.admin === 'string' && ['admin', 'superadmin'].includes(bot.admin?.toLowerCase())

  return { groupMetadata, participants, user, bot, isRAdmin, isAdmin, isBotAdmin }
}

function updateStats(m) {
  if (!global.db?.data?.stats) return
  if (!m?.plugin) return

  const stats = global.db.data.stats
  const now = Date.now()

  if (!stats[m.plugin]) {
    stats[m.plugin] = { total: 0, success: 0, last: 0, lastSuccess: 0 }
  }
  const s = stats[m.plugin]
  s.total = (s.total || 0) + 1
  s.last = now
  if (!m.error) {
    s.success = (s.success || 0) + 1
    s.lastSuccess = now
  }
}

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  if (!chatUpdate?.messages?.length) return

  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  if (global.db.data == null) await global.loadDatabase()
  ensureDB()

  try {
    m = smsg(this, m) || m
    if (!m || m.isBaileys) return

    const botJid = normJid(this, this.user?.jid || this.user?.id)
    const settings = ensureSettings(global.db, botJid)

    // public/self mode
    if (!settings.public && !m.fromMe) return
    if (settings.self && !m.fromMe) return

    // db init minimal
    const userDb = ensureUser(global.db, m.sender, m.name)
    ensureChat(global.db, m.chat)

    // update counters
    userDb.chat++
    userDb.chatTotal++
    userDb.lastseen = Date.now()

    // roles
    const { ownersDev, owners } = getOwners()
    const me = normJid(this, this.user?.id)
    const sender = normJid(this, m.sender)

    const isMods = ownersDev.includes(sender)
    const isOwner = isMods || owners.includes(sender) || m.fromMe || sender === me
    const isPrems = isOwner || userDb.premium || (userDb.premiumTime > 0)

    // group info (for admin/botAdmin gate)
    const gc = await getGroupContext(this, m)

    const __dirnamePlugins = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

    for (let name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue

      const __filename = join(__dirnamePlugins, name)

      // plugin.all
      if (typeof plugin.all === 'function') {
        try {
          await plugin.all.call(this, m, { chatUpdate, __dirname: __dirnamePlugins, __filename })
        } catch (e) {
          console.error(e)
        }
      }

      // PREFIX handling per-plugin (customPrefix / conn.prefix / default)
      const { match, usedPrefix } = getPrefixMatch(this, plugin, m.text || '')
      if (!usedPrefix) continue

      const noPrefix = (m.text || '').replace(usedPrefix, '')
      const [commandRaw, ...args] = noPrefix.trim().split(/\s+/).filter(Boolean)
      const command = (commandRaw || '').toLowerCase()
      const text = args.join(' ')

      // command match
      const ok =
        plugin.command instanceof RegExp ? plugin.command.test(command) :
        Array.isArray(plugin.command) ? plugin.command.some(c => c instanceof RegExp ? c.test(command) : c === command) :
        typeof plugin.command === 'string' ? plugin.command === command :
        false
      if (!ok) continue

      // plugin.before
      if (typeof plugin.before === 'function') {
        const skip = await plugin.before.call(this, m, {
          match,
          conn: this,
          chatUpdate,
          __dirname: __dirnamePlugins,
          __filename,
          participants: gc.participants,
          groupMetadata: gc.groupMetadata,
          user: gc.user,
          bot: gc.bot,
          isMods,
          isOwner,
          isAdmin: gc.isAdmin,
          isBotAdmin: gc.isBotAdmin,
          isRAdmin: gc.isRAdmin,
          isPrems
        })
        if (skip) continue
      }

      m.plugin = name
      const fail = plugin.fail || global.dfail

      // basic gates (no RPG/game/nsfw)
      if (plugin.mods && !isMods) return fail?.('mods', m, this)
      if (plugin.owner && !isOwner) return fail?.('owner', m, this)
      if (plugin.premium && !isPrems) return fail?.('premium', m, this)
      if (plugin.group && !m.isGroup) return fail?.('group', m, this)
      if (plugin.private && m.isGroup) return fail?.('private', m, this)
      if (plugin.register && !userDb.registered) return fail?.('unreg', m, this)
      if (plugin.admin && !gc.isAdmin) return fail?.('admin', m, this)
      if (plugin.botAdmin && !gc.isBotAdmin) return fail?.('botAdmin', m, this)

      const extra = {
        match,
        usedPrefix,
        noPrefix,
        args,
        command,
        text,
        conn: this,
        chatUpdate,
        __dirname: __dirnamePlugins,
        __filename,
        isMods,
        isOwner,
        isPrems,
        participants: gc.participants,
        groupMetadata: gc.groupMetadata,
        user: gc.user,
        bot: gc.bot,
        isRAdmin: gc.isRAdmin,
        isAdmin: gc.isAdmin,
        isBotAdmin: gc.isBotAdmin,
        userDb
      }

      try {
        await plugin.call(this, m, extra)
      } catch (e) {
        m.error = e
        console.error(e)

        if (settings.noerror) {
          m.reply?.(global.config?.errorMsg || 'Error')
        } else {
          let msg = format(e)
          for (let k of Object.values(global.config?.APIKeys || {})) {
            msg = msg.replace(new RegExp(k, 'g'), '#HIDDEN#')
          }
          m.reply?.(msg)
        }
      } finally {
        if (typeof plugin.after === 'function') {
          try {
            await plugin.after.call(this, m, extra)
          } catch (e) {
            console.error(e)
          }
        }
        updateStats(m)
      }

      break
    }
  } catch (e) {
    console.error(e)
  } finally {
    try {
      if (!global.opts?.noprint) printMessage(m, this).catch(() => {})
    } catch {}
    try {
      await global.db.write().catch(() => {})
    } catch {}
  }
}

// dibuat kosong biar ringan
export async function participantsUpdate() { return }
export async function deleteUpdate() { return }

global.dfail = (type, m) => {
  const msg = {
    owner: '*[❗]* Command ini khusus owner!',
    mods: '*[❗]* Command ini khusus moderator!',
    premium: '*[❗]* Command ini khusus premium!',
    group: '*[❗]* Command ini hanya bisa dipakai di grup!',
    private: '*[❗]* Command ini hanya bisa dipakai di private chat!',
    admin: '*[❗]* Command ini hanya bisa dipakai admin!',
    botAdmin: '*[❗]* Bot harus jadi admin dulu!',
    unreg: 'Kamu belum daftar. Ketik: .daftar'
  }[type]
  if (msg) m.reply?.(msg)
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})