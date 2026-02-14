import {validateAccessToken, getToken} from '@/lib/auth'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/store/auth'
import {useEffect} from 'react'

export default function Preload() {

	const user = useAuthStore()
	const navigate = useNavigate()

	// token verification
	useEffect(() => {

		// show loader
		user.showLoader(true)

		const checkAuthentication = async () => {

			let session

			// check for token
			const accessToken = await getToken()

			// validate access token
			if (accessToken) {

				// save token to state
				user.setToken(accessToken)

				// get token details
				session = await validateAccessToken()

			}

			user.showLoader(false)

			if (!session || typeof session === 'string' || !session.id)
				navigate('/connect')

		}

		setTimeout(() => {
			checkAuthentication()
		}, 1000)

	}, [])

	// user connected
	useEffect(() => {

		if (user.id)
			navigate('/station')

	}, [user.id])

	return null

}