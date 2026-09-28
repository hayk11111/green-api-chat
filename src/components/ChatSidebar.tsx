import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Credentials } from '../api'
import { checkAccount } from '../api'
import type { Chat } from '../types'

type Props = {
  credentials: Credentials
  chats: Chat[]
  activeChatId: string | null
  onSelect: (chatId: string) => void
  onCreate: (chat: Chat) => void
  onLogout: () => void
}

export function ChatSidebar({ credentials, chats, activeChatId, onSelect, onCreate, onLogout }: Props) {
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChat = async (event: FormEvent) => {
    event.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 11 || digits.length > 12) {
      setError('Номер указывается в международном формате: 11 или 12 цифр.')
      return
    }

    setPending(true)
    setError(null)
    try {
      const account = await checkAccount(credentials, Number(digits))
      if (!account?.exist) {
        setError('На этом номере нет аккаунта MAX.')
        return
      }
      onCreate({ id: account.chatId, title: `+${digits}` })
      setPhone('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось проверить номер.')
    } finally {
      setPending(false)
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <span>Чаты</span>
        <button type="button" className="link" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <form className="new-chat" onSubmit={createChat}>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Телефон"
          inputMode="tel"
        />
        <button type="submit" disabled={pending}>
          {pending ? '…' : 'Создать'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="chat-list">
        {chats.map((chat) => (
          <li key={chat.id}>
            <button
              type="button"
              className={chat.id === activeChatId ? 'chat-item active' : 'chat-item'}
              onClick={() => onSelect(chat.id)}
            >
              <span className="avatar">{initial(chat.title)}</span>
              <span className="chat-title">{chat.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function initial(title: string) {
  return title.replace(/^\+/, '').charAt(0).toUpperCase()
}
