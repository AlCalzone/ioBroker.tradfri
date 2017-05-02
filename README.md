![Logo](admin/tradfri.png)
ioBroker.tradfri
=================

[![Build Status](https://travis-ci.org/AlCalzone/iobroker.tradfri.svg?branch=master)](https://travis-ci.org/AlCalzone/iobroker.tradfri)

## Installation on Raspberry PI
Installation tested on Linux and MacOS with NodeJS >= 6. NodeJS 4 support is in the works.

Requires a Trådfri gateway in your home network.

0. Make sure you have git installed. If not: `sudo apt-get git-core`
1. Install this adapter via the ioBroker GUI -> This will result in an error
2. Open the console and navigate to `/opt/iobroker/node_modules/iobroker.tradfri`
3. There, run `sudo npm install --production --unsafe-perm`, this will take a while.
4. If neccessary, add an adapter instance, then configure it by entering the IP/hostname of your gateway and the security code that can be found under that.

## Changelog

#### 0.1.0 (2017-05-02)
* (AlCalzone) initial release. 
* Functionality limited to controlling lightbulbs.

#### 0.0.0
* (AlCalzone) not ready yet!

## License
The MIT License (MIT)

Copyright (c) 2017 AlCalzone <d.griesel@gmx.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
