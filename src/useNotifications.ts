import { useEffect, useRef, useState } from 'react'
import type { Credentials, NotificationBody } from './api'
import { deleteNotification, receiveNotification } from './api'

const RETRY_DELAY_MS = 5000

export function useNotifications(credentials: Credentials | null, onNotification: (body: NotificationBody) => void) {
  const [error, setError] = useState<string | null>(null)
  const handler = useRef(onNotification)
  handler.current = onNotification

  useEffect(() => {
    if (!credentials) return

    const controller = new AbortController()
    const { signal } = controller

    const poll = async () => {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(credentials, signal)
          setError(null)
          if (!notification) continue

          handler.current(notification.body)
          await deleteNotification(credentials, notification.receiptId, signal)
        } catch (error) {
          if (signal.aborted) return
          setError(error instanceof Error ? error.message : 'Не удалось получить входящие уведомления.')
          await delay(RETRY_DELAY_MS, signal)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [credentials])

  return error
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(finish, ms)
    signal.addEventListener('abort', finish, { once: true })

    function finish() {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
  })
}
