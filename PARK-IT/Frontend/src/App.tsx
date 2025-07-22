import { useState , useEffect } from 'react';
import { BrowserRouter as Router , Routes , Route} from 'react-router-dom';
import Nav from './Components/Nav/Nav'

function App() {

  return (
    <>
    <Router>
    <Nav/>
    <Routes>
      <Route /* path='' element={<Index/>} */> </Route>

    </Routes>
    </Router>

  
    </>
  )
}

export default App
