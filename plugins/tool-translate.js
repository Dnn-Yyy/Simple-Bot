// © Vyzen Aveline

import axios from 'axios'

const LANG_LIST = {
  af: 'Afrikaans',
  sq: 'Albanian',
  ar: 'Arabic',
  hy: 'Armenian',
  az: 'Azerbaijani',
  eu: 'Basque',
  bn: 'Bengali',
  bs: 'Bosnian',
  bg: 'Bulgarian',
  ca: 'Catalan',
  zh: 'Chinese',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  de: 'German',
  el: 'Greek',
  gu: 'Gujarati',
  he: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  jw: 'Javanese',
  kn: 'Kannada',
  km: 'Khmer',
  ko: 'Korean',
  lo: 'Lao',
  la: 'Latin',
  lv: 'Latvian',
  lt: 'Lithuanian',
  ms: 'Malay',
  ml: 'Malayalam',
  mr: 'Marathi',
  my: 'Myanmar',
  ne: 'Nepali',
  no: 'Norwegian',
  fa: 'Persian',
  pl: 'Polish',
  pt: 'Portuguese',
  pa: 'Punjabi',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  es: 'Spanish',
  su: 'Sundanese',
  sw: 'Swahili',
  sv: 'Swedish',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese'
}

const handler = async (m, { args }) => {
  let to = 'id'
  let text = ''

  if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    const q = m.message.extendedTextMessage.contextInfo.quotedMessage
    text =
      q.conversation ||
      q.extendedTextMessage?.text ||
      ''
  }

  if (!text) {
    text = args.join(' ')
  }

  if (!text) {
    return m.reply(
      '🌍 *Translate*\n\n' +
      'Contoh:\n' +
      '.tr hello world\n' +
      '.tr en selamat pagi\n\n' +
      'Atau reply pesan lalu ketik:\n.tr en'
    )
  }

  if (args[0] && LANG_LIST[args[0]]) {
    to = args[0]
    text = args.slice(1).join(' ') || text
  }

  try {
    const res = await axios.get(
      'https://translate.googleapis.com/translate_a/single',
      {
        params: {
          client: 'gtx',
          sl: 'auto',
          tl: to,
          dt: 't',
          q: text
        }
      }
    )

    const result = res.data[0].map(v => v[0]).join('')
    const from = res.data[2]

    await m.reply(
      `🌍 *TRANSLATE*\n\n` +
      `🗣️ Dari: ${LANG_LIST[from] || from}\n` +
      `📘 Ke: ${LANG_LIST[to]}\n\n` +
      `${result}`
    )
  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal translate')
  }
}

handler.command = ['tr', 'translate']
handler.tags = ['tools']
handler.help = ['tr <text>', 'tr en <text>', 'reply + tr']

export default handler