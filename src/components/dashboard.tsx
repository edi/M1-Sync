import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom'
import {fetch as fetchStations} from '@/lib/stations'
import {useStationsStore} from '@/store/stations'
import {useRelayStore} from '@/store/relay'
import {cn, APP_TITLE} from '@/lib/utils'
import {signOut} from '@/lib/auth'
import {useEffect} from 'react'
import logo from '/icon.svg'

import {
	LogOut,
	Settings,
	RefreshCw,
	RadioTower,
	LoaderCircle,
} from 'lucide-react'

const badgeConfig = {
	connected: {color: 'bg-green-500', label: 'Connected'},
	connecting: {color: 'bg-orange-400 animate-pulse', label: 'Connecting...'},
	disconnected: {color: 'bg-red-500', label: 'Disconnected'},
} as const

function RelayBadge() {
	const status = useRelayStore(state => state.status)
	const {color} = badgeConfig[status]

	return (
		<button
			className={cn('absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-gray-200', color, status === 'disconnected' && 'cursor-pointer')}
			onClick={() => status === 'disconnected' && useRelayStore.getState().connect()}
		/>
	)
}

function RelayLabel() {
	const status = useRelayStore(state => state.status)
	const {label} = badgeConfig[status]

	return (
		<p
			className={cn('text-sm overflow-hidden text-ellipsis whitespace-nowrap', status === 'disconnected' ? 'text-red-500 cursor-pointer' : 'text-gray-500')}
			onClick={() => status === 'disconnected' && useRelayStore.getState().connect()}
		>
			{label}
		</p>
	)
}

export default function Dashboard() {

	const navigate = useNavigate()
	const location = useLocation()

	const {loading} = useStationsStore(state => state)
	const selectedStationId = useStationsStore(state => state.selectedStationId)

	// connect to relay when station is selected, reconnect on station change
	useEffect(() => {
		if (!selectedStationId) return
		useRelayStore.getState().disconnect()
		useRelayStore.getState().connect()
		return () => useRelayStore.getState().disconnect()
	}, [selectedStationId])

	return (
		<div className="flex h-full">

			{/* SIDEBAR */}
			<div className="flex w-[240px] flex-col gap-y-5 bg-gray-200 p-4">

				<div className="flex items-center space-x-4" id="drag-region">
					<div className="relative">
						<img alt="" className="h-10 w-auto" src={logo} />
						<RelayBadge />
					</div>
					<div className="min-w-0">
						<h2 className="text-md font-bold tracking-tight text-gray-900">
							{APP_TITLE.split(' ')[1]}
						</h2>
						<RelayLabel />
					</div>
				</div>

				<nav className="flex flex-1 flex-col space-y-2">

					<NavLink to="/stations" className={({isActive}) => cn('group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-7 transition-colors', (isActive || location.pathname === '/' || location.pathname === '/connect') ? 'bg-gray-300 text-gray-700' : 'text-gray-600 hover:bg-gray-300')}>
						<RadioTower className="size-5" /> Stations
						<div className="grow"></div>
						<button className="bg-blue-400/30 text-blue-600 px-2 rounded-md self-stretch cursor-pointer hover:bg-blue/40 hover:scale-110 disabled:bg-gray-400/30 disabled:text-gray-500 transition-all" onClick={fetchStations} disabled={loading}>
							{loading
								? <LoaderCircle className="size-4 animate-spin" />
								: <RefreshCw className="size-4" />
							}
						</button>
					</NavLink>
					<NavLink to="/preferences" className={({isActive}) => cn('group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors', isActive ? 'bg-gray-300 text-gray-700' : 'text-gray-600 hover:bg-gray-300')}>
						<Settings className="size-5" /> Preferences
					</NavLink>

					<div className="grow" />

					<button onClick={() => signOut(navigate)} className="group flex items-center gap-x-3 font-medium rounded-md p-2 text-sm leading-6 text-red-500 bg-red-400/10 hover:bg-red-400/20 transition-colors">
						<LogOut className="size-5" />
						Sign Out
					</button>

				</nav>
			</div>

			{/* CONTENT */}
			<Outlet />

		</div>

	)

}