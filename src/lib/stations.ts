import {useStationsStore} from '../store/stations'
import {toast} from 'sonner'
import {api} from './utils'

export const fetch = async () => {

	try {

		// set loading
		useStationsStore.setState({loading: true})

		// fetch stations
		const response = await api.get('stations').json()

		if ('error' in response)
			throw new Error(response.error)

		// set stations
		useStationsStore.getState().setStations(response.list)

	} catch (err) {
		toast.error(err.message, {position: 'bottom-right'})
	} finally {
		useStationsStore.setState({loading: false})
	}

}

export const syncPaths = async (data) => {

	try {

		// set syncing
		useStationsStore.setState({
			loading: true,
			syncing: true
		})

		// sync paths
		const response = await api.post('stations/sync', {json: {data}}).json()

		if ('error' in response)
			throw new Error(response.error)

		// set paths
		if (response.paths && typeof response.paths === 'object' && response.paths.length)
			useStationsStore.getState().setPaths(response.paths)

		// return response
		return {success: true}

	} catch (err) {
		toast.error(err.message, {position: 'bottom-right'})
		return {error: err.message}
	} finally {
		useStationsStore.setState({
			loading: false,
			syncing: false
		})
	}

}