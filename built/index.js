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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const robot = __importStar(require("@jitsi/robotjs"));
const message_1 = require("./message");
const path_1 = __importDefault(require("path"));
console.log(process.versions);
console.log(robot.getMousePos());
const createWindow = () => __awaiter(void 0, void 0, void 0, function* () {
    const win = new electron_1.BrowserWindow({
        transparent: true,
        frame: false,
        fullscreen: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true
        },
    });
    win.setAlwaysOnTop(true, "screen-saver");
    win.setIgnoreMouseEvents(true, {
        forward: true
    });
    win.loadFile('index.html');
    win.webContents.openDevTools();
    var sources = yield electron_1.desktopCapturer.getSources({ types: ['screen'] });
    console.info(sources);
    for (var source of sources) {
        if (source.display_id === "0") {
            win.webContents.send('SET_SOURCES', source.id);
        }
    }
});
electron_1.app.whenReady().then(() => __awaiter(void 0, void 0, void 0, function* () {
    (0, message_1.init)();
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
}));
