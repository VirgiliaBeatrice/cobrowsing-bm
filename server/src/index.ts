import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import * as os from 'os'
import { Server, Socket } from "socket.io"
import { uuid } from 'uuidv4'
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { idText, preProcessFile } from "typescript";
import { session } from "electron";

interface Peer {
    id: string,
    name: string,
    color: string,
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

const manager = new SessionManager()
const httpServer = createServer()
const io = new Server(httpServer, {
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

interface Message<T> {
    type: 'connected' | 'created' | string,
    payload?: T | any
}

const broadcastTo = (id: string, msg: Message<any>) => {
    // var session = manager.sessions.find(s => s.id == id)
    // var msg = {
    //     type: 'update',
    //     payload: session
    // }

    io.to(id).emit(msg.type, msg)
}

io.on("connnection", (socket: Socket) => {
    console.log("got a connection")
    // emit connected
    var msg = {
        type: 'connected',
        payload: manager.sessions
    }

    socket.emit("connected", msg)

    // onCreate
    socket.on("create", () => {
        var session = manager.create(uuid())
        var msg: Message<any> = {
            type: 'created',
            payload: session.id
        }

        socket.emit('created', msg)

        // msg = {
        //     type: 'updated',
        //     payload: {
        //         id: session.id,
        //         peers: session.peers
        //     }
        // }

        // broadcastTo(session.id, msg)

        // io.to(sessionId).emit('update_info', {
        //     id: sessionId,
        //     userList: io.sockets.in(sessionId).fetchSockets()
        // })
    })

    // onJoin
    socket.on('join', (sessionId: string, peer: Peer) => {
        var session = manager.find(sessionId)

        if (session) {
            var msg: Message<any> = {
                type: 'joined',
                payload: session.id
            }

            socket.join(session.id)
            manager.join(session.id, peer)

            socket.emit('joined', msg)
    
            msg = {
                type: 'updated',
                payload: {
                    id: session.id,
                    peers: session.peers
                }
            }

            broadcastTo(sessionId, msg)
        }
    })

    // onLeave
    socket.on("leave", (sessionId: string, peer: Peer) => {
        var session = manager.find(sessionId)

        var msg: Message<any> = {
            type: 'left',
            payload: sessionId
        }

        socket.leave(sessionId)
        manager.leave(sessionId, peer)

        socket.emit('left', msg)

        msg = {
            type: 'updated',
            payload: {
                id: sessionId,
                peers: session?.peers
            }
        }

        broadcastTo(sessionId, msg)
    })

    socket.on('read:sessions', (rev) => {
        console.info(rev)
        var msg = {
            type: 'read:sessions',
            payload: manager.sessions
        }

        console.info(msg)
        socket.emit('read:sessions', msg)
    })
})

