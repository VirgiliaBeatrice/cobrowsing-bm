import React, { FC, MouseEventHandler, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { SessionInfo } from './lib/index'
import { useStores } from './lib/index'
import { Typography, Stack, Grid, Button, TextField, Table, TableHead, TableRow, TableBody, TableCell, List, ListItem,ListItemIcon, ListItemText, ListItemButton, ThemeProvider, createTheme, CssBaseline, Container, Paper, CircularProgress, IconButton } from '@mui/material'
import { observer } from "mobx-react-lite";
import videojs, { VideoJsPlayer } from 'video.js'
import 'video.js/dist/video-js.css'
import CancelIcon from '@mui/icons-material/Cancel';
import ReplayIcon from '@mui/icons-material/Replay';

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

interface VideoJSProps {
  options: any,
  onReady: (player: VideoJsPlayer) => void
}

const VideoJS: FC<VideoJSProps> = (props) => {
  const videoRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<VideoJsPlayer | null>(null)
  const {options, onReady} = props

  useEffect(() => {
    if (!playerRef.current) {
      const videoEl = document.createElement('video-js')

      videoEl.classList.add('vjs-big-play-centered')
      videoRef.current?.appendChild(videoEl)

      const player = playerRef.current = videojs(videoEl, options, () => {
        videojs.log('player is ready')
        onReady && onReady(player)
      })
    }
    else {
      const player = playerRef.current

      player.autoplay(options.autoplay)
      player.src(options.src)
    }
  }, [ options, videoRef ])

  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player>
      <div ref={videoRef} ></div>
    </div>
  )
}

const PHASE = {
  CONNECTING: 'connect',
  CONNECTED: 'connected',
  FAILED: 'failed'
}
type PHASE = typeof PHASE[keyof typeof PHASE]

const getPhaseComponent = (phase: PHASE) => {

  switch (phase) {
    case PHASE.CONNECTING:
      return (<div />)
    case PHASE.CONNECTED:
      return (<div />)
    case PHASE.FAILED:
      return (<div />)
    default:
      return (<div />);
  }
}

const getLoadingPage = () => {
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent='center'
      minHeight="100vh"
      style={{background: "grey"}}
    >
      <Grid item>
        <CircularProgress />
      </Grid>
    </Grid>
  )
}

const getFailPage = () => {
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent='center'
      minHeight="100vh"
      style={{background: "grey"}}
    >
      <Grid item>
        <Stack spacing={2} direction='row' alignItems='center'>
          <CancelIcon 
            color='error'
          />
          
          <Typography variant='body1'>
            Failed to connect server. Click button to retry.
          </Typography>
        

        </Stack>
      </Grid>
      <Grid item>
        <IconButton
          color='primary'
          >
          <ReplayIcon />
        </IconButton>
      </Grid>
    </Grid>
  )
}

interface MainPageProps {
  sessions: Array<SessionInfo>
  onCreateSession: MouseEventHandler,
  onRefresh: MouseEventHandler,
  onJoin: (id: string) => void
}

const getMainPage: FC<MainPageProps> = (props) => {
  const {sessions, onCreateSession, onRefresh, onJoin} = props
  // const handleConnect = () => {
  //   connect()
  //   init()

  //   // store.fetch()
  //   // fetchSessions()
  // }

  // const handlePlayerReady = (player: VideoJsPlayer) => {
  //   playerRef.current = player

  //   player.on('waiting', () => {
  //     videojs.log('player is waiting')
  //   })

  //   player.on('dispose', () => {
  //     videojs.log('player will dispose')
  //   })
  // }

  return (
    <Container component="main">
      <Paper
        variant='elevation'
      >
        <Stack direction='column' alignContent='center'>
          <Stack
            spacing={4}
            direction='row' alignContent='center' justifyContent='center'>
            <Button onClick={onCreateSession}>Create Session</Button>
            <IconButton color='primary' onClick={onRefresh}>
              <ReplayIcon />
            </IconButton>
          </Stack>
          <Grid container spacing={2}>
            <Grid>
              <List>
                {sessions.map(s => {
                  return (
                    <SessionButton key={s.id} {...s}/>
                  )
                })}
              </List>
            </Grid>
          </Grid>
        </Stack>
        {/* <Grid container>
          <Grid item xs={12}>
              <VideoJS options={vjsOptions} onReady={handlePlayerReady} />
          </Grid>
        </Grid> */}
      </Paper>
    </Container>
  )
}

const App = observer(() => {
  const [pagePhase, setPagePhase] = useState(PHASE.CONNECTING)

  const store = useStores()
  const playerRef = useRef<VideoJsPlayer|null>(null)

  useEffect(() => {
    store.connect()
  }, [])

 

  const vjsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
      type: 'application/x-mpegURL'
    }]
  }

  let element
  if (!store.connected) {
    if (store.failed) {
      element = getFailPage()
    }
    else {
      element = getLoadingPage()
    }
  }
  else {
    element = getMainPage(
      {
        sessions: store.sessions,
        onCreateSession: () => {
          store.createSession()
          store.fetch()
        },
        onRefresh: () => {
          store.fetch()
        },
        onJoin: (id: string) => {
          store.join(id)
        }
      })
  }

  // let element = store.connected? getMainPage() : getLoadingPage()

  // return getFailPage()
  return (
    <ThemeProvider theme={createTheme()}>
      <CssBaseline enableColorScheme />
      {element}
    </ThemeProvider>
  );
})



export default App;
