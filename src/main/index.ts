import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron'
import * as robot from '@jitsi/robotjs'
import {init} from './message'
import path from 'path'

// console.log(process.versions);
// console.log(robot.getMousePos())

const createWindow = async() => {
    const win = new BrowserWindow({
        transparent: true,
        frame: false,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    })

    
    win.setAlwaysOnTop(true, "screen-saver")
    win.setIgnoreMouseEvents(true, {
        forward: true
    })
    
    win.loadFile('index.html')

    win.webContents.openDevTools()

    win.webContents.on('did-finish-load', async () => {
        var sources = await desktopCapturer.getSources({types: ['screen']})
    
        console.info(sources)
    
        if (sources.length !== 0) {
            console.info("Send!")
            win.webContents.send('SET_SOURCE', sources[0].id)
        }
    })
    // for (var source of sources) {
    //     if (source.display_id === 'screen:0:0') {
    //         console.info("Send!")
    //         win.webContents.send('SET_SOURCES', source.id)
    //     }
    // }
}

app.whenReady().then(async () => {
    init()
    createWindow()

    // robot.setMouseDelay(2)

    // var twoPI = Math.PI * 2.0;
    // var screenSize = robot.getScreenSize();
    // var height = (screenSize.height / 2) - 10;
    // var width = screenSize.width;

    // for (var x = 0; x < width; x++)
    // {
    //     var y = height * Math.sin((twoPI * x) / width) + height;
    //     robot.moveMouse(x, y);
    // }
})

