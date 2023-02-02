import { types, Device } from 'mediasoup-client'
import { Consumer } from 'mediasoup-client/lib/Consumer'
import { Producer } from 'mediasoup-client/lib/Producer'
import { Transport } from 'mediasoup-client/lib/Transport'

export class Session {
    id: string = ''
    device: types.Device
    producers: Map<string, types.Producer>
    consumers: Map<string, types.Consumer>
    transports: Map<string, types.Transport>

    constructor() {
        this.device = new Device()
        this.producers = new Map()
        this.consumers = new Map()
        this.transports = new Map()
    }

    add(item: Producer|Transport|Consumer) {
        if (item instanceof Producer) {
            this.producers.set(item.id, item)
        }
        else if (item instanceof Consumer) {
            this.consumers.set(item.id, item)
        }
        else if (item instanceof Transport) {
            this.transports.set(item.id, item)
        }
    }

    close() {
        this.producers.forEach(p => p.close())
        this.consumers.forEach(c => c.close())
        this.transports.forEach(t => t.close())
    }
}
