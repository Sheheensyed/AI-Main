import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import { DeviceProvider } from './context/Temp.jsx'
import { MappedStepsProvider } from './context/MappedStepContext.jsx'
import { CaseProvider } from './context/CaseContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DeviceProvider>
        <MappedStepsProvider>
          <CaseProvider>
            <App />
          </CaseProvider>
        </MappedStepsProvider>
      </DeviceProvider>
    </BrowserRouter>
  </StrictMode>,
)
