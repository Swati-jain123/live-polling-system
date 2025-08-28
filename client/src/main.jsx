import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import App from './App.jsx'

import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
