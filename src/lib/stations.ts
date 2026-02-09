import {useStationsStore} from '@/store/stations'
import {toast} from 'sonner'
import {api} from './utils'
import type {StationsListResponse, SyncPathsResponse} from '@/types'

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

export const syncPaths = async (data: {stationId: number | null; newPath: string}) => {

	try {

		// set syncing
		useStationsStore.setState({
			loading: true,
			syncing: true
		})

		// sync paths
		const response = await api.post('stations/sync', {json: {data}}).json<SyncPathsResponse>()

		if (response.error)
			throw new Error(response.error)

		// set paths
		if (response.paths && Array.isArray(response.paths) && response.paths.length)
			useStationsStore.getState().setPaths(response.paths)

		// return response
		return {success: true} as const

	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to sync paths'
		toast.error(message, {position: 'bottom-right'})
		return {error: message} as const
	} finally {
		useStationsStore.setState({
			loading: false,
			syncing: false
		})
	}

}
