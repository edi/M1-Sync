import {twMerge} from 'tailwind-merge'
import {useAuthStore} from '../store/auth'
import {clsx} from 'clsx'
import ky from 'ky'

export const APP_URL = import.meta.env.VITE_APP_URL
export const API_URL = import.meta.env.VITE_API_URL
export const APP_TITLE = import.meta.env.VITE_APP_TITLE

export const api = ky.extend({
	prefixUrl: API_URL,
	hooks: {
		beforeRequest: [
			request => {
				// todo: device fingerprint
				// access token
				request.headers.set('Authorization', useAuthStore.getState().accessToken)
			}
		]
	}
})

/**
 * Sleeping method
 * @param {int} ms Time to sleep in ms
 * @returns Promise
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Tailwind classnames merger
 * @param  {...any} inputs
 * @returns {string}
 */
export const cn = (...inputs) => twMerge(clsx(inputs))

/**
 * Generate random alphanumeric string
 * @param {integer} length Length of string
 * @returns {string}
 */
export const createRandomString = length => {

	let result = ''
	const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz0123456789"

	for (let i = 0; i < length; i++)
		result += chars.charAt(Math.floor(Math.random() * chars.length))

	return result

}