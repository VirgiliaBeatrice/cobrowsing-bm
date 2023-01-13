import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import * as os from 'os'
import { Server, Socket } from "socket.io"
import { uuid } from 'uuidv4'
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { idText, preProcessFile } from "typescript";
import { session } from "electron";
import pino from 'pino'

const logger = pino({
    transport: {
        target: 'pino-pretty'
    }
})


type ClientCallback<T> = (ack: Ack<T>) => void
type RecvEvent<T, K> = (msg: Message<T>, cb: ClientCallback<K>) => void

interface ClientToServerEvents {
    [key: string]:  RecvEvent<any, any>;

    "read:sessions": RecvEvent<any, any>,
    "create:session": RecvEvent<any, any>,
    "create:peer": RecvEvent<any, any>
}

interface ServerToClientEvents {
    [key: string]: (...args: any[]) => void;

    "default": (msg: Message<any>) => void
}

interface Peer {
    id: string,
    name: string,
    color: string,
    sessionId: string,
    mouseEvent?: MouseEvent,
    keyEvent?: KeyEvent,
}

interface MouseEvent {
    event: 'move' | 'up' | 'down',
    button: 'left' | 'middle' | 'right'
    x: number,
    y: number,
}

interface KeyEvent {
    event: 'down' | 'up'
    keyCode: string
}

interface SessionInfo {
    id: string,
    name: string,
}

interface Session extends SessionInfo {
    electron: ChildProcessWithoutNullStreams | undefined,
    browser: ChildProcessWithoutNullStreams | undefined,
    monitor: ChildProcessWithoutNullStreams | undefined,
    peers: Map<string, Peer>
}

const CHROME_PATH = os.platform() == 'win32'? 
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : ""

const CHROME_ARGS = ["--new-window", "--start-maximized",  "--incognito"]

class SessionManager {
    private _sessions: Map<string, Session> = new Map<string, Session>()

    constructor() { }

    create(id: string) {
        let electron, browser, monitor

        if (os.platform() == 'linux') {
            electron = spawn("electron", {
                cwd: os.homedir(),
    
            })
            browser = spawn("chrome", {
                cwd: os.homedir(),
            })
            monitor = spawn("xvfb", {
                cwd: os.homedir(),
            })
        }
        else if (os.platform() == 'win32') {
            browser = spawn(
                CHROME_PATH, 
                CHROME_ARGS,
                {
                    cwd: os.homedir()
                })
        }

        var session: Session = {
            id: id,
            name: `Session[${id}]`,
            electron: electron,
            browser: browser,
            monitor: monitor,
            peers: new Map(),
        }

        this._sessions.set(session.id, session)

        return session
    }

    stop(sessionId: string) {
        // kill all child process

        // remove from session
        this._sessions.delete(sessionId)
    }

    join(sessionId: string, peer: Peer) {
        var session = this._sessions.get(sessionId)

        session?.peers.set(peer.id, peer)
    }

    leave(sessionId: string, peer: Peer) {
        var session = this._sessions.get(sessionId)

        session?.peers.delete(peer.id)
    }

    find(sessionId: string): Session | undefined {
        return this._sessions.get(sessionId)
    }

    getPeers(sessionId: string): Array<Peer> {
        var session = this._sessions.get(sessionId) 

        return session? [...session.peers.values()] : []
    }

    get sessions(): Array<SessionInfo> {
        return [...this._sessions.values()].map(s => ({
            id: s.id,
            name: s.name
        }))
    }
}

logger.info("Server has been started.")

const manager = new SessionManager()
const httpServer = createServer()
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents
    >(httpServer, {
        cors: {
            origin: ['https://admin.socket.io'],
            credentials: true
        }
    })

instrument(io, {
    auth: false,
    mode: 'development'
})

httpServer.listen(30001)

interface Session {
    id: string
}

// c->s
// connect   ->
// connected <-
// create    ->
// created   <-
// join      ->
// joined    <-

// interface Message {
//     type: string,
// }

interface Message<T> {
    type: string,
    payload: T
}


// const participants = new Map<string, Peer>() 

const publishTo = (id: string, msg: Message<any>) => {
    // var session = manager.sessions.find(s => s.id == id)
    // var msg = {
    //     type: 'update',
    //     payload: session
    // }

    io.to(id).emit(msg.type, msg)
}

interface Ack<T> {
    type: string,
    status: string,
    payload?: T | any
}

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    logger.info("A remote connection has been established.")
    
    // emit connected
    var msg = {
        type: 'connected',
        // payload: manager.sessions
    }

    socket.emit("connected", msg)


    socket.on('withAck', (msg, cb) => {

    })

    // onCreateSession
    socket.on("create:session", (msg, cb) => {
        logger.info(`recv - ${msg.type}`)
    
        var session = manager.create(uuid())
        var ack: Ack<any> = {
            type: msg.type,
            status: 'ok',
            payload: session.id
        }

        cb(ack)
    })

    socket.on("create:peer", (msg, cb) => {
        var ack: Ack<string> = {
            type: msg.type,
            status: "ok",
            payload: uuid()
        }

        cb(ack)
    })

    socket.on("update:peer.session_id", (msg: Message<Peer>, cb: (ack: Ack<any>) => void) => {
        var peer = msg.payload
        var session = manager.find(peer.sessionId as string)

        if (session) {
            socket.join(session.id)
            manager.join(session.id, peer)

            var ack: Ack<any> = {
                type: msg.type,
                status: 'ok'
            }

            cb(ack)

            // publishTo(session.id, )
        }
    })

    socket.on("update:peer.cursor", (msg: Message<Peer>, cb: (ack: Ack<any>) => void) => {
        var peer = msg.payload
        var session = manager.find(peer.sessionId as string)

        if (session) {
            var target = session.peers.get(peer.id)

            // target?.cursor = peer.cursor

            var ack: Ack<any> = {
                type: msg.type,
                status: 'ok'
            }

            cb(ack)

            // publishTo(session.id, )
        }
    })

    // socket.on('create:peer', (peer: Peer) => {
    //     if ()
    // })

    // onJoin
    // socket.on('join', (sessionId: string, peer: Peer) => {
    //     var session = manager.find(sessionId)

    //     if (session) {
    //         var msg: Message<any> = {
    //             type: 'joined',
    //             payload: session.id
    //         }

    //         socket.join(session.id)
    //         manager.join(session.id, peer)

    //         socket.emit('joined', msg)
    
    //         msg = {
    //             type: 'updated',
    //             payload: {
    //                 id: session.id,
    //                 peers: session.peers
    //             }
    //         }

    //         broadcastTo(sessionId, msg)
    //     }
    // })

    // onLeave
    // socket.on("leave", (sessionId: string, peer: Peer) => {
    //     var session = manager.find(sessionId)

    //     var msg: Message<any> = {
    //         type: 'left',
    //         payload: sessionId
    //     }

    //     socket.leave(sessionId)
    //     manager.leave(sessionId, peer)

    //     socket.emit('left', msg)

    //     msg = {
    //         type: 'updated',
    //         payload: {
    //             id: sessionId,
    //             peers: session?.peers
    //         }
    //     }

    //     publishTo(sessionId, msg)
    // })

    socket.on('read:sessions', (msg: Message<any>, cb: (ack: Ack<any>) => void) => {
        var ack = {
            type: msg.type,
            status: 'ok',
            payload: manager.sessions
        }

        cb(ack)
    })
})

io.on('disconnect', () => {
    console.log('disconnect a socket')

})
