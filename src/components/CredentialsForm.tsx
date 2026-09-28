import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Credentials } from '../api'
import { getStateInstance } from '../api'
import { DEFAULT_API_URL } from '../session'

const stateHints: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API.',
  starting: 'Инстанс запускается. Подождите около минуты и попробуйте снова.',
  blocked: 'Аккаунт MAX заблокирован. Потребуется повторная авторизация инстанса.',
  suspended: 'На аккаунте действуют временные ограничения на отправку сообщений.',
  pendingPassword: 'Инстанс ожидает пароль двухфакторной аутентификации.',
}

export function CredentialsForm({ onReady }: { onReady: (credentials: Credentials) => void }) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const credentials = {
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    setChecking(true)
    setError(null)
    try {
      const state = await getStateInstance(credentials)
      if (state === 'authorized') {
        onReady(credentials)
        return
      }
      setError(stateHints[state] ?? `Инстанс находится в состоянии «${state}».`)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось проверить инстанс.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <form className="card credentials" onSubmit={submit}>
      <h1>MAX через GREEN-API</h1>
      <p className="subtitle">Введите параметры инстанса из личного кабинета GREEN-API.</p>

      <label>
        apiUrl
        <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} spellCheck={false} />
      </label>

      <label>
        idInstance
        <input
          value={idInstance}
          onChange={(event) => setIdInstance(event.target.value)}
          placeholder="1101000001"
          inputMode="numeric"
          required
        />
      </label>

      <label>
        apiTokenInstance
        <input
          value={apiTokenInstance}
          onChange={(event) => setApiTokenInstance(event.target.value)}
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={checking}>
        {checking ? 'Проверяем инстанс…' : 'Подключиться'}
      </button>

      <p className="hint">
        Данные хранятся только в sessionStorage этой вкладки. Для приёма сообщений в настройках инстанса должен быть
        пустой webhookUrl.
      </p>
    </form>
  )
}
