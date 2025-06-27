import './App.css'
import { Route, Routes } from 'react-router-dom'
import Search from './components/Search'
import Footer from './components/Footer'
import Map from './pages/Map'
import Mapped_steps from './pages/Mapped_steps'
import Execute from './pages/Execute'
import Live_Cam from './components/Live_Cam'

function App() {


  return (
    <>
      <Routes>
          <Route path='/' element={<Search/>}/>
          <Route path='/lists/:id' element={<Execute/>}/>
          <Route path='/live-cam' element={<Live_Cam/>}/>
      </Routes>
    <Footer/>
    </>
  )
}

export default App
