import { ipcRenderer } from "electron";
import * as mediasoup from "mediasoup-client"
// import pino from 'pino'
import { io } from 'socket.io-client'

const logger = console
const handlerName = mediasoup.detectDevice()

if (handlerName) {
  logger.info("detect handler: %s", handlerName)
}
else {
  logger.warn("no suitable device")
}

const socket = io("http://www.virbea.com") 
const device = new mediasoup.Device()

function sendMsRequest(request: any, cb: (response: any) => void) {
  socket.emit('ms-request', request, cb)
}

async function getRouterRtpCapabilites() {
  return new Promise<mediasoup.types.RtpCapabilities>(
    resolve => {
      sendMsRequest(
        {
          method: 'getRouterRtpCapabilities',
        },
        (response) => {
          logger.info(response)

          resolve(response.payload as mediasoup.types.RtpCapabilities)
        })
    })
 
}

async function getTransportOptions() {
  return new Promise<mediasoup.types.TransportOptions>(
    resolve => {
      sendMsRequest(
        {
          method: "getTransportOptions",
        },
        (response) => {
          logger.info(response)

          resolve(response.payload)
        }
      )
    }
  )
}

interface TransportInfo {
  id: string,
  iceParameters: mediasoup.types.IceParameters,
  iceCandidates: mediasoup.types.IceCandidate,
  dtlsParameters: mediasoup.types.DtlsParameters,
  sctpParameters: mediasoup.types.SctpParameters
}

async function connectTransport(dtlsParameters: mediasoup.types.DtlsParameters) {
  return new Promise<void>(
    resolve => {
      sendMsRequest(
        {
          method: 'connectProducer',
          payload: dtlsParameters
        },
        (response) => {
          logger.info(response)

          resolve()
        }
      )
    }
  )
}

async function createProducer(parameters: {
  kind: mediasoup.types.MediaKind;
  rtpParameters: mediasoup.types.RtpParameters;
  appData: Record<string, unknown>;
}) {
  return new Promise<void>(
    resolve => {
      sendMsRequest(
        {
          method: 'createProducer',
          payload: parameters
        },
        (response) => {
          logger.info(response)

          resolve()
        }
      )
    }
  )
}

let transport: mediasoup.types.Transport

async function start() {
  var rtp = await getRouterRtpCapabilites()

  await device.load({ routerRtpCapabilities: rtp })

  var options = await getTransportOptions()

  transport = device.createSendTransport(options)

  transport.on('connect', async ({dtlsParameters}) => {
    // call transport.connect() on server
    await connectTransport(dtlsParameters)
  })

  transport.on('produce', async (parameters) => {
    // create producer on server
    await createProducer(parameters)
  })

  if (device.canProduce("video")) {
    var stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})

    await transport.produce({track: stream.getVideoTracks()[0]})
  }

}

socket.on('connect', () => {

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