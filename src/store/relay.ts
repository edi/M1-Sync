import {create} from 'zustand'
import {useAuthStore} from './auth'
import {useStationsStore} from './stations'
import {exists, mkdir, readFile, writeTextFile} from '@tauri-apps/plugin-fs'
import {join} from '@tauri-apps/api/path'
import type {ExportEvent} from '@/types'

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

					if (message.type === 'request' && message.requestId) {
						handleRequest(ws, message).catch(() => {
							ws.send(JSON.stringify({
								type: 'response',
								requestId: message.requestId,
								payload: {error: 'request_handler_failed'}
							}))
						})
						return
					}

					if (message.type !== 'event') return

					if (message.event === 'update-available') {
						import('@tauri-apps/plugin-updater').then(async ({check}) => {
							const update = await check()
							if (update) {
								const {relaunch} = await import('@tauri-apps/plugin-process')
								await update.downloadAndInstall()
								await relaunch()
							}
						}).catch(() => {})
					}

					if (message.event === 'export-schedule') {
						handleExport(message.payload as ExportEvent).catch(() => {})
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

// ~3MB raw → ~4MB base64 per chunk, well within WS limits
const STREAM_CHUNK_SIZE = 3 * 1024 * 1024

async function handleRequest(ws: WebSocket, message: {requestId: string, event: string, payload: unknown}) {
	const {requestId, event, payload} = message

	if (event === 'stream:audio') {
		const {path} = payload as {path: string}
		if (!path) {
			ws.send(JSON.stringify({type: 'response', requestId, payload: {error: 'missing_path'}}))
			return
		}

		const fileExists = await exists(path)
		if (!fileExists) {
			ws.send(JSON.stringify({type: 'response', requestId, payload: {error: 'file_not_found'}}))
			return
		}

		const bytes = await readFile(path)
		const ext = path.split('.').pop()?.toLowerCase()
		const mime = ext === 'wav' ? 'audio/wav' : 'audio/mpeg'

		// send only the first chunk (limit to 1 chunk for now)
		const end = Math.min(STREAM_CHUNK_SIZE, bytes.length)
		const data = uint8ArrayToBase64(bytes.subarray(0, end))

		ws.send(JSON.stringify({
			type: 'response',
			requestId,
			payload: {data, mime, index: 0, total: 1, streaming: false}
		}))
		return
	}

	ws.send(JSON.stringify({type: 'response', requestId, payload: {error: 'unknown_request_event'}}))
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
	const chunkSize = 0x8000
	let binary = ''
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize)
		binary += String.fromCharCode(...chunk)
	}
	return btoa(binary)
}

async function handleExport(payload: ExportEvent) {
	const station = useStationsStore.getState().list.find(s => s.id === payload.stationId)
	if (!station?.exportPath) return

	const basePath = station.exportPath

	const pathExists = await exists(basePath)
	if (!pathExists) return

	let target = basePath
	if (payload.directory) {
		target = await join(basePath, payload.directory)
		await mkdir(target, {recursive: true})
	}

	for (const file of payload.files) {
		await writeTextFile(await join(target, file.filename), file.content)
	}
}

export const reset = () => {
	useRelayStore.getState().disconnect()
	useRelayStore.setState({status: 'disconnected', socket: null})
}
