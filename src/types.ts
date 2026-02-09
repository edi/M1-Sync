export interface Station {
	id: number
	name: string
}

export interface AuthState {
	id: number | null
	name: string | null
	email: string | null
	orgId: number | null
	loader: boolean
	accessToken: string | null
	showLoader: (status: boolean) => void
	setToken: (accessToken: string | null) => void
}

export interface StationsState {
	list: Station[]
	paths: string[]
	loading: boolean
	syncing: boolean
	selectedStationId: number | null
	initialize: (list: Station[]) => void
	setPaths: (paths: string[]) => void
	setStations: (stations: Station[]) => void
	selectStation: (stationId: number) => void
	getSelectedStation: () => Station | null
}

export interface LoginResponse {
	id: number
	name: string
	email: string
	orgId: number
	accessToken: string
	error?: string
}

export interface SessionCodeResponse {
	sessionCode: string
}

export interface StationsListResponse {
	list: Station[]
	error?: string
}

export interface SyncPathsResponse {
	paths?: string[]
	error?: string
}

export interface ToggleProps {
	enabled: boolean
	disabled?: boolean
	onChange?: () => void
	label: string
	description: string
}
