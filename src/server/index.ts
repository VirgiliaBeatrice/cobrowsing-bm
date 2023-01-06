import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import * as os from 'os'
import { Server } from "socket.io"

interface Session {
    electron: ChildProcessWithoutNullStreams, 
    xvfb: ChildProcessWithoutNullStreams
}

const process = spawn("electron", {
    cwd: os.homedir(),

})

const io = new Server(30001, {

})

io.on("connnection", (socket) => {
    // socket.on()
})
// process.pid