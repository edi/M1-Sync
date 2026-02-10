import Toggle from '@/components/ui/toggle'
import {RefreshCcwDot, Download, Check} from 'lucide-react'
import {useState, useEffect} from 'react'
import {getVersion} from '@tauri-apps/api/app'
import {enable, disable, isEnabled} from '@tauri-apps/plugin-autostart'
import {check} from '@tauri-apps/plugin-updater'
import {relaunch} from '@tauri-apps/plugin-process'
import {load} from '@tauri-apps/plugin-store'
import {toast} from 'sonner'

type UpdateStatus = 'idle' | 'checking' | 'downloading' | 'up-to-date' | 'error'

interface PreferencesState {
	autoStartup: boolean
	autoUpdate: boolean
	appVersion: string | null
	updateStatus: UpdateStatus
}

const getStore = () => load('settings.json', {autoSave: true, defaults: {}})

export default function Preferences() {

	const [state, changeState] = useState<PreferencesState>({
		autoStartup: false,
		autoUpdate: true,
		appVersion: null,
		updateStatus: 'idle'
	})

	const setState = (data: Partial<PreferencesState>) => changeState(prevState => ({...prevState, ...data}))

	useEffect(() => {

		const init = async () => {
			const store = await getStore()
			const [appVersion, autoStartup, autoUpdate] = await Promise.all([
				getVersion(),
				isEnabled(),
				store.get<boolean>('autoUpdate')
			])
			setState({
				appVersion,
				autoStartup,
				autoUpdate: autoUpdate ?? true
			})

			// silent auto-check on mount if enabled
			if (autoUpdate !== false) {
				try {
					const update = await check()
					if (update) {
						toast.info(`Update v${update.version} available, downloading...`)
						await update.downloadAndInstall()
						await relaunch()
					}
				} catch {
					// silent fail for auto-check
				}
			}
		}

		init()

	}, [])

	const onToggleAutostart = async () => {
		if (state.autoStartup) {
			await disable()
		} else {
			await enable()
		}
		setState({autoStartup: await isEnabled()})
	}

	const onToggleAutoUpdate = async () => {
		const newValue = !state.autoUpdate
		const store = await getStore()
		await store.set('autoUpdate', newValue)
		setState({autoUpdate: newValue})
	}

	const onCheckForUpdates = async () => {

		if (state.updateStatus === 'checking' || state.updateStatus === 'downloading')
			return false

		setState({updateStatus: 'checking'})

		try {
			const update = await check()
			if (update) {
				setState({updateStatus: 'downloading'})
				await update.downloadAndInstall((event) => {
					if (event.event === 'Finished') {
						toast.success('Update downloaded, restarting...')
					}
				})
				await relaunch()
			} else {
				setState({updateStatus: 'up-to-date'})
				toast.info('No updates available')
				setTimeout(() => setState({updateStatus: 'idle'}), 3000)
			}
		} catch {
			setState({updateStatus: 'error'})
			toast.error('Error checking for updates')
			setTimeout(() => setState({updateStatus: 'idle'}), 3000)
		}

	}

	const updateButtonLabel = () => {
		switch (state.updateStatus) {
			case 'checking': return 'Checking...'
			case 'downloading': return 'Downloading...'
			case 'up-to-date': return 'Up to date'
			case 'error': return 'Error'
			default: return 'Check for updates'
		}
	}

	const updateButtonIcon = () => {
		switch (state.updateStatus) {
			case 'checking': return <RefreshCcwDot className="w-4 h-4 animate-spin" />
			case 'downloading': return <Download className="w-4 h-4 animate-pulse" />
			case 'up-to-date': return <Check className="w-4 h-4 text-green-600" />
			default: return null
		}
	}

	return (
		<div className="p-4 bg-gray-100 grow">

			<div className="bg-white rounded-lg shadow-xs border border-gray-200">

				<div className="p-6 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div className="">
							<h3 className="text-xl font-medium text-gray-900">Preferences</h3>
							<p className="text-sm text-gray-500 mt-1">Configure the appplication settings</p>
						</div>
					</div>
				</div>

				<div className="p-6 space-y-6">

					{/* OPEN ON STARTUP */}
					<Toggle
						label="Start on login"
						enabled={state.autoStartup}
						onChange={onToggleAutostart}
						description="Automatically start the app when you log in"
					/>

					{/* AUTO UPDATES */}
					<Toggle
						label="Automatic updates"
						enabled={state.autoUpdate}
						onChange={onToggleAutoUpdate}
						description="Keep the app up to date by installing all updates automatically"
					/>

					{/* UPDATES */}
					<div className="flex items-center justify-between pt-6 border-t border-gray-200">
						<div>
							<h4 className="text-sm font-medium text-gray-900">App information</h4>
							<p className="text-sm text-gray-500">{state.appVersion ? `v${state.appVersion}` : 'loading ...'}</p>
						</div>
						<button
							disabled={state.updateStatus === 'checking' || state.updateStatus === 'downloading'}
							onClick={onCheckForUpdates}
							className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-100 focus:ring-offset-2 disabled:opacity-75 disabled:pointer-events-none"
						>
							{updateButtonIcon()}
							{updateButtonLabel()}
						</button>
					</div>

				</div>
			</div>

		</div>
	)
}
