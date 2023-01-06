"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const robot = __importStar(require("@jitsi/robotjs"));
console.log(process.versions);
console.log(robot.getMousePos());
const createWindow = () => {
    const win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        transparent: true,
        frame: false,
        fullscreen: true
    });
    win.setAlwaysOnTop(true, "screen-saver");
    win.setIgnoreMouseEvents(true, {
        forward: true
    });
    win.loadFile('index.html');
};
electron_1.app.whenReady().then(() => {
    createWindow();
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
});
