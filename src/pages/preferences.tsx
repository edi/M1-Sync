import Toggle from '@/components/ui/toggle'
import {RefreshCcwDot} from 'lucide-react'
import {useState, useEffect} from 'react'

export default function Preferences() {

	const [state, changeState] = useState({
		autoStartup: false,
		autoUpdate: true,
		appVersion: null,
		isChecking: false
	})

	const setState = data => changeState(prevState => ({...prevState, ...data}))

	useEffect(() => {

		const init = async () => {
			const preferences = await window.api.getPreferences()
			setState(preferences)
		}

		init()

	}, [])

	const onCheckForUpdates = async () => {

		if (state.isChecking)
			return false

		setState({isChecking: true})

		try {
			window.api.checkForUpdates()
		} catch (error) {
			// do nothing
		}

		setTimeout(() => {
			setState({isChecking: false})
		}, 1500)

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
						onChange={() => setState({autoStartup: !state.autoStartup})}
						description="Automatically start the app when you log in"
					/>

					{/* AUTO UPDATES */}
					<Toggle
						disabled={true}
						label="Automatic updates"
						enabled={state.autoUpdate}
						description="Keep the app up to date by installing all updates automatically"
					/>

					{/* UPDATES */}
					<div className="flex items-center justify-between pt-6 border-t border-gray-200">
						<div>
							<h4 className="text-sm font-medium text-gray-900">App information</h4>
							<p className="text-sm text-gray-500">{state.appVersion ? `v${state.appVersion}` : 'loading ...'}</p>
						</div>
						<button
							disabled={state.isChecking}
							onClick={onCheckForUpdates}
							className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-100 focus:ring-offset-2 disabled:opacity-75 disabled:pointer-events-none"
						>
							{state.isChecking && <RefreshCcwDot className="w-4 h-4 animate-spin" />}
							{state.isChecking ? 'Checking' : 'Check for updates'}
						</button>
					</div>

				</div>
			</div>

		</div>
	)
}