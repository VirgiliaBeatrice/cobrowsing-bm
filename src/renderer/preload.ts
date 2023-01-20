import { ipcRenderer, contextBridge, IpcMainEvent } from "electron";


export type API  = {
  host: string,
  handleSetSource: (event: IpcMainEvent, ...args: any[]) => void
}

contextBridge.exposeInMainWorld('api', {
  host: "http://jp.virbea.com:8080",
  handleSetSource: (cb) => ipcRenderer.on('SET_SOURCE', cb)
})

ipcRenderer.on('SET_SOURCE', async (ev, sourceId: string) => {
    try {
        // https://github.com/electron/electron/issues/27139#issuecomment-1198014810
        const stream: MediaStream = await (navigator.mediaDevices as any).getUserMedia({
          audio: {
            mandatory: {
                chromeMediaSource: 'desktop'
              }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1280,
              minHeight: 720,
              maxHeight: 720
            }
          }
        })
        handleStream(stream)
      } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
          }
      }
})

function handleStream (stream: MediaStream) {
  stream.getVideoTracks()
    // const video = document.querySelector('video')
    // video.srcObject = stream
    // video.onloadedmetadata = (e) => video.play()
  }
  
  function handleError (e: Error) {
    console.log(e)
  }