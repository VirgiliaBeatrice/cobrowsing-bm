import { io, Socket } from "socket.io-client";

const DOMAIN = "http://localhost:3000"
let socket: Socket


interface Cursor {
    x: number,
    y: number,
}

interface Peer {
    id: string,
    name?: string,
    color?: string,
    cursor?: Cursor,
    sessionId?: string,
    mouseEvent?: any,
    keyEvent?: any,
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

export const connect = () => {
    socket = io(DOMAIN, {
        withCredentials: true,
    })
}

export const init = () => {
    registerHandlers()
}

export const sendTo = (msg: ClientMessage<any>) => {
    socket.emit(msg.type, msg)
}

export const fetchSession = (sessionId: string) => {
    sendTo({
        type: 'read:session',
        payload: sessionId
    })
}

export const fetchSessions = () => {
    sendTo({
        type: 'read:sessions',
    })
}

export const updateLocal = (local: Peer) => {
    sendTo({
        type: 'update:peer',
        payload: local
    })
}

export const joinSession = (local: Peer) => {
    sendTo({
        type: 'update:peer',
        payload: local
    })
}

export const leaveSession = (local: Peer) => {
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
    socket.on('create:session', onCreateSession)
    socket.on('create:peer', onCreatePeer)

    // Read
    socket.on('read:session', onReadSession)
    socket.on('read:sessions', onReadSessions)

    // Update
    socket.on('update:peer', onUpdatePeer)
    socket.on('update:session', onUpdateSession)

    // Delete
    socket.on('delete:session', onDeleteSession)
    socket.on('delete:peer', onDeletePeer)
}



const onCreateSession = () => {

}

const onCreatePeer = () => {

}

const onReadSession = () => {

}

const onReadSessions = (msg: ServerMessage<any>) => {
    console.log(msg)
}

const onUpdatePeer = () => {

}

const onUpdateSession = () => {

}

const onDeleteSession = () => {

}

const onDeletePeer = () => {

}



// registerHandlers()