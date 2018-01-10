![Logo](admin/tradfri.png)
ioBroker.tradfri
=================

**Tests:** Linux/Mac: [![Build Status](https://travis-ci.org/AlCalzone/ioBroker.tradfri.svg?branch=master)](https://travis-ci.org/AlCalzone/ioBroker.tradfri) 
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

#### 1.0.4 (2018-01-10)
* (AlCalzone) Removed warning caused by Gateway v1.3.14

#### 1.0.3 (2018-01-07)
* (AlCalzone) Updated `node-tradfri-client` version
* (AlCalzone) Load objects on adapter start so they don't get overwritten (#35)

#### 1.0.2 (2017-12-28)
* (AlCalzone) New attempt at automatically restarting the adapter on connection loss

#### 1.0.1 (2017-12-25)
* (AlCalzone) Update `node-tradfri-client` dependency to support receiving blockwise messages

#### 1.0.0 (2017-11-19)
* (AlCalzone) This is stable enough for a 1.x version
* (AlCalzone) Improved browser compatiblity of the admin UI

#### 0.6.0 (2017-11-07)
* (AlCalzone) Moved tradfri-related code into its own library
* (AlCalzone) Changed authentication procedure to comply with IKEA's request

#### 0.5.5 (2017-10-31)
* (AlCalzone) Restored compatibility to Gateway version 1.2.42

#### 0.5.4 (2017-10-29)
* (AlCalzone) Brightness is now expressed in 0..100%
* (AlCalzone) Fixed parsing RGB colors

#### 0.5.3 (2017-10-28)
* (AlCalzone) Fixed transition duration for groups

#### 0.5.2 (2017-10-28)
* (AlCalzone) Added icons for devices

#### 0.5.1 (2017-10-28)
* (AlCalzone) Support virtual groups
* (AlCalzone) Validate hex colors on input

#### 0.4.5 (2017-10-20)
* (AlCalzone) RGB and connection fixes.

#### 0.4.3 (2017-10-17)
* (AlCalzone) Experimental support for RGB and lightbulbs with fixed color

#### 0.3.4 (2017-10-17)
* (AlCalzone) Disabled automatic restart on connection loss.

#### 0.3.3 (2017-10-07)
* (AlCalzone) Eliminated potential sources of infinite loops

#### 0.3.2 (2017-10-04)
* (AlCalzone) Fixed an error resulting from the upgrade to ES2015 output

#### 0.3.1 (2017-10-02)
* (AlCalzone) Update CoAP library to fix a bug

#### 0.3.0 (2017-09-25)
* (AlCalzone) official release of the previous changes
* (AlCalzone) added transition duration and brightness change for groups
* (AlCalzone) monitor connection state and update info.connection
* (AlCalzone) fix connection attempts to unavailable endpoints

#### 0.2.9 (2017-09-25)
* (AlCalzone) Support changing the transition duration

#### 0.2.8 (2017-09-24)
* (AlCalzone) Fixed group and scene deletion

#### 0.2.7 (2017-09-23)
* (AlCalzone) Update CoAP and DTLS library for the next features
* (AlCalzone) Offloaded concurrency handling to CoAP lib

#### 0.2.5 (2017-09-12)
* (AlCalzone) Selection of scenes from the admin UI is now possible

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
