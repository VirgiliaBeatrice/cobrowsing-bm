import React from 'react';
import logo from './logo.svg';
import './App.css';
import { connect, init, fetchSessions } from './lib/index'
import { Grid, Button, TextField, Table, TableHead, TableRow, TableBody, TableCell, List, ListItem,ListItemIcon, ListItemText } from '@mui/material'

function App() {
  React.useEffect(() => {
    console.log('just a test')

  }, [])

  const handleConnect = () => {
    connect()
    init()
    fetchSessions()
  }

  const handleCreateSession = () => {

  }

  return (
    <div className="App">
      <Grid container spacing={2}>
        <Grid item>
          <Button onClick={handleConnect}>Connect</Button>
        </Grid>
        <Grid item>
          <Button onClick={handleCreateSession}>Create Session</Button>
        </Grid>
        <Grid item>
          <Button>Create Peer</Button>
        </Grid>
        <Grid item>
          <Button>Join</Button>
        </Grid>
        <Grid item>
          <Button>Disconnect</Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item>
          <TextField id='SessionId' />
        </Grid>
        <Grid>
          <List>
            <ListItem>
              <ListItemText
                primary={'test'}
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
    </div>
  );
}



export default App;
