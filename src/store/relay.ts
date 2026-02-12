import {create} from 'zustand'
import {useAuthStore} from './auth'

type RelayStatus = 'connecting' | 'connected' | 'disconnected'

interface RelayState {
	status: RelayStatus
	socket: WebSocket | null
	connect: () => void
	disconnect: () => void
}

const MAX_FAILURES = 5
const MAX_BACKOFF_MS = 30_000

let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let failures = 0

export const useRelayStore = create<RelayState>()(
	(set, get) => ({
		status: 'disconnected',
		socket: null,

		connect: () => {
			// prevent duplicate connections
			const current = get().socket
			if (current && current.readyState <= WebSocket.OPEN) return

			const relayUrl = import.meta.env.VITE_WSS_URL
			if (!relayUrl) return

			const token = useAuthStore.getState().accessToken
			if (!token) return

			set({status: 'connecting'})

			const ws = new WebSocket(`${relayUrl}?clientType=sync`)

			ws.onopen = () => {
				// send auth as first message
				ws.send(JSON.stringify({type: 'auth', payload: {token}}))
				failures = 0
				set({status: 'connected', socket: ws})
			}

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data)
					if (message.type === 'update-available') {
						import('@tauri-apps/plugin-updater').then(async ({check}) => {
							const update = await check()
							if (update) {
								const {relaunch} = await import('@tauri-apps/plugin-process')
								await update.downloadAndInstall()
								await relaunch()
							}
						}).catch(() => {})
					}
				} catch {
					// ignore non-JSON messages
				}
			}

			ws.onclose = () => {
				set({status: failures < MAX_FAILURES ? 'connecting' : 'disconnected', socket: null})
				scheduleReconnect(get().connect)
			}

			ws.onerror = () => {
				// onclose will fire after onerror, so reconnect is handled there
			}
		},

		disconnect: () => {
			if (reconnectTimer) {
				clearTimeout(reconnectTimer)
				reconnectTimer = null
			}
			failures = 0
			const ws = get().socket
			if (ws) ws.close()
			set({status: 'disconnected', socket: null})
		}
	})
)

function scheduleReconnect(connect: () => void) {
	if (reconnectTimer) clearTimeout(reconnectTimer)
	failures++
	const delay = Math.min(1000 * Math.pow(2, failures - 1), MAX_BACKOFF_MS)
	reconnectTimer = setTimeout(connect, delay)
}

export const reset = () => {
	useRelayStore.getState().disconnect()
	useRelayStore.setState({status: 'disconnected', socket: null})
}
