import { IpcRendererEvent } from "electron";
import { connect, consume, produce, Session } from 'cobrowsing-mediasoup-client/dist'
import { application } from "express";
import "./style.css";
import { Svg, SVG } from "@svgdotjs/svg.js"

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
const store = {
  session: new Session()
}

console.log(api)

async function start() {
  const URL = "http://131.112.183.91"
  var socket = await connect(URL)
  store.session.id = socket.id
}

api.on('SET_SOURCE', async (ev, sourceId: string) => {
  console.info(`Got SET_SOURCE event`)
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
        
        await handleStream(stream)
      } catch (e) {
        if (e instanceof Error) {
            console.error(e);
          }
      }
})

async function handleStream (stream: MediaStream) {
  var tracks = stream.getVideoTracks()

  await start()
  var result = await produce(store.session.device, tracks[0])

  if (result) {
    store.session.add(result.transport)
    store.session.add(result.producer)
  }
    // const video = document.querySelector('video')
    // video.srcObject = stream
    // video.onloadedmetadata = (e) => video.play()
}
  
function handleError (e: Error) {
  console.log(e)
}

const stage = SVG().addTo('body').size('100%', '100%')
console.log(stage)

var cursor = stage.circle(20, 20)
  .transform({translate: {x:-10, y: -10},})
  .attr({ fill: "#f06" })
  .move(20, 20)

// body.addEventListener('mouseover', (ev) => {
//   console.info(`mouseover on body, ${ev.pageX}, ${ev.pageY}`)
//   cursor.move(ev.pageX, ev.pageY)
// })

