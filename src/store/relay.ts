import {exists, mkdir, readFile, writeTextFile} from '@tauri-apps/plugin-fs'
import {fetch as fetchStations} from '@/lib/stations'
import {relaunch} from '@tauri-apps/plugin-process'
import {check} from '@tauri-apps/plugin-updater'
import {useStationsStore} from './stations'
import {join} from '@tauri-apps/api/path'
import type {ExportEvent} from '@/types'
import {useAuthStore} from './auth'
import {create} from 'zustand'
import {toast} from 'sonner'

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

					if (message.event === 'download-update') {

						toast.promise(
							(async () => {
								const update = await check()

								if (update) {
									await update.downloadAndInstall()
									await relaunch()
								}

								return update
							})(),
							{
								loading: 'checking for updates...',
								success: (update) => update ? 'update found, downloading...' : 'no update available',
								error: 'update check failed',
							}
						)

					} else if (message.event === 'refresh-stations') {
						fetchStations()
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

// ~3MB raw per chunk, well within WS limits
const STREAM_CHUNK_SIZE = 3 * 1024 * 1024

const MIME_MAP: Record<string, string> = {
	wav: 'audio/wav',
	bwf: 'audio/wav',
	ogg: 'audio/ogg',
	flac: 'audio/flac',
	mp3: 'audio/mpeg',
}

async function handleRequest(ws: WebSocket, message: {requestId: string, event: string, payload: unknown}) {
	const {requestId, event, payload} = message

	if (event === 'stream:audio') {

		const {path, chunkSize} = payload as {path: string, chunkSize?: number}

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
		const ext = path.split('.').pop()?.toLowerCase() ?? ''
		const mime = MIME_MAP[ext] ?? 'audio/mpeg'

		// send as binary frame: [4-byte header length][JSON header][raw audio]
		const end = Math.min(chunkSize ?? STREAM_CHUNK_SIZE, bytes.length)
		const audioData = bytes.subarray(0, end)

		const header = JSON.stringify({requestId, mime, index: 0, total: 1, streaming: false})
		const headerBytes = new TextEncoder().encode(header)

		const frame = new Uint8Array(4 + headerBytes.byteLength + audioData.byteLength)
		new DataView(frame.buffer).setUint32(0, headerBytes.byteLength, false)
		frame.set(headerBytes, 4)
		frame.set(audioData, 4 + headerBytes.byteLength)

		ws.send(frame.buffer)

		return

	}

	if (event === 'export-schedule') {
		await handleExport(payload as ExportEvent)
		ws.send(JSON.stringify({type: 'response', requestId, payload: {success: true}}))
		return
	}

	ws.send(JSON.stringify({
		type: 'response',
		requestId,
		payload: {
			error: 'unknown_request_event'
		}
	}))

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
