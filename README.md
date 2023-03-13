## Project
- Electron App
    - Code in `./src`
    - *Code under `./renderer` needs to be copied to `./src/renderer`*
    - Function
        - Capture desktop stream and send to mediasoup server
- Cobrowsing Server
    - Code in `./server`
    - Function
        - Communicate with Electron App instances and Binaural Meet clients
        - Manage Electron App instances
- Cobrowsing Client
    - Code in `./session-client`
    - Function
        - *Should be embedded into Binaural Meet client code*
        - Communicate with Cobrowsing Server

## Submodule
### build robotjs from source for electron
[Ref](https://github.com/octalmage/robotjs/wiki/Electron)
1. Install package
    > npm i -D electron-rebuild
2. Check electron-related version, and rebuild
    > cd ./lib/robotjs
    > npm rebuild --runtime=electron --target=22.0.0 --disturl=https://atom.io/download/atom-shell --abi=93
    > cd ../../
    > ./node_modules/.bin/electron-rebuild


