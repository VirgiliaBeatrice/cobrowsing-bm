// import logo from './logo.svg';
import './App.css';
import * as React from 'react';
import Fab from '@mui/material/Fab'
import { Stack } from '@mui/material';
import Fade from '@mui/material/Fade'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
// const capabilities = singaling
import { create } from './media'

export const App: React.FC = ()  => {
  const [showFab, setShowFab] = React.useState(false)

  const handleEnter = () => {
    setShowFab(true)
  }

  const handleLeave = () => {
    setShowFab(false)
  }


  return (
    <div className='App' onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      
      <Fade in={showFab}>
        <Stack direction="row" spacing={2} justifyContent="center" marginTop={2}>
          <Fab color="primary" aria-label='add' onClick={() => create()}>
            <AddIcon />
          </Fab>
          <Fab color="primary" aria-label='edit'>
            <EditIcon />
          </Fab>
        </Stack>
      </Fade>
      <div>
        <video />
      </div>
    </div>
  )
}

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

export default App;
