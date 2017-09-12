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

## Installation
1. Install this adapter over the iobroker admin GUI or via `npm install iobroker.tradfri --production` 
1. In the ioBroker GUI, add an adapter instance. 
1. Configure the instance by entering the IP/hostname of your gateway and the security code that can be found on the label at the bottom.

## Sending custom CoAP packets
You can send custom CoAP packets from other adapters by using `sendTo`. Example from JavaScript:
```
sendTo("tradfri.0", "request", options, (ret) => {
	// do something with the result
});
```
The `options` object looks as follows:
```
{
	path: string,
	method?: "get" | "post" | "put" | "delete", // optional, default = "get"
	payload?: object                            // optional, should be a JSON object
}
```
The result object `ret` looks as follows:
```
{
	error: string | null,
	result: {
		code: string,            // see https://tools.ietf.org/html/rfc7252#section-12.1.2
		payload: object | Buffer
	}
}
```

## Changelog

#### 0.2.4 (2017-09-11)
* (AlCalzone) Add support for groups (renaming, switching)
* (AlCalzone) Partial support for scenes (switching when id is known)

#### 0.2.3 (2017-09-11)
* (AlCalzone) Send custom CoAP packets by using sendTo

#### 0.2.2 (2017-09-10)
* (AlCalzone) Changed internal handling of objects to prepare the next updates

#### 0.2.1 (2017-08-26)
* (AlCalzone) Sync io-package and package version

#### 0.2.0 (2017-08-14)
* (AlCalzone) Remove git dependency, publish on npm

#### 0.1.5 (2017-08-14)
* (AlCalzone) Ensure only whole numbers are sent (fixes #6)
* (AlCalzone) Fix connection to the gateway using the hostname

#### 0.1.4 (2017-08-12)
* (AlCalzone) Switched to TypeScript

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
