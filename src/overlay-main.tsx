import './styles/fonts.css'
import './styles/index.css'

import ReactDOM from 'react-dom/client'
import { OverlayApp } from './overlay-app'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(<OverlayApp />)
