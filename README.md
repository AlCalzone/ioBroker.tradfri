![Logo](admin/tradfri.png)
ioBroker.tradfri
=================

**Tests:** Linux/Mac: [![Build Status](https://travis-ci.org/AlCalzone/iobroker.tradfri.svg?branch=master)](https://travis-ci.org/AlCalzone/iobroker.tradfri) 
Windows: [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/AlCalzone/ioBroker.tradfri?branch=master&svg=true)](https://ci.appveyor.com/project/AlCalzone/ioBroker-tradfri/)

================


## Requirements
* Linux (e.g. Raspberry Pi) / OSX / Windows
* NodeJS >= 6.x
* Trådfri gateway

Might need additional build tools. If anything is unclear, please ask and provide error details.

## Installation
1. Install prerequisites
	1. Linux/Raspberry Pi: Make sure you have git installed. If not: `sudo apt-get install git-core`
	1. Windows: Make sure you have git installed. If not, download the correct version at https://git-scm.com/download/win
	1. OSX: ??? Probably like Linux.
1. Install this adapter over the iobroker admin GUI or via  
`iobroker url https://github.com/AlCalzone/ioBroker.tradfri ` 
1. In the ioBroker GUI, add an adapter instance. 
1. Configure the instance by entering the IP/hostname of your gateway and the security code that can be found on the label at the bottom.

## Changelog

#### 0.1.4 (2017-08-09)
* (AlCalzone) Switched to TypeScript (unreleased)

#### 0.1.3 (2017-07-21)
* (AlCalzone) Reboot of the adapter without 3rd party libraries.

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
