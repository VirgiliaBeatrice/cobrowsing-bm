"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const electron_1 = require("electron");
function init() {
    process.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        console.log('Parent message: ' + JSON.parse(msg.payload));
        if (msg.type == "get_sources") {
            yield onGetSources();
        }
    }));
}
exports.init = init;
function onGetSources() {
    return __awaiter(this, void 0, void 0, function* () {
        var sources = yield electron_1.desktopCapturer.getSources({ types: ['screen', 'window'] });
        if (process.send) {
            process.send(JSON.stringify(sources));
        }
    });
}
