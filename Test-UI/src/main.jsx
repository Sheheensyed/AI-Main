import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import { DeviceProvider } from './context/Temp.jsx'
import { MappedStepsProvider } from './context/MappedStepContext.jsx'
import { StepProvider } from './context/StepContext.jsx'
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DeviceProvider>
        <MappedStepsProvider>
          <StepProvider>
            <App />
          </StepProvider>
        </MappedStepsProvider>
      </DeviceProvider>
    </BrowserRouter>
  </StrictMode>,
)
