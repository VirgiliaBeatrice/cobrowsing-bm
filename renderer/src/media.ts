import * as mediasoup from "mediasoup-client"
import { Consumer } from "mediasoup-client/lib/Consumer"
import { Producer } from "mediasoup-client/lib/Producer"
import { resolve } from "path";
import { io, Socket } from 'socket.io-client'

window.localStorage.setItem('debug', 'mediasoup-client:WARN* mediasoup-client:ERROR* mediasoup-client:DEBUG*');

const api: any = (window as any).api

const handlerName = mediasoup.detectDevice()

if (handlerName) {
  console.info("detect handler: %s", handlerName)
}
else {
  console.warn("no suitable device")
}

let socket: Socket
let device: mediasoup.types.Device
let monitoringProducer: mediasoup.types.Producer

export function create() {
  socket = io("http://jp.virbea.com:8080") 
  device = new mediasoup.Device()

  socket.on('connect', () => {
    console.log('connect to server.')
  })
  
  socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
  });

  start()
}


function sendMsRequest(request: any, cb: (response: any) => void) {
  socket.emit('ms-request', request, cb)
}

async function setRemoteRtpCapabilites(RtpCapabilities: mediasoup.types.RtpCapabilities) {
  return new Promise<boolean>(
    resolve => {
      sendMsRequest(
        {
          method: 'setClientRtpCapabilities',
          payload: RtpCapabilities
        },
        (response) => {
          console.info(response)

          resolve(true)
        }
      )
    }
  )
}

async function getRouterRtpCapabilites() {
  return new Promise<mediasoup.types.RtpCapabilities>(
    resolve => {
      sendMsRequest(
        {
          method: 'getRouterRtpCapabilities',
        },
        (response) => {
          console.info(response)

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
          console.info(response)

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
          console.info(response)

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
  return new Promise<string>(
    resolve => {
      sendMsRequest(
        {
          method: 'createProducer',
          payload: parameters
        },
        (response) => {
          console.info(response)

          resolve(response.payload as string)
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
  
  transport.on('connectionstatechange', (state) => {
    console.info("Connection State: " + state)
  })

  transport.on('connect', async ({dtlsParameters}, cb, eb) => {
    try {
      console.info("Transport has been connected.")
      // call transport.connect() on server
      await connectTransport(dtlsParameters)

      cb()
    }
    catch (error) {
      eb(error as Error)
    }
  })

  transport.on('produce', async (parameters, cb, eb) => {
    try {
      console.info("Start to produce.")
  
      // create producer on server
      var response = await createProducer(parameters)

      cb({ id: response })
    }
    catch (error) {
      eb(error as Error)
    }
  })



  transport.observer.on('close', () => {
    console.info('transport closed.')
  })

  transport.observer.on('newproducer', (producer: Producer) => {
    console.info('we have a new producer ' + producer.id)

    producer.observer.on("close", () => {
        console.info('close')
    })

    producer.observer.on("pause", () => {
      console.info('pause')
      
    })

    producer.observer.on("resume", () => {
      console.info('resume')
      
    })

    producer.observer.on("traceended", () => {
      console.info('traceended')
      
    })
  })

  transport.observer.on('newconsumer', (consumer: Consumer) => {
    console.info('new consumer created [id:%s]', consumer.id)
  })

  console.info("Can device produce? " + device.canProduce("video"))
  if (device.canProduce("video")) {
    var cameras = await navigator.mediaDevices.enumerateDevices()

    var camera = cameras[1]

    var constraints = {
      audio: false,
      video: {
        deviceId: camera.deviceId
      }
    }
    console.info(cameras)

    try {
      var stream = await navigator.mediaDevices.getUserMedia(constraints)

      var producer = await transport.produce({track: stream.getVideoTracks()[0]})

      monitoringProducer = producer

      console.info(await producer.getStats())

      producer.resume()
    }
    catch (error) {
      if (error instanceof Error) {
        console.error("Failed!")
      } 
    }

  }

}
