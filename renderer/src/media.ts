import fs from "fs";
import * as mediasoup from "mediasoup-client"
import { Consumer } from "mediasoup-client/lib/Consumer"
import { Producer } from "mediasoup-client/lib/Producer"
import path, { resolve } from "path";
import { io, Socket } from 'socket.io-client'
import { config } from './config'
window.localStorage.setItem('debug', 'mediasoup-client:WARN* mediasoup-client:ERROR* mediasoup-client:DEBUG*');

const api: any = (window as any).api

interface Store {
  device: mediasoup.types.Device | undefined,
  consumer: Consumer | undefined,
  consumerTransport: mediasoup.types.Transport | undefined,
  producer: Producer | undefined,
  producerTransport: mediasoup.types.Transport | undefined
}

export const store: Store = {
  device: undefined,
  consumer: undefined,
  consumerTransport: undefined,
  producer: undefined,
  producerTransport: undefined
}

const handlerName = mediasoup.detectDevice()

if (handlerName) {
  console.info("detect handler: %s", handlerName)
}
else {
  console.warn("no suitable device")
}

let socket: Socket
let device: mediasoup.types.Device

export async function create() {
  socket = io("http://jp.virbea.com:8080") 
  device = new mediasoup.Device()

  socket.on('connect', () => {
    console.log('connect to server.')
  })
  
  socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
  });

  await startProduce()
  // var ms = await startConsume()

  // const video = document.getElementById('video') as HTMLVideoElement

  // console.log(video)
  // console.log(ms.getVideoTracks())
  // video.srcObject = ms
  // video.play()
}


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
          console.info(response)

          resolve(response.payload as mediasoup.types.RtpCapabilities)
        })
    })
 
}

async function getTransportOptions(id: string) {
  return new Promise<mediasoup.types.TransportOptions>(
    resolve => {
      sendMsRequest(
        {
          method: "getTransportOptions",
          payload: id
        },
        (response) => {
          console.info(response)

          resolve(response.payload)
        }
      )
    }
  )
}

interface ConnectTransportParamters {
  id: string,
  dtlsParameters: mediasoup.types.DtlsParameters,
}


interface Response<T> {
  method: string,
  payload: T
}

async function createTransport(options: any) {
  return new Promise<mediasoup.types.TransportOptions>(
    resolve => {
      sendMsRequest(
        {
          method: 'createTransport',
          payload: options
        },
        (response: Response<mediasoup.types.TransportOptions>) => {
          console.info(response)

          resolve(response.payload)
        }
      )
    }
  )
}

async function connectTransport(parameters: ConnectTransportParamters) {
  return new Promise<void>(
    resolve => {
      sendMsRequest(
        {
          method: 'connectTransport',
          payload: parameters
        },
        (response) => {
          console.info(response)

          resolve()
        }
      )
    }
  )
}

async function createProducer(transportId: string, options: {
  kind: mediasoup.types.MediaKind;
  rtpParameters: mediasoup.types.RtpParameters;
  appData: Record<string, unknown>;
}) {
  // console.info(options)

  return new Promise<string>(
    resolve => {
      sendMsRequest(
        {
          method: 'createProducer',
          payload: { transportId, options }
        },
        (response) => {
          console.info(response)

          resolve(response.payload as string)
        }
      )
    }
  )
}

interface RequestConsumerOptions {
  producerId: string,
  rtpCapabilities: mediasoup.types.RtpCapabilities
}

async function createConsumer(transportId: string, options: RequestConsumerOptions) {
  return new Promise<mediasoup.types.ConsumerOptions>(
    resolve => {
      sendMsRequest(
        {
          method: 'createConsumer',
          payload: { transportId, options }
        },
        (response) => {
          console.info(response)

          resolve(response.payload as mediasoup.types.ConsumerOptions)
        }
      )
    }
  )
}


async function startProduce() {
  let transport: mediasoup.types.Transport

  // 1. get router rtpCapabilities from server
  var rtp = await getRouterRtpCapabilites()

  // 2. Initialize device with routerRtpCapabilities
  await device.load({ routerRtpCapabilities: rtp })

  // 3. create remote transport for producing media
  var transportOptions = await createTransport({ type: 'produce' })

  // console.info(transportOptions)

  // 4. create local transport according to the information of corresponding remote transport
  console.info({...transportOptions, ...config})
  store.producerTransport = transport = device.createSendTransport({...transportOptions, ...config})
  
  transport.on('connectionstatechange', (state) => {
    console.info("Connection State: " + state)
  })

  transport.on('connect', async ({dtlsParameters}, cb, eb) => {
    try {
      console.info("Transport has been connected.")

      // 5.1. when 'connect' emitted, call transport.connect() on server
      var id = store.producerTransport!.id
      await connectTransport({ id, dtlsParameters})

      cb()
    }
    catch (error) {
      eb(error as Error)
    }
  })

  transport.on('produce', async (parameters, cb, eb) => {
    try {
      console.info(`Start to produce. Id[${transport.id}]`)
  
      // 5.2. when 'produce' emitted, create producer on server
      var response = await createProducer(transport.id, parameters)

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

      let producer

      // 5. start to produce on local
      store.producer = producer = await transport.produce({track: stream.getVideoTracks()[0]})

    }
    catch (error) {
      if (error instanceof Error) {
        console.error("Failed!" + error)
      } 
    }
  }
}

async function startConsume() {
  var rtpCapabilities = device.rtpCapabilities
  var producerId = store.producer!.id

  // 1. create transport on server for media consuming
  var transportOptions = await createTransport({ type: 'consume' })

  // 2. create consumer on server
  var consumerOptions = await createConsumer(transportOptions.id, {rtpCapabilities, producerId})

  // 3. create transport on local according to the server information
  var transport = device.createRecvTransport(transportOptions)

  store.consumerTransport = transport

  transport.on("connect", async ({ dtlsParameters }, cb, eb) => {
    try {
      var id = store.consumerTransport!.id

      // 4.1. when 'connect' emitted, connect transport with server
      await connectTransport({id, dtlsParameters})

      cb()
    } catch (error) {
      eb(error as Error)
    }
  })

  // 4. create local consumer according to the server consumer information
  console.info("consumerOptions" + JSON.stringify(consumerOptions))
  var consumer = await transport.consume(consumerOptions)

  store.consumer = consumer

  const {track} = consumer

  return new MediaStream([track])
}