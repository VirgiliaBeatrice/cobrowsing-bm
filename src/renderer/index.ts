import { IpcRendererEvent } from "electron";

declare type API  = {
  host: string,
  on: (channel: string, cb: (ev: IpcRendererEvent, ...args: any[]) => void) => void;
}
declare global {
  interface Window {
    api: API
  }
}

const api = window.api

api.on('SET_SOURCE', async (ev, sourceId: string) => {
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