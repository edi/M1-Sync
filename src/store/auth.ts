import {create} from 'zustand'

const initialState = {
	id: null,
	name: null,
	email: null,
	orgId: null,
	loader: false,
	accessToken: null
}

export const useAuthStore = create(
	(set) => ({
		...initialState,
		showLoader: status => set({loader: status}),
		setToken: accessToken => set({accessToken})
	})
)

export const reset = () => useAuthStore.setState(initialState)