import {useAuthStore} from '@/store/auth'
import {resetAllStores} from '@/store'
import {api} from '@/lib/utils'
import {load} from '@tauri-apps/plugin-store'
import type {LoginResponse, SessionCodeResponse} from '@/types'

const getStore = () => load('settings.json', {autoSave: true, defaults: {}})

export const saveToken = async (token: string) => {
	const store = await getStore()
	await store.set('accessToken', token)
}

export const getToken = async () => {
	const store = await getStore()
	return await store.get<string>('accessToken')
}

/**
 * Check if session code is validated
 * @param {string} code Unique session identifier
 * @param {function} callback Function to trigger when request finished processing
 */
export const verifySessionCode = async (code: string | null, callback: () => void) => {

	if (!code) {
		callback()
		return false
	}

	try {

		await api.get(`session/${code}`).json()
		// TODO: save session

	} catch (err) {
		// do nothing
		console.log(err instanceof Error ? err.message : err)
	} finally {
		callback()
	}

}

/**
 * Request unique session code
 * @param {function} onSuccess Method to call on success
 */
export const requestSessionCode = async (onSuccess: (code: string) => void) => {

	const response = await api.get('session/new').json<SessionCodeResponse>()

	// trigger callback
	onSuccess(response.sessionCode)

}

/**
 * Sign in using credentials
 * @param {object} fields User credentials
 */
export const signInUsingCredentials = async (fields: {email: string; password: string}) => {

	// get jwt
	const response = await api.post('customer/login', {json: fields}).json<LoginResponse>()

	if (response.error)
		throw new Error(response.error)

	try {
		await saveToken(response.accessToken)
	} catch {
		// do nothing
	}

	// show loader
	useAuthStore.setState({loader: true})

	// update state and hide loader
	setTimeout(() => {
		useAuthStore.setState({
			...response,
			loader: false
		})
	}, 1500)

}

/**
 * Validate access token
 * @returns {Promise<Object>}
 */
export const validateAccessToken = async () => {

	// check jwt
	const response = await api.get('token/verify').json<LoginResponse>()

	if (response.error)
		return response.error

	// update state
	useAuthStore.setState(response)

	try {
		if (response.accessToken)
			await saveToken(response.accessToken)
	} catch (err) {
		console.error(err)
		return null
	}

	return response

}

/**
 * User sign out
 * @param {function} navigate Navigator
 */
export const signOut = async (navigate: (path: string) => void) => {

	// show loader
	useAuthStore.setState({loader: true})

	// clear token
	await saveToken('')

	// reset all states
	setTimeout(() => {
		resetAllStores()
	}, 1500)

	// navigate to connect screen
	navigate('/connect')

}
