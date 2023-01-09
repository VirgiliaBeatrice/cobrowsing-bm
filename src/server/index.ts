import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import * as os from 'os'
import { Server, Socket } from "socket.io"
import { uuid } from 'uuidv4'
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";

interface Session {
    id: string,
    electron: ChildProcessWithoutNullStreams,
    browser: ChildProcessWithoutNullStreams,
    monitor: ChildProcessWithoutNullStreams
}



class SessionManager {
    sessions: Array<Session>

    constructor() {
        this.sessions = []
    }

    create(id: string) {
        var electron = spawn("electron", {
            cwd: os.homedir(),

        })
        var browser = spawn("chrome", {
            cwd: os.homedir(),
        })
        var monitor = spawn("xvfb", {
            cwd: os.homedir(),
        })
        var session = {
            id: id,
            electron: electron,
            browser: browser,
            monitor: monitor
        }

        this.sessions.push(session)

        return session
    }

    stop(id: string) {
        var idx = this.sessions.findIndex(s => s.id == id)

        this.sessions.splice(idx)
    }
}

const manager = new SessionManager()
const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
 })

instrument(io, {
    auth: false,
    mode: 'development'
})

httpServer.listen(30001)
const roomList: Array<string> = []

io.on("connnection", (socket: Socket) => {
    // socket.on()
    socket.emit("connected")

    socket.on("create", () => {
        var roomId = uuid()
        var session = manager.create(roomId)

        socket.join(roomId)
        
        socket.emit(roomId)
    })

    socket.on("exit", (id: string) => {
        socket.leave(id)
    })
})
// process.pid
