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

interface AppConfiguration {
    chromePath: string,
    xvfbPath: string,
}


type ClientCallback<T> = (ack: Response<T>) => void
type RecvEvent<T, K> = (msg: Message<T>, cb: ClientCallback<K>) => void

interface ClientToServerEvents {
    [key: string]:  RecvEvent<any, any>;

    "read:sessions": RecvEvent<any, any>,
    "create:session": RecvEvent<any, any>,
    "create:peer": RecvEvent<any, any>,
}

interface ServerToClientEvents {
    [key: string]: (...args: any[]) => void;

    "default": (msg: Message<any>) => void
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


interface Peer {
    id: string,
    name: string,
    color: string,
}

interface Session {
    id: string,
    name: string,

    electron: ChildProcessWithoutNullStreams | undefined,

    participants: Map<string, Peer>
}

const CHROME_PATH = os.platform() == 'win32'? 
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : ""

const CHROME_ARGS = ["--new-window", "--start-maximized",  "--incognito"]

class SessionManager {
    private _sessions: Map<string, Session> = new Map<string, Session>()
    _participants: Map<string, Socket> = new Map<string, Socket>()

    constructor() { }

    create() {
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

        var id = uuid()
        var session: Session = {
            id: id,
            name: `Session[${id}]`,
            electron: electron,
            participants: new Map(),
        }

        this._sessions.set(session.id, session)

        return session
    }

    stop(sessionId: string) {
        // kill all child process

        // remove from session
        this._sessions.delete(sessionId)
    }

    join(sessionId: string, peerId: string) {
        var session = this._sessions.get(sessionId)
        var peer = {
            id: peerId,
            name: '',
            color: '#FFFFFF',
        }

        session!.participants.set(peerId, peer)
    }

    leave(sessionId: string, peerId: string) {
        var session = this._sessions.get(sessionId)

        session!.participants.delete(peerId)
    }

    find(sessionId: string): Session | undefined {
        return this._sessions.get(sessionId)
    }

    getPeers(sessionId: string): Array<Peer> {
        var session = this._sessions.get(sessionId) 

        return [...session!.participants.values()]
    }

    get sessions(): Array<Session> {
        return [...this.sessions]
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

interface Response<T> {
    status: string | 'ok' | 'failed',
    payload: T | undefined
}

io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    logger.info("A remote connection has been established.")

    // create peer when first connection according to socket id
    var id = socket.id

    // onCreateSession
    socket.on("create", (msg, cb) => {
        logger.info(`Request: ${msg.type}`)
    
        let response: Response<any> = {
            status: 'failed',
            payload: undefined
        };

        if (msg.type === "session") {
            var session = manager.create()

            response = {
                status: 'ok',
                payload: session.id
            }
        }

        cb(response)
    })

    socket.on('read', (msg, cb) => {
        logger.info(`[R] - ${msg.type}`)

        let response: Response<any> = {
            status: 'failed',
            payload: undefined
        }

        if (msg.type === 'sessions') {
            var sessions = manager.sessions

            response.status = 'ok'
            response.payload = sessions

            cb(response)
        }
        else if (msg.type === 'session') {
            var sessionId = msg.payload as string

            response.status = 'ok'
            response.payload = manager.find(sessionId)

            cb(response)
        }
    })

    socket.on('update', (msg, cb) => {
        var response = {
            status: 'ok',
            payload: undefined
        }

        if (msg.type === 'color') {
            var { sessionId, color } = msg.payload
            var session = manager.find(sessionId)

            cb(response)
        }
        else if (msg.type === 'session:join') {
            var sessionId = msg.payload
            var session = manager.find(sessionId)
            var localId = socket.id

            if (session) {
                manager.join(session.id, localId)
    
                var response = {
                    status: 'ok',
                    payload: undefined
                }
    
                cb(response)
    
                logger.info(`Peer[${socket.id}] joined. Session[${session.id}]`)
                // publishTo(session.id, )
            }
        }
    })

    socket.on('delete', (msg, cb) => {

    })


    socket.on('disconnect', (reason) => {
        var sessions = manager.sessions.filter(s => s.participants.has(socket.id))

        sessions.forEach(s => s.participants.delete(socket.id))
        logger.info(`Delete participant[${socket.id}], since the connection has been lost. REASON: ${reason}`)
    })
})
