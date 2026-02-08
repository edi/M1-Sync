import {useAuthStore} from '../store/auth'
import logo from '/icon.svg'
import {cn} from '../lib/utils'

export default function Loader() {

	const loading = useAuthStore(state => state.loader)

  return (
    <div className={`fixed inset-0 z-1000 flex items-center justify-center bg-white/50 backdrop-blur-sm transition-opacity duration-500 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <img src={logo} alt="" className={cn('h-14 w-14 animate-spin-fade')} />
    </div>
  )
}
