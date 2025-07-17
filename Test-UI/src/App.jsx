import './App.css'
import { Route, Routes } from 'react-router-dom'
import Search from './components/Search'
import Footer from './components/Footer'
import Execute from './pages/Execute'
import Live_Cam from './components/Live_Cam'
import Header from './components/Header'

function App() {


  return (
    <>
        <Header />
      <Routes>
        <Route path='/' element={<Search />} />
        <Route path='/lists/:id' element={<Execute />} />
        <Route path='/live-cam' element={<Live_Cam />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
