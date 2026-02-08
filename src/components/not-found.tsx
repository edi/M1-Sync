import {useLocation} from 'react-router-dom'

export default function NotFound(){

  const location = useLocation()

  return (
    <div>page-not-found :: {location.pathname}</div>
  )

}
