import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import EmbedAvatar from './pages/EmbedAvatar.jsx'

const isEmbed = window.location.pathname.startsWith('/embed')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEmbed ? <EmbedAvatar /> : <App />}
  </StrictMode>,
)
