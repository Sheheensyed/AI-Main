import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import { DeviceProvider } from './context/Temp.jsx'
import { MappedStepsProvider } from './context/MappedStepContext.jsx'
import { CaseProvider } from './context/CaseContext.jsx'
import { StepProvider } from './context/StepContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DeviceProvider>
        <MappedStepsProvider>
          <CaseProvider>
            <StepProvider>
              <App />
            </StepProvider>
          </CaseProvider>
        </MappedStepsProvider>
      </DeviceProvider>
    </BrowserRouter>
  </StrictMode>,
)
