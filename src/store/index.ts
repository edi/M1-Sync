import {reset as authReset} from './auth'
import {reset as stationsReset} from './stations'
import {reset as relayReset} from './relay'

export const resetAllStores = () => {
	relayReset()
	authReset()
	stationsReset()
}