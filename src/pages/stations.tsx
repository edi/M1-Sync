import {useStationsStore} from '@/store/stations'
import {cn} from '@/lib/utils'
import {useEffect} from 'react'
import {toast} from 'sonner'
import {open} from '@tauri-apps/plugin-dialog'

import {
	syncPaths,
	fetch as fetchStations
} from '@/lib/stations'

import {
	Frown,
	RefreshCw,
	FolderSearch
} from 'lucide-react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export default function Stations() {

	const paths = useStationsStore(state => state.paths)
	const stations = useStationsStore(state => state.list)
	const loading = useStationsStore(state => state.loading)
	const syncing = useStationsStore(state => state.syncing)
	const selectStation = useStationsStore(state => state.selectStation)
	const selectedStationId = useStationsStore(state => state.selectedStationId)

	useEffect(() => {
		if (!stations.length)
			fetchStations()
	}, [])

	const onOpenFolder = async (pathname = null) => {

		if (syncing)
			return false

		try {

			let newPath

			if (pathname) {
				newPath = pathname
			} else {

				const selected = await open({directory: true})

				if (!selected)
					return false

				newPath = selected

			}

			// check if path already exists
			if (paths.includes(newPath))
				return toast.warning('Path already synced', {position: 'bottom-right'})

			// check if other parent paths include this path
			const parentPaths = paths.filter(path => newPath.includes(path))

			if (parentPaths.length)
				return toast.warning('Path already synced in parent path', {
					position: 'bottom-right',
					descriptionClassName: 'opacity-60 text-xs',
					description: <ul>{parentPaths.map(item => <li key={item}>{item}</li>)}</ul>
				})

			// check if other paths are included in this path
			const subPaths = paths.filter(path => path.includes(newPath))

			if (subPaths.length)
				toast.warning('The following sub-paths will be removed', {
					position: 'bottom-right',
					descriptionClassName: 'opacity-60 text-xs',
					description: <ul>{subPaths.map(item => <li key={item}>{item}</li>)}</ul>
				})

			const toastId = toast.loading('Syncing media...', {
				description: newPath,
				position: 'bottom-right',
				descriptionClassName: 'opacity-60 text-xs'
			})

			try {

				const response = await syncPaths({
					stationId: selectedStationId,
					newPath
				})

				if ('error' in response)
					throw new Error(response.error)

				toast.success('Media synced successfully', {position: 'bottom-right'})

			} catch (err) {
				return toast.error('Failed to sync media', {
					description: err.message,
					descriptionClassName: 'opacity-60 text-xs',
					position: 'bottom-right'
				})
			} finally {
				toast.dismiss(toastId)
			}

		} catch (err) {
			toast.error('Failed to open folder', {description: err.message})
		}

	}

	if (loading && !syncing)
		return (
			<div className="p-4 bg-gray-100 grow">
				<div className="p-3 space-y-4">
					<div className="w-[35%] h-3 bg-gray-200 rounded-full animate-pulse delay-0" />
					<div className="w-[25%] h-3 bg-gray-200 rounded-full animate-pulse delay-100" />
					<div className="w-[40%] h-3 bg-gray-200 rounded-full animate-pulse delay-200" />
				</div>
			</div>
		)

	if (!stations.length)
		return (
			<div className="p-4 bg-gray-100 grow flex items-center justify-center">
				<div className="text-center w-1/2">
					<Frown className="size-30 mx-auto mb-6 text-gray-300" />
					<div className="text-gray-500">
						No stations found in your account,
						<br/>
						click <button className="px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300/70 transition-all" onClick={fetchStations}>here</button> to try again.
					</div>
				</div>
			</div>
		)

	return (
		<div className="p-4 bg-gray-100 grow space-y-4">

			<div className="flex items-center gap-x-3">

				<Select value={selectedStationId?.toString()} onValueChange={(value) => selectStation(parseInt(value))}>
					<SelectTrigger className="w-[180px] cursor-pointer bg-white">
						<SelectValue placeholder="Select station" />
					</SelectTrigger>
					<SelectContent>
						{stations.map(item => (
							<SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="grow" />

				<button disabled={loading} onClick={() => onOpenFolder()} className={cn("flex items-center gap-x-2 text-sm px-3 py-1.5 rounded-md transition-colors", loading ? 'bg-gray-200/80 text-gray-700/60' : 'bg-blue-200/80 text-blue-700/60 cursor-pointer hover:bg-blue-200')}>
					<FolderSearch className="size-6" /> Add folder
				</button>

				{syncing &&
					<button className="bg-slate-200 rounded-md px-2 py-1.5">
						<RefreshCw className="size-6 animate-spin text-slate-400" />
					</button>
				}

			</div>

			<div className="p-4 bg-white ring-1 ring-slate-200 shadow-sm sm:rounded-lg max-w-full divide-y divide-gray-100">

				{!paths?.length &&
					<div className="text-center text-gray-500" onClick={() => onOpenFolder()}>
						No paths synced in this station, click <span className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 cursor-pointer transition-colors">here</span> to to sync a folder.
					</div>
				}

				{paths?.map(path =>
					<div key={path} className="text-sm text-slate-600">
						{path}
					</div>
				)}

			</div>

		</div>
	)
}