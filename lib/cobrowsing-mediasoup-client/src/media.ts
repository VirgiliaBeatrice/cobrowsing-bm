import fs from "fs";
import * as mediasoup from "mediasoup-client"
import { Consumer } from "mediasoup-client/lib/Consumer"
import { Producer } from "mediasoup-client/lib/Producer"
import path, { resolve } from "path";
import { io, Socket } from 'socket.io-client'
import { config } from './config'

window.localStorage.setItem('debug', 'mediasoup-client:WARN* mediasoup-client:ERROR* mediasoup-client:DEBUG*');

const handlerName = mediasoup.detectDevice()

if (handlerName) {
  console.info("detect handler: %s", handlerName)
}
else {
  console.warn("no suitable device")
}

let socket: Socket
// let device: mediasoup.types.Device
let isStart: boolean = false



export async function connect(url: string) {
  return new Promise<Socket>(
    (resolve, reject)=> {
      socket = io(url) 
    
      socket.on('connect', () => {
        console.log('connect to server.')

        resolve(socket)
      })
      
      socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);

        reject("connect error")
      });
    }
  )
}


// export async function create() {
//   return new Promise<boolean>(
//     (resolve, reject)=> {
//       socket = io("http://131.112.183.91") 
//       device = new mediasoup.Device()
    
//       socket.on('connect', () => {
//         console.log('connect to server.')
//         isStart = true

//         resolve(true)
//       })
      
//       socket.on("connect_error", (err) => {
//         console.log(`connect_error due to ${err.message}`);

//         reject("connect error")
//       });
//     }
//   )
// }

// export async function produce(track: MediaStreamTrack) {
//   if (isStart) {
//     await startProduce(track)
//   }
//   else {
//     console.error("Server is not started.")
//   }
// }

// export async function consume() {
//   var ms = await startConsume()

//   const video = document.getElementById('video') as HTMLVideoElement

//   console.log(video)
//   console.log(ms.getVideoTracks())
//   video.srcObject = ms
//   await video.play()
// }

function sendMsRequest(request: any, cb: (response: any) => void) {
  socket.emit('ms-request', request, cb)
}

export async function getAllValidProducers() {
  return new Promise<string[]>(
    resolve => {
      sendMsRequest(
        {
          method: 'getProducers',
        },
        (reponse) => {
          resolve(reponse.payload as string[])
        }
      )
    }
  )
}

export async function getRouterRtpCapabilites() {
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

interface ConnectTransportParamters {
  id: string,
  dtlsParameters: mediasoup.types.DtlsParameters,
}


interface Response<T> {
  method: string,
  payload: T
}

export async function createTransport(options: any) {
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

export async function connectTransport(parameters: ConnectTransportParamters) {
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

export async function createProducer(transportId: string, options: mediasoup.types.ProducerOptions) {
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

export async function createConsumer(transportId: string, options: RequestConsumerOptions) {
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

export async function resumeConsumer(consumerId: string) {
  return new Promise<void>(
    resolve => {
      sendMsRequest(
        {
          method: 'resumeConsumer',
          payload: { id: consumerId }
        },
        (response) => {
          console.info(response)

          resolve()
        }
      )
    }
  )
}

interface ProduceResult {
  transport: mediasoup.types.Transport,
  producer: mediasoup.types.Producer
}

export async function produce(device: mediasoup.types.Device, track: MediaStreamTrack): Promise<ProduceResult | undefined> {
  // 1. get router rtpCapabilities from server
  var rtp = await getRouterRtpCapabilites()

  // 2. Initialize device with routerRtpCapabilities
  await device.load({ routerRtpCapabilities: rtp })

  // 3. create remote transport for producing media
  var transportOptions = await createTransport({ type: 'produce' })

  // console.info(transportOptions)

  // 4. create local transport according to the information of corresponding remote transport
  console.info({...transportOptions, ...config})
  var transport = device.createSendTransport({...transportOptions, ...config})

  // store.session?.transports.set(transport.id, transport)
  
  transport.on('connectionstatechange', (state) => {
    console.info("Connection State: " + state)
  })

  transport.on('connect', async ({dtlsParameters}, cb, eb) => {
    try {
      console.info("Transport has been connected.")

      // 5.1. when 'connect' emitted, call transport.connect() on server
      var id = transport!.id
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

  var kind = track.kind as mediasoup.types.MediaKind
  console.info("Can device produce? " + device.canProduce(kind))

  if (device.canProduce(kind)) {
    console.info(`Prepared track: ${track.label}`)
    
    // 5. start to produce on local
    var producer = await transport.produce({ track })
    // store.session?.producers.set(producer.id, producer)

    return {transport, producer}
  }
  else {
    return undefined
  }
}

export async function consume(device: mediasoup.types.Device, producerId: string) {
  var rtpCapabilities = device.rtpCapabilities

  // 1. create transport on server for media consuming
  var transportOptions = await createTransport({ type: 'consume' })

  // 2. create consumer on server
  var consumerOptions = await createConsumer(transportOptions.id, {rtpCapabilities, producerId})

  // 3. create transport on local according to the server information
  var transport = device.createRecvTransport({...transportOptions, ...config})

  // store.session?.transports.set(transport.id, transport)

  transport.on("connect", async ({ dtlsParameters }, cb, eb) => {
    try {
      var id = transport.id

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

  // store.session?.consumers.set(consumer.id, consumer)

  // const {track} = consumer

  await resumeConsumer(consumer.id)

  consumer.resume()

  // return new MediaStream([track])

  return {transport, consumer}
}