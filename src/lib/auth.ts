import {useAuthStore} from '../store/auth'
import {resetAllStores} from '../store'
import {api} from './utils'

/**
 * Check if session code is validated
 * @param {string} code Unique session identifier
 * @param {function} callback Function to trigger when request finished processing
 */
export const verifySessionCode = async (code, callback) => {

	if (!code) {
		callback()
		return false
	}

	try {

		const response = await api.get(`session/${code}`).json()
		// TODO: save session
		// console.log(response)

	} catch (err) {
		// do nothing
		console.log(err.message)
	} finally {
		callback()
	}

}

/**
 * Request unique session code
 * @param {function} onSuccess Method to call on success
 * @returns {string}
 */
export const requestSessionCode = async onSuccess => {

	const response = await api.get('session/new').json()

	// trigger callback
	onSuccess(response.sessionCode)

}

/**
 * Sign in using credentials
 * @param {object} fields User credentials
 * @param {function} navigate Navigator
 */
export const signInUsingCredentials = async (fields) => {

	// get jwt
	const response = await api.post('customer/login', {json: fields}).json()

	if (response.error)
		throw new Error(response.error)

	try {
		await window.api.saveToken(response.accessToken)
	} catch (err) {
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
	const response = await api.get('token/verify').json()

	if (response.error)
		return response.error

	// update state
	useAuthStore.setState(response)

	try {
		if (response.accessToken)
			await window.api.saveToken(response.accessToken)
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
export const signOut = async (navigate) => {

	// show loader
	useAuthStore.setState({loader: true})

	// clear token
	await window.api.saveToken('')

	// reset all states
	setTimeout(() => {
		resetAllStores()
	}, 1500)

	// navigate to connect screen
	navigate('/connect')

}