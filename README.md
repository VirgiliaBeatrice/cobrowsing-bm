### Submodule
#### build robotjs from source for electron
[Ref](https://github.com/octalmage/robotjs/wiki/Electron)
1. Install package
    > npm i -D electron-rebuild
2. Check electron-related version, and rebuild
    > cd ./lib/robotjs
    > npm rebuild --runtime=electron --target=22.0.0 --disturl=https://atom.io/download/atom-shell --abi=93
    > cd ../../
    > ./node_modules/.bin/electron-rebuild