import {desktopCapturer, ipcMain} from 'electron'

interface Message {
    type: string,
    payload: string
}

export function init() {
    process.on('message', async (msg: Message) => {
        console.log('Parent message: ' + JSON.parse(msg.payload))
    
        if (msg.type == "get_sources") {
            await onGetSources()
        }
    })
}


async function onGetSources() {
    var sources = await desktopCapturer.getSources({ types: [ 'screen', 'window' ]})

    if (process.send) {
        process.send(JSON.stringify(sources))
    }
}
