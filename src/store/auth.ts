import {create} from 'zustand'
import type {AuthState} from '@/types'

const initialState: Omit<AuthState, 'showLoader' | 'setToken'> = {
	id: null,
	name: null,
	email: null,
	orgId: null,
	loader: false,
	accessToken: null
}

export const useAuthStore = create<AuthState>(
	(set) => ({
		...initialState,
		showLoader: (status: boolean) => set({loader: status}),
		setToken: (accessToken: string | null) => set({accessToken})
	})
)

export const reset = () => useAuthStore.setState(initialState)
