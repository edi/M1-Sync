import {useStationsStore} from '@/store/stations'
import {toast} from 'sonner'
import {api} from './utils'
import type {StationsListResponse, StationPreferencesResponse} from '@/types'

export const fetch = async () => {

	try {

		// set loading
		useStationsStore.setState({loading: true})

		// fetch stations
		const response = await api.get('stations').json<StationsListResponse>()

		if (response.error)
			throw new Error(response.error)

		// set stations
		useStationsStore.getState().setStations(response.list)

	} catch (err) {
		toast.error(err instanceof Error ? err.message : 'Failed to fetch stations', {position: 'bottom-right'})
	} finally {
		useStationsStore.setState({loading: false})
	}

}

export const saveExportPath = async (data: {stationId: number; exportPath: string | null}) => {

	try {

		useStationsStore.setState({loading: true})

		const response = await api.post('stations/preferences', {json: data}).json<StationPreferencesResponse>()

		if (response.error)
			throw new Error(response.error)

		useStationsStore.getState().setExportPath(data.stationId, data.exportPath)

		return {success: true} as const

	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to save export path'
		toast.error(message, {position: 'bottom-right'})
		return {error: message} as const
	} finally {
		useStationsStore.setState({loading: false})
	}

}
