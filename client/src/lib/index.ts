import { io, Socket } from "socket.io-client";
import { makeAutoObservable, observable, action } from "mobx";
import { createContext, useContext } from "react"
import { Session } from "inspector";
import { create } from "domain";
// import { uuid } from "uuidv4";

interface Cursor {
    x: number,
    y: number,
}

class Peer {
    id: string = ""
    sessionId: string = ""
    name: string = ""
    color: string = "#FFFFFF"
    cursor: Cursor | undefined = undefined
}

interface PeerDTO {
    id: string,
    name?: string,
    color?: string,
    cursor?: Cursor,
    sessionId?: string,
    mouseEvent?: any,
    keyEvent?: any,
}

interface Ack<T> {
    type: string,
    status: string,
    payload?: T | any
}

interface SessionInfo {
    id: string,
    name: string,
}

interface ServerMessage<T> {
    type: 'connected' | 'created' | string,
    payload?: T | any
}

export interface ClientMessage<T> {
    type: 'create' | 'read' | 'update' | 'delete' | string,
    payload?: T | any
}
export class Store {
    sessions: Array<SessionInfo> = []
    local: Peer = new Peer()
    
    constructor() {
        makeAutoObservable(this, {
            sessions: observable,
            fetch: action
        })
    }

    fetch() {
        sendTo(
            {
                type: 'read:sessions',
            },
            (ack: Ack<any>) => {
                if (ack.status === 'ok') {
                    console.info(ack.payload)

                    this.setSessions(ack.payload)
                }
            }
        )
    }

    setLocal(id: string) {
        this.local.id = id
    }

    setSessions(sessions: Array<SessionInfo>) {
        this.sessions = sessions
    }

    join(id: string) {
        sendTo(
            { 
                type: 'update:peer.session_id',
                payload: {
                    id: this.local.id,
                    sessionId: id
                }
            },
            (ack: Ack<any>) => {
                if (ack.status === 'ok') {
                    console.info(`Joined: ${id}`)
                }
            }
        )
    }

    updateCursor(cursor: Cursor) {
        sendTo(
            {
                type: 'update:peer.cursor',
                payload: {
                    id: this.local.id,
                    sessionId: this.local.sessionId,
                    cursor: cursor
                }
            },
            (ack: Ack<undefined>) => {
                if (ack.status === 'ok') {
                    
                }
            }
        )
    }
}

export const store = new Store()

const DOMAIN = "http://localhost:3000"
let socket: Socket




export const connect = () => {
    socket = io(DOMAIN, {
        withCredentials: true,
    })
}

export const init = () => {
    registerHandlers()

    createLocalPeer()
}

export const createLocalPeer = () => {
    sendTo(
        {
            type: 'create:peer',
        },
        (ack: Ack<string>) => {
            var id = ack.payload

            store.setLocal(id)
        }
    )
}

type AckCallback = (...args: any) => void

export const sendTo = (msg: ClientMessage<any>, cb: AckCallback = () => {}) => {
    socket.emit(msg.type, msg, cb)
}

export const fetchSession = (sessionId: string) => {
    sendTo({
        type: 'read:session',
        payload: sessionId
    })
}

export const createSession = () => {
    sendTo(
        {
            type: 'create:session',
        },
        (ack: Ack<any>) => {
            if (ack.status === 'ok') {
                console.info(ack.payload)
            }
        }
    )
}

// export const fetchSessions = (): any => {
//     sendTo(
//         {
//             type: 'read:sessions',
//         },
//         (ack: Ack<any>) => {
//             if (ack.status === 'ok') {
//                 console.info(ack.payload)
//             }
//         }
//     )
// }

export const updateLocal = (local: PeerDTO) => {
    sendTo({
        type: 'update:peer',
        payload: local
    })
}

export const joinSession = (local: PeerDTO) => {
    sendTo({
        type: 'update:peer',
        payload: local
    })
}

export const leaveSession = (local: PeerDTO) => {
    sendTo({
        type: 'update:peer',
        payload: local
    })
}

const registerHandlers = () => {
    socket.on('connected', (msg: ServerMessage<any>) => {
        console.log(msg)
    })
    socket.on('connect', () => {
        console.log("socket connect!")
    })
    
    socket.on('disconnect', (reason) => {
        console.log(reason)
    })


    // Create
    // socket.on('create:session', onCreateSession)
    // socket.on('create:peer', onCreatePeer)

    // // Read
    // socket.on('read:session', onReadSession)
    // socket.on('read:sessions', onReadSessions)

    // // Update
    // socket.on('update:peer', onUpdatePeer)
    // socket.on('update:session', onUpdateSession)

    // // Delete
    // socket.on('delete:session', onDeleteSession)
    // socket.on('delete:peer', onDeletePeer)
}

// registerHandlers()

export const StoreContext = createContext<Store>((null as unknown) as Store)
export const useStores = () => useContext(StoreContext)