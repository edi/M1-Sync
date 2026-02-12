export interface Station {
	id: number
	name: string
	exportPath: string | null
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
	loading: boolean
	selectedStationId: number | null
	initialize: (list: Station[]) => void
	setStations: (stations: Station[]) => void
	selectStation: (stationId: number) => void
	setExportPath: (stationId: number, exportPath: string | null) => void
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

export interface StationPreferencesResponse {
	success?: boolean
	error?: string
}

export interface ExportEvent {
	path: string
	directory: string | null
	files: { filename: string; content: string }[]
	stationId: number
}

export interface ToggleProps {
	enabled: boolean
	disabled?: boolean
	onChange?: () => void
	label: string
	description: string
}
