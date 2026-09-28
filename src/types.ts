export type Chat = {
  id: string
  title: string
}

export type Message = {
  id: string
  chatId: string
  text: string
  outgoing: boolean
  timestamp: number
}
