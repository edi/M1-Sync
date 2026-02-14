import {writeText} from '@tauri-apps/plugin-clipboard-manager';
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/store/auth'
import useState from 'react-usestateref'
import {QRCode} from 'react-qrcode-logo'
import {useForm} from 'react-hook-form'
import {useRef, useEffect} from 'react'
import {toast} from 'sonner'
import logo from '/icon.svg'

import {
	Copy,
	Check
} from 'lucide-react'

import {
	verifySessionCode,
	requestSessionCode,
	signInUsingCredentials
} from '@/lib/auth'

import {
	cn,
	APP_URL,
	APP_TITLE
} from '@/lib/utils'

interface ConnectState {
	loading: boolean | string
	copied: boolean
	code: string | null | false
}

export default function Home() {

	const timer = useRef<ReturnType<typeof setInterval> | null>(null)
	const navigate = useNavigate()
	const userId = useAuthStore(state => state.id)

	const [state, changeState, stateRef] = useState<ConnectState>({
		loading: false,
		copied: false,
		code: false
	})

	const setState = (data: Partial<ConnectState>) => changeState(prevState => ({...prevState, ...data}))

	// user connected listener
	useEffect(() => {
		if (userId)
			navigate('/station')
	}, [userId])

	// request session code on page load
	useEffect(() => {

		if (state.code === false) {
			setState({code: null}) // temporarily mark code as "loading"
			try {
				requestSessionCode((code: string) => setState({code}))
			} catch (err) {
				// do nothing
				console.log(err instanceof Error ? err.message : err)
			}
		}

		if (timer.current === null)
			timer.current = setInterval(() => {

				if (stateRef.current.loading)
					return false

				setState({loading: 'qr'})
				verifySessionCode(stateRef.current.code || null, () => setState({loading: false}))

			}, 10000)

		return () => {
			if (timer.current !== null)
				clearInterval(timer.current)
			timer.current = null
		}

	}, [])

	// on copy listener
	useEffect(() => {

		if (!state.copied)
			return;

		const timeout = setTimeout(() => {
			setState({copied: false})
		}, 2500)

		return () => {
			clearTimeout(timeout)
		}

	}, [state.copied])

	const onSubmit = async (data: {email: string; password: string}) => {

		if (state.loading && state.loading !== 'qr')
			return false

		const toastId = toast.loading('Authenticating ...')
		setState({loading: true})

		try {

			await signInUsingCredentials(data)
			toast.success('Logged in successfully', {id: toastId})

		} catch (err) {
			const message = err instanceof Error ? err.message : 'Authentication failed'
			toast.error(message, {id: toastId})
		} finally {
			setState({loading: false})
		}

	}

	const onCopyCode = async () => {
		if (typeof state.code === 'string')
			await writeText(state.code)
		setState({copied: true})
	}

	const {
		register,
		handleSubmit,
		formState: {errors}
	} = useForm({
		defaultValues: {
			email: import.meta.env.VITE_LOGIN_EMAIL || '',
			password: import.meta.env.VITE_LOGIN_PASSWORD || ''
		}
	})

	const demoURL = `${APP_URL}/book-a-demo`
	const remoteConnectURL = `${APP_URL}/key`
	const forgotPasswordURL = `${APP_URL}/forgot-password`

	return (
		<div className="flex h-full p-6 pl-0">

			{/* CREDENTIALS */}
			<div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-24">
				<div className="mx-auto w-full max-w-sm lg:w-96">
					<div>
						<div className="flex items-center space-x-4">
							<img alt="" className="h-14 w-auto" src={logo} />
							<div>
								<h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
									{APP_TITLE}
								</h2>
								<p className="text-sm leading-6 text-gray-500">
									Not a member yet?{' '}
									<a href={demoURL} target="_blank" className="font-semibold text-slate-600 hover:text-slate-500">
										Book a demo
									</a>
								</p>
							</div>
						</div>
					</div>

					<div className="mt-10">
						<div>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

								<div>
									<label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
										Email address
									</label>
									<div className="mt-2">
										<input
											type="email"
											autoComplete="email"
											placeholder="edi@musicone.io"
											{...register('email', {required: true})}
											className={cn("block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6", errors.email ? 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-slate-600')}
										/>
									</div>
								</div>

								<div>
									<label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
										Password
									</label>
									<div className="mt-2">
										<input
											type="password"
											placeholder="········"
											autoComplete="current-password"
											{...register('password', {required: true, minLength: 6})}
											className={cn("block w-full rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6", errors.password ? 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-slate-600')}
										/>
									</div>
								</div>

								<div>
									<div className="flex items-center justify-end text-sm leading-6 mb-10">
										<a href={forgotPasswordURL} target="_blank" className="font-semibold text-slate-600 hover:text-slate-500">
											Forgot password?
										</a>
									</div>

									<button type="submit" disabled={!!state.loading && state.loading !== 'qr'} className="flex w-full justify-center rounded-md bg-slate-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-xs hover:bg-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-70 disabled:pointer-events-none transition-all">
										Sign in
									</button>

								</div>

							</form>
						</div>

					</div>
				</div>
			</div>

			{/* QR CODE */}
			<div className="flex flex-col flex-1 items-center justify-center bg-gray-100 rounded-xl relative overflow-hidden">

				<div className={cn("absolute inset-0 w-full h-full flex items-center justify-center bg-gray-300/50 z-10 transition-opacity opacity-100", state.code ? 'pointer-events-none opacity-0' : '')}>
					<img src={logo} alt="" className="h-32 w-32 animate-spin" />
				</div>

				<div className="space-x-3 text-center mb-6">
					<h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
						Remote Connect
					</h2>
					<p className="text-sm leading-6 text-gray-500">
						Scan QR code to remotely verify this device
					</p>
				</div>

				<div className="flex relative items-center justify-center transition-opacity w-[300px] h-[300px]" style={{opacity: state.code ? 1 : 0.2}}>
					<QRCode
						size={300}
						ecLevel="Q"
						quietZone={0}
						eyeRadius={10}
						qrStyle="fluid"
						fgColor="#656d78"
						eyeColor="#434a54"
						bgColor="transparent"
						logoHeight={50}
						logoWidth={50}
						value={`${remoteConnectURL}/${state.code || ''}`}
						style={{position: 'absolute', top: 0, left: 0}}
					/>
					<img src={logo} alt="" className={cn("z-10 w-16 h-16 border-[5px] border-gray-100 rounded-full", state.loading === 'qr' ? 'animate-spin' : '')} />
				</div>

				<div className="relative mt-4 w-[300px]">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border border-gray-300" />
					</div>
					<div className="relative flex justify-center text-sm leading-6">
						<span className="bg-gray-100 px-6 text-gray-500 text-center">or enter code manually on<br/><a href={remoteConnectURL} target="_blank" className="font-medium">{remoteConnectURL.slice(8)}</a></span>
					</div>
				</div>

				<div className="w-[300px] flex items-stretch space-x-2 mt-4">
					<div className="flex-1 text-center bg-white rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset ring-gray-300 sm:leading-6 font-mono text-lg tracking-widest">
						&nbsp;{state.code}&nbsp;
					</div>
					<button disabled={state.copied} onClick={onCopyCode} className="rounded-md border-0 py-1.5 shadow-xs ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 px-3 bg-white hover:bg-gray-50 font-medium transition-colors disabled:pointer-events-none">
						{state.copied
							? <Check className="size-5 text-green-700" />
							: <Copy className="size-5 text-slate-700" />
						}
					</button>
				</div>

			</div>
		</div>
	)

}
