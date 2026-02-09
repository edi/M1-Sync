import type {ToggleProps} from '@/types'

export default function Toggle({enabled, disabled, onChange, label, description}: ToggleProps) {

  const onClick = () => {
    if (!disabled && onChange)
      onChange()
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button onClick={onClick} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 ${enabled ? 'bg-green-600' : 'bg-gray-200'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
