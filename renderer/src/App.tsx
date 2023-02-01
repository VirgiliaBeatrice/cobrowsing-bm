// import logo from './logo.svg';
import './App.css';
import * as React from 'react';
import Fab from '@mui/material/Fab'
import { Stack } from '@mui/material';
import Fade from '@mui/material/Fade'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
// const capabilities = singaling
import { create, consume } from './media'

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
          <Fab color="primary" aria-label='edit' onClick={() => consume()}>
            <EditIcon />
          </Fab>
        </Stack>
      </Fade>
      <div>
        <video id='video' />
      </div>
    </div>
  )
}

export default App;
