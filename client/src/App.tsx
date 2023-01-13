import React from 'react';
import logo from './logo.svg';
import './App.css';
import { connect, init, createSession, useStores } from './lib/index'
import { Grid, Button, TextField, Table, TableHead, TableRow, TableBody, TableCell, List, ListItem,ListItemIcon, ListItemText, ListItemButton } from '@mui/material'
import { observer } from "mobx-react-lite";
import { Session } from 'inspector';


interface SessionButtonProps {
  id: string,
  name: string
}

const SessionButton = observer<SessionButtonProps>(({id, name}) => {
  const store = useStores()

  return (
    <ListItem>
      <ListItemButton
        onClick={() => store.join(id)}
      >
        <ListItemText
          primary={name}
        />
      </ListItemButton>
    </ListItem>)
})

const App = observer(() => {

  const store = useStores()


  React.useEffect(() => {
    console.log('just a test')

  }, [])

  const handleConnect = () => {
    connect()
    init()

    store.fetch()
    // fetchSessions()
  }

  const handleCreateSession = () => {
    createSession()
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
            {store.sessions.map(s => {
              return (
                <SessionButton key={s.id} {...s}/>
              )
            })}
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
})



export default App;
