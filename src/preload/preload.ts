import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron";

export type API  = {
  host: string,
  on: (channel: string, cb: (ev: IpcRendererEvent, ...args: any[]) => void) => void;
}

const api: API = {
  host: "http://jp.virbea.com:8080",
  on: (channel, cb) => ipcRenderer.on(channel, (ev, argv) => cb(ev, argv))
}

contextBridge.exposeInMainWorld('api', api)