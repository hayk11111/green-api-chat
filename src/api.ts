export type Credentials = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type SenderData = {
  chatId: string
  chatName?: string
  senderName?: string
}

export type MessageData = {
  typeMessage: string
  textMessageData?: { textMessage: string }
}

export type NotificationBody = {
  typeWebhook: string
  idMessage?: string
  timestamp?: number
  senderData?: SenderData
  messageData?: MessageData
}

export type Notification = {
  receiptId: number
  body: NotificationBody
}

const RECEIVE_TIMEOUT_SECONDS = 20

export async function getStateInstance(credentials: Credentials, signal?: AbortSignal) {
  const state = await call<{ stateInstance: string }>(url(credentials, 'getStateInstance'), { method: 'GET' }, signal)
  return state?.stateInstance ?? ''
}

export async function checkAccount(credentials: Credentials, phoneNumber: number, signal?: AbortSignal) {
  return call<{ exist: boolean; chatId: string }>(
    url(credentials, 'checkAccount'),
    { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ phoneNumber }) },
    signal,
  )
}

export async function sendMessage(credentials: Credentials, chatId: string, message: string, signal?: AbortSignal) {
  const sent = await call<{ idMessage: string }>(
    url(credentials, 'sendMessage'),
    { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ chatId, message }) },
    signal,
  )
  return sent?.idMessage ?? ''
}

export function receiveNotification(credentials: Credentials, signal?: AbortSignal) {
  const endpoint = `${url(credentials, 'receiveNotification')}?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`
  return call<Notification>(endpoint, { method: 'GET' }, signal)
}

export function deleteNotification(credentials: Credentials, receiptId: number, signal?: AbortSignal) {
  return call<{ result: boolean }>(url(credentials, 'deleteNotification', `/${receiptId}`), { method: 'DELETE' }, signal)
}

const jsonHeaders = { 'Content-Type': 'application/json' }

function url(credentials: Credentials, method: string, tail = '') {
  const host = credentials.apiUrl.trim().replace(/\/+$/, '')
  return `${host}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${tail}`
}

async function call<T>(endpoint: string, init: RequestInit, signal?: AbortSignal): Promise<T | null> {
  let response: Response
  try {
    response = await fetch(endpoint, { ...init, signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Не удалось связаться с GREEN-API. Проверьте адрес API и подключение к сети.')
  }

  const text = await response.text()
  if (!response.ok) throw new Error(describeFailure(response.status, text))
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('GREEN-API вернул ответ в неожиданном формате.')
  }
}

function describeFailure(status: number, text: string) {
  const reason = extractReason(text)
  switch (status) {
    case 400:
      return reason ?? 'Запрос отклонён: проверьте номер телефона и текст сообщения.'
    case 401:
      return 'Неверный apiTokenInstance.'
    case 403:
      return reason ?? 'Доступ запрещён: проверьте idInstance и адрес API.'
    case 429:
      return 'Превышен лимит запросов к GREEN-API. Повторите попытку позже.'
    case 466:
      return 'Исчерпана квота инстанса на текущем тарифе.'
    default:
      return reason ?? `GREEN-API вернул ошибку ${status}.`
  }
}

function extractReason(text: string) {
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as { message?: string; reason?: string }
    return parsed.message ?? parsed.reason ?? null
  } catch {
    return text.slice(0, 200)
  }
}
