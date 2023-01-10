import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import * as os from 'os'
import { Server, Socket } from "socket.io"
import { uuid } from 'uuidv4'
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";

interface Session {
    id: string,
    electron: ChildProcessWithoutNullStreams | undefined,
    browser: ChildProcessWithoutNullStreams | undefined,
    monitor: ChildProcessWithoutNullStreams | undefined,
}

const CHROME_PATH = os.platform() == 'win32'? 
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : ""

const CHROME_ARGS = ["--new-window", "--start-maximized",  "--incognito"]

class SessionManager {
    sessionCollection: Array<Session>

    constructor() {
        this.sessionCollection = []
    }

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

        var session = {
            id: id,
            electron: electron,
            browser: browser,
            monitor: monitor
        }

        this.sessionCollection.push(session)

        return session
    }

    stop(id: string) {
        var idx = this.sessionCollection.findIndex(s => s.id == id)

        this.sessionCollection.splice(idx)
    }

    get sessions(): SessionInfo[] {
        return this.sessionCollection.map(s => ({
            id: s.id
        }))
    }
}

const manager = new SessionManager()
const httpServer = createServer()
const io = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io", "https://www.piesocket.com"],
        credentials: true
    }
 })

instrument(io, {
    auth: false,
    mode: 'development'
})

httpServer.listen(30001)
const roomList: Array<string> = []

interface SessionInfo {
    id: string
}

io.on("connnection", (socket: Socket) => {
    // socket.on()
    socket.emit("connected", manager.sessions)

    socket.on("create", () => {
        var roomId = uuid()
        var session = manager.create(roomId)

        socket.join(roomId)
        socket.emit('created', roomId)

        io.to(roomId).emit('update_info', {
            id: roomId,
            userList: io.sockets.in(roomId).fetchSockets()
        })
    })

    socket.on('join', (id: string) => {
        var session = manager.sessions.find(s => s.id == id)

        socket.join(id)
        socket.emit('joined', id)

        io.to(id).emit('update_info', {
            id: id,
            userList: io.sockets.in(id).fetchSockets()
        })
    })

    socket.on("leave", (id: string) => {
        socket.leave(id)
        socket.emit('left')

        io.to(id).emit('update_info', {
            id: id,
            userList: io.sockets.in(id).fetchSockets()
        })
    })
})


const sendTo = (room: string) => {
    io.to(room).emit('')
}
// process.pid
