import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { getApiBaseUrl, patchFetchForEnvironment } from './utils/env'

if (typeof globalThis !== 'undefined') {
  globalThis.__VITE_ENV__ = import.meta.env
}

patchFetchForEnvironment(getApiBaseUrl())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
