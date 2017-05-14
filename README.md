![Logo](admin/tradfri.png)
ioBroker.tradfri
=================


**Tests:** Linux/Mac: [![Build Status](https://travis-ci.org/AlCalzone/iobroker.tradfri.svg?branch=master)](https://travis-ci.org/AlCalzone/iobroker.tradfri) 
Windows: [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/AlCalzone/ioBroker.tradfri?branch=master&svg=true)](https://ci.appveyor.com/project/AlCalzone/ioBroker-tradfri/)

## Requirements
* Linux (e.g. Raspberry Pi) / OSX / Windows
* NodeJS >= 6.x
* Trådfri gateway

WARNING: NodeJS 4.x doesn't seem to work (SIGABRT). Please upgrade to 6.x and reinstall this adapter if neccessary.

Might need additional build tools. If anything is unclear, please ask and provide error details.

## Installation on Raspberry PI
1. Make sure you have git installed. If not: `sudo apt-get install git-core`
1. Install this adapter via command line. Installation using the ioBroker admin GUI will result in errors.
    1. `cd /opt/iobroker`
    1. `sudo npm install https://github.com/AlCalzone/iobroker.tradfri --production --unsafe-perm`
1. In the ioBroker GUI, add an adapter instance. If this results in an error, try again.
1. Configure the instance by entering the IP/hostname of your gateway and the security code that can be found under that.

## Changelog

#### 0.1.2 (2017-05-06)
* (AlCalzone) Color temperature of lightbulbs is now expressed in terms of 0 (cold) - 100% (warm).

#### 0.1.1 (2017-05-04)
* (AlCalzone) Added support for NodeJS 4.X and building the dependencies on Windows systems

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
