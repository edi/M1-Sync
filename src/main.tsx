import {createRoot} from 'react-dom/client'

import {MemoryRouter, Routes, Route} from 'react-router-dom'
import {useAuthStore} from './store/auth'
import {Toaster} from 'sonner'

// pages
import Preferences from './pages/preferences'
import Stations from './pages/stations'
import Preload from './pages/preload'
import Connect from './pages/connect'

// components
import Loader from './components/loader'
import NotFound from './components/not-found'
import Dashboard from './components/dashboard'

import './style.css'

export default function App() {

	const userId = useAuthStore(state => state.id)

	return (
		<>

			<Loader />

			<Toaster richColors position="bottom-center" />

			<MemoryRouter>
				<Routes>
					{userId ?
						<>
							<Route path="/" element={<Dashboard />}>
								<Route index element={<Stations />} />
								<Route path="connect" element={<Stations />} />
								<Route path="stations" element={<Stations />} />
								<Route path="preferences" element={<Preferences />} />
								<Route path="*" element={<NotFound />} />
							</Route>
						</>
						:
						<>
							<Route path="/" element={<Preload />} />
							<Route path="/connect" element={<Connect />} />
						</>
					}
				</Routes>
			</MemoryRouter>

		</>
	)
}

const root = createRoot(document.getElementById('root')  as HTMLElement)

root.render(<App />)
