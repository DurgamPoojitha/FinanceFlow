import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * This is where it all begins. We use React's StrictMode to catch sneaky 
 * bugs early on — it basically double-renders our components in development
 * to make sure we aren't doing anything risky with our state.
 * We also import our global Tailwind styles right here!
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
