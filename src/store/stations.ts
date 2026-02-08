import {create} from 'zustand'

const initialState = {
	list: [],
	paths: [],
	loading: true,
	syncing: false,
	selectedStationId: null
}

export const useStationsStore = create(
	(set, get) => ({

		...initialState,

		initialize: (list) => {

			// Safely access localStorage only in browser environment
			let stationId = null;

			if (typeof window !== 'undefined') {
				stationId = Number(localStorage.getItem('selected-station'))
			}

			if (!stationId || isNaN(stationId) || !list.find(station => station.id === stationId))
				stationId = list[0]?.id ?? null

			set({
				list,
				loading: false,
				selectedStationId: stationId
			})

			// Safely update localStorage only in browser environment
			if (typeof window !== 'undefined' && stationId !== null) {
				localStorage.setItem('selected-station', String(stationId))
			}

		},

		// update paths list
		setPaths: (paths) => {
			set({paths})
		},

		// updates the stations list
		setStations: (stations) => {

			// return false

			// initialize first load
			if (!get().list.length)
				return get().initialize(stations)

			set({list: stations})

		},

		// Select a specific station
		selectStation: (stationId) => {
			set({selectedStationId: stationId})
			localStorage.setItem('selected-station', String(stationId))
		},

		// Get the currently selected station
		getSelectedStation: () => {
			const { list, selectedStationId } = get()
			return list.find(station => station.id === selectedStationId) || null
		}

	})
)

export const reset = () => useStationsStore.setState(initialState)