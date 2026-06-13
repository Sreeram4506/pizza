import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { getApiBaseUrl, patchFetchForEnvironment } from './utils/env'

patchFetchForEnvironment(getApiBaseUrl())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
