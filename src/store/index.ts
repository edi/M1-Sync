import {reset as authReset} from './auth'
import {reset as stationsReset} from './stations'

export const resetAllStores = () => {
	authReset()
	stationsReset()
}