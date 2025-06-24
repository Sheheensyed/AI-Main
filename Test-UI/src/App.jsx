import './App.css'
import { Route, Routes } from 'react-router-dom'
import Search from './components/Search'
import List from './components/List'
import Footer from './components/Footer'
import StepsAdd from './components/StepsAdd'
import Map from './pages/Map'
import Mapped_steps from './pages/Mapped_steps'

function App() {


  return (
    <>
      <Routes>
          <Route path='/' element={<Search/>}/>
          <Route path='/lists' element={<List/>}/>
          <Route path='/steps' element={<StepsAdd/>}/>
          <Route path='/map' element={<Map/>}/>
          <Route path='/mapped' element={<Mapped_steps/>}/>
      </Routes>
    <Footer/>
    </>
  )
}

export default App
