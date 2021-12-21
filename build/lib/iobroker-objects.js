var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};
__markAsModule(exports);
__export(exports, {
  accessoryToCommon: () => accessoryToCommon,
  accessoryToNative: () => accessoryToNative,
  calcGroupId: () => calcGroupId,
  calcGroupName: () => calcGroupName,
  calcObjId: () => calcObjId,
  calcObjName: () => calcObjName,
  calcSceneId: () => calcSceneId,
  calcSceneName: () => calcSceneName,
  extendDevice: () => extendDevice,
  getAccessoryIcon: () => getAccessoryIcon,
  getInstanceId: () => getInstanceId,
  getRootId: () => getRootId,
  groupToCommon: () => groupToCommon,
  groupToNative: () => groupToNative,
  objectDefinitions: () => objectDefinitions,
  updatePossibleScenes: () => updatePossibleScenes
});
var import_helpers = __toModule(require("alcalzone-shared/helpers"));
var import_objects = __toModule(require("alcalzone-shared/objects"));
var import_node_tradfri_client = __toModule(require("node-tradfri-client"));
var import_session = __toModule(require("../modules/session"));
var import_global = __toModule(require("./global"));
var import_math = __toModule(require("./math"));
var import_object_polyfill = __toModule(require("./object-polyfill"));
var import_strings = __toModule(require("./strings"));
var import_virtual_group = __toModule(require("./virtual-group"));
function accessoryToCommon(accessory) {
  const ret = {
    name: accessory.name || accessory.deviceInfo.modelNumber
  };
  const icon = getAccessoryIcon(accessory);
  if (icon != null)
    ret.icon = "icons/" + icon;
  return ret;
}
function accessoryToNative(accessory) {
  return {
    instanceId: accessory.instanceId,
    manufacturer: accessory.deviceInfo.manufacturer,
    firmwareVersion: accessory.deviceInfo.firmwareVersion,
    modelNumber: accessory.deviceInfo.modelNumber,
    type: import_node_tradfri_client.AccessoryTypes[accessory.type],
    serialNumber: accessory.deviceInfo.serialNumber
  };
}
async function extendDevice(accessory) {
  const objId = calcObjId(accessory);
  if (objId in import_session.session.objects) {
    const devObj = import_session.session.objects[objId];
    let changed = false;
    const newCommon = accessoryToCommon(accessory);
    if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
      Object.assign(devObj.common, newCommon);
      changed = true;
    }
    const newNative = accessoryToNative(accessory);
    if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
      Object.assign(devObj.native, newNative);
      changed = true;
    }
    if (changed)
      await import_global.Global.adapter.extendObjectAsync(objId, devObj);
    const stateObjs = (0, import_objects.filter)(import_session.session.objects, (obj) => obj._id.startsWith(objId) && obj.native && obj.native.path);
    for (const [id, obj] of (0, import_objects.entries)(stateObjs)) {
      if (import_global.Global.adapter.config.preserveTransitionTime && id.match(/\.transitionDuration$/g)) {
        continue;
      }
      try {
        let newValue = (0, import_object_polyfill.dig)(accessory, obj.native.path);
        if (typeof newValue === "function")
          continue;
        const roundToDigits = import_global.Global.adapter.config.roundToDigits;
        if (typeof roundToDigits === "number" && typeof newValue === "number") {
          newValue = (0, import_math.roundTo)(newValue, roundToDigits);
        }
        if (obj.native.onlyChanges) {
          await import_global.Global.adapter.setStateChangedAsync(id, newValue != null ? newValue : null, true);
        } else {
          await import_global.Global.adapter.setStateAsync(id, newValue != null ? newValue : null, true);
        }
      } catch (e) {
      }
    }
  } else {
    const devObj = {
      _id: objId,
      type: "device",
      common: accessoryToCommon(accessory),
      native: accessoryToNative(accessory)
    };
    await import_global.Global.adapter.setObjectAsync(objId, devObj);
    const stateObjs = {
      alive: {
        _id: `${objId}.alive`,
        type: "state",
        common: {
          name: "device alive",
          read: true,
          write: false,
          type: "boolean",
          role: "indicator.alive",
          desc: "indicates if the device is currently alive and connected to the gateway"
        },
        native: {
          path: "alive"
        }
      },
      lastSeen: {
        _id: `${objId}.lastSeen`,
        type: "state",
        common: {
          name: "last seen timestamp",
          read: true,
          write: false,
          type: "number",
          role: "indicator.lastSeen",
          desc: "indicates when the device has last been seen by the gateway"
        },
        native: {
          path: "lastSeen"
        }
      }
    };
    if (accessory.type === import_node_tradfri_client.AccessoryTypes.lightbulb || accessory.type === import_node_tradfri_client.AccessoryTypes.plug) {
      let channelName;
      let channelID;
      if (accessory.type === import_node_tradfri_client.AccessoryTypes.lightbulb) {
        let spectrum = "none";
        if (accessory.lightList != null && accessory.lightList.length > 0) {
          spectrum = accessory.lightList[0].spectrum;
        }
        if (spectrum === "none") {
          channelName = "Lightbulb";
        } else if (spectrum === "white") {
          channelName = "Lightbulb (white spectrum)";
        } else if (spectrum === "rgb") {
          channelName = "RGB Lightbulb";
        }
        channelID = "lightbulb";
        stateObjs[channelID] = {
          _id: `${objId}.${channelID}`,
          type: "channel",
          common: {
            name: channelName,
            role: "light"
          },
          native: {
            spectrum
          }
        };
        if (spectrum === "white") {
          stateObjs[`${channelID}.colorTemperature`] = objectDefinitions.colorTemperature(objId, "device");
        } else if (spectrum === "rgb") {
          stateObjs[`${channelID}.color`] = objectDefinitions.color(objId, "device");
          stateObjs[`${channelID}.hue`] = objectDefinitions.hue(objId, "device");
          stateObjs[`${channelID}.saturation`] = objectDefinitions.saturation(objId, "device");
        }
        stateObjs[`${channelID}.transitionDuration`] = objectDefinitions.transitionDuration(objId, "device", accessory.type);
        stateObjs[`${channelID}.whenPowerRestored`] = objectDefinitions.whenPowerRestored(objId, "device");
      } else {
        channelID = "plug";
        stateObjs[channelID] = {
          _id: `${objId}.${channelID}`,
          type: "channel",
          common: {
            name: channelName,
            role: "switch"
          },
          native: {}
        };
      }
      stateObjs[`${channelID}.brightness`] = objectDefinitions.brightness(objId, "device", accessory.type);
      stateObjs[`${channelID}.state`] = objectDefinitions.onOff(objId, "device", accessory.type);
    }
    if (accessory.deviceInfo.power === import_node_tradfri_client.PowerSources.Battery || accessory.deviceInfo.power === import_node_tradfri_client.PowerSources.InternalBattery || accessory.deviceInfo.power === import_node_tradfri_client.PowerSources.ExternalBattery) {
      if (accessory.deviceInfo.battery != void 0) {
        stateObjs.battery = objectDefinitions.batteryPercentage(objId, "device");
      }
    }
    if (accessory.type === import_node_tradfri_client.AccessoryTypes.blind) {
      stateObjs.position = objectDefinitions.position(objId, "device", accessory.type);
      stateObjs.stopBlinds = objectDefinitions.stopBlinds(objId, "device", accessory.type);
    }
    if (accessory.type === import_node_tradfri_client.AccessoryTypes.airPurifier) {
      for (const prop of [
        "airQuality",
        "fanMode",
        "fanSpeed",
        "statusLEDs",
        "controlsLocked",
        "filterLifetime",
        "filterRuntime",
        "filterRemainingLifetime",
        "filterStatus"
      ]) {
        stateObjs[prop] = objectDefinitions[prop](objId, "device", accessory.type);
      }
    }
    for (const obj of (0, import_objects.values)(stateObjs)) {
      let initialValue = null;
      if (obj.native.path != null) {
        initialValue = (0, import_object_polyfill.dig)(accessory, obj.native.path);
        if (typeof initialValue === "function")
          initialValue = null;
      }
      await import_global.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
    }
  }
}
async function updatePossibleScenes(groupInfo) {
  const group = groupInfo.group;
  if (!(group.instanceId in import_session.session.groups))
    return;
  const objId = calcGroupId(group);
  const scenesId = `${objId}.activeScene`;
  if (scenesId in import_session.session.objects) {
    const scenes = groupInfo.scenes;
    const newDropdownStates = (0, import_objects.composeObject)(Object.keys(scenes).map((id) => [id, scenes[id].name]));
    const obj = await import_global.Global.adapter.getObjectAsync(scenesId);
    const oldDropdownStates = obj.common.states;
    if (JSON.stringify(newDropdownStates) !== JSON.stringify(oldDropdownStates)) {
      import_global.Global.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
      obj.common.states = newDropdownStates;
      await import_global.Global.adapter.setObjectAsync(scenesId, obj);
    }
  }
}
function getAccessoryIcon(accessory) {
  if (accessory.type === import_node_tradfri_client.AccessoryTypes.blind) {
    return "blind.png";
  }
  const model = accessory.deviceInfo.modelNumber;
  switch (model) {
    case "TRADFRI remote control":
      return "remote.png";
    case "TRADFRI motion sensor":
      return "motion_sensor.png";
    case "TRADFRI wireless dimmer":
      return "remote_dimmer.png";
    case "TRADFRI plug":
      return "plug.png";
  }
  if (model.indexOf(" control outlet ") > -1) {
    return "plug.png";
  } else if (model.toLowerCase().indexOf(" transformer ") > -1 || model.toLowerCase().indexOf(" driver ") > -1) {
    return "transformer.png";
  }
  if (accessory.type === import_node_tradfri_client.AccessoryTypes.lightbulb) {
    let prefix;
    if (model.indexOf(" panel ") > -1) {
      prefix = "panel";
    } else if (model.indexOf(" door ") > -1) {
      prefix = "door";
    } else if (model.indexOf(" GU10 ") > -1) {
      prefix = "gu10";
    } else {
      prefix = "bulb";
    }
    let suffix = "";
    const spectrum = accessory.lightList[0].spectrum;
    if (spectrum === "white") {
      suffix = "_ws";
    } else if (spectrum === "rgb") {
      suffix = "_rgb";
    }
    return prefix + suffix + ".png";
  }
}
function getRootId(stateId) {
  const match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
  if (match)
    return match[0];
}
function getInstanceId(id) {
  const match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
  if (match)
    return +match[1];
}
function calcObjId(accessory) {
  return `${import_global.Global.adapter.namespace}.${calcObjName(accessory)}`;
}
function calcObjName(accessory) {
  let prefix;
  switch (accessory.type) {
    case import_node_tradfri_client.AccessoryTypes.remote:
    case import_node_tradfri_client.AccessoryTypes.slaveRemote:
      prefix = "RC";
      break;
    case import_node_tradfri_client.AccessoryTypes.lightbulb:
      prefix = "L";
      break;
    case import_node_tradfri_client.AccessoryTypes.plug:
      prefix = "P";
      break;
    case import_node_tradfri_client.AccessoryTypes.blind:
      prefix = "B";
      break;
    case import_node_tradfri_client.AccessoryTypes.signalRepeater:
      prefix = "SR";
      break;
    case import_node_tradfri_client.AccessoryTypes.motionSensor:
      prefix = "MS";
      break;
    case import_node_tradfri_client.AccessoryTypes.soundRemote:
      prefix = "S";
      break;
    case import_node_tradfri_client.AccessoryTypes.airPurifier:
      prefix = "AP";
      break;
    default:
      import_global.Global.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
      prefix = "XYZ";
      break;
  }
  return `${prefix}-${accessory.instanceId}`;
}
function groupToCommon(group) {
  let name;
  if (group instanceof import_node_tradfri_client.Group) {
    name = group.name;
  } else if (group instanceof import_virtual_group.VirtualGroup) {
    if (typeof group.name === "string" && group.name.length > 0) {
      name = group.name;
    } else {
      name = `virtual group ${group.instanceId}`;
    }
  } else
    return (0, import_helpers.assertNever)(group);
  return {name};
}
function groupToNative(group) {
  return {
    instanceId: group.instanceId,
    deviceIDs: group.deviceIDs,
    type: (group instanceof import_virtual_group.VirtualGroup ? "virtual " : "") + "group"
  };
}
function calcGroupId(group) {
  return `${import_global.Global.adapter.namespace}.${calcGroupName(group)}`;
}
function calcGroupName(group) {
  let prefix;
  if (group instanceof import_node_tradfri_client.Group) {
    prefix = "G";
  } else if (group instanceof import_virtual_group.VirtualGroup) {
    prefix = "VG";
  } else
    return (0, import_helpers.assertNever)(group);
  const postfix = group.instanceId.toString();
  return `${prefix}-${(0, import_strings.padStart)(postfix, 5, "0")}`;
}
function calcSceneId(scene) {
  return `${import_global.Global.adapter.namespace}.${calcSceneName(scene)}`;
}
function calcSceneName(scene) {
  return `S-${scene.instanceId}`;
}
function accessoryTypeToString(type) {
  return import_node_tradfri_client.AccessoryTypes[type];
}
function getCoapAccessoryPropertyPathPrefix(deviceType) {
  switch (deviceType) {
    case import_node_tradfri_client.AccessoryTypes.lightbulb:
      return "lightList.[0].";
    case import_node_tradfri_client.AccessoryTypes.plug:
      return "plugList.[0].";
    case import_node_tradfri_client.AccessoryTypes.blind:
      return "blindList.[0].";
    case import_node_tradfri_client.AccessoryTypes.airPurifier:
      return "airPurifierList.[0].";
    default:
      return "";
  }
}
const objectDefinitions = {
  activeScene: (rootId, _rootType, _deviceType) => ({
    _id: `${rootId}.activeScene`,
    type: "state",
    common: {
      name: "active scene",
      read: true,
      write: true,
      type: "number",
      role: "value.id",
      desc: "the instance id of the currently active scene"
    },
    native: {
      path: "sceneId"
    }
  }),
  onOff: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.state` : `${rootId}.state`,
    type: "state",
    common: {
      name: "on/off",
      read: true,
      write: true,
      type: "boolean",
      role: "switch"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "onOff"
    }
  }),
  whenPowerRestored: (rootId, rootType, deviceType) => {
    const ret = {
      _id: rootType === "device" ? `${rootId}.lightbulb.whenPowerRestored` : `${rootId}.whenPowerRestored`,
      type: "state",
      common: {
        name: "Action when power restored",
        read: true,
        write: true,
        type: "number",
        role: "level",
        states: {
          "2": "Turn on",
          "4": "Previous state"
        },
        desc: rootType === "device" ? "What this device should do after power is restored" : "What devices in this group should do after power is restored"
      },
      native: {
        path: getCoapAccessoryPropertyPathPrefix(deviceType) + "whenPowerRestored"
      }
    };
    return ret;
  },
  brightness: (rootId, rootType, deviceType) => {
    const deviceName = rootType === "device" ? accessoryTypeToString(deviceType) : void 0;
    return {
      _id: rootType === "device" ? `${rootId}.${deviceName}.brightness` : `${rootId}.brightness`,
      type: "state",
      common: {
        name: "Brightness",
        read: true,
        write: true,
        min: 0,
        max: 100,
        unit: "%",
        type: "number",
        role: "level.dimmer",
        desc: rootType === "device" ? `Brightness of the ${deviceName}` : `Brightness of this group's ${deviceName}s`
      },
      native: {
        path: getCoapAccessoryPropertyPathPrefix(deviceType) + "dimmer"
      }
    };
  },
  transitionDuration: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.lightbulb.transitionDuration` : `${rootId}.transitionDuration`,
    type: "state",
    common: {
      name: "Transition duration",
      read: false,
      write: true,
      type: "number",
      min: 0,
      max: 100,
      def: 0,
      role: "light.dimmer",
      desc: rootType === "device" ? "Duration of a state change" : `Duration for state changes of this group's lightbulbs`,
      unit: "s"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "transitionTime"
    }
  }),
  colorTemperature: (rootId, rootType) => {
    const ret = {
      _id: rootType === "device" ? `${rootId}.lightbulb.colorTemperature` : `${rootId}.colorTemperature`,
      type: "state",
      common: {
        name: "Color temperature",
        read: true,
        write: true,
        min: 0,
        max: 100,
        unit: "%",
        type: "number",
        role: "level.color.temperature",
        desc: rootType === "device" ? "Range: 0% = cold, 100% = warm" : "Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm"
      },
      native: {}
    };
    if (rootType === "device") {
      ret.native.path = "lightList.[0].colorTemperature";
    } else if (rootType === "group") {
      ret.native.path = "__virtual__";
    } else if (rootType === "virtual group") {
      ret.native.path = "colorTemperature";
    }
    return ret;
  },
  color: (rootId, rootType) => {
    const ret = {
      _id: rootType === "device" ? `${rootId}.lightbulb.color` : `${rootId}.color`,
      type: "state",
      common: {
        name: "RGB color",
        read: true,
        write: true,
        type: "string",
        role: "level.color.rgb",
        desc: rootType === "device" ? "6-digit RGB hex string" : "Color of this group's RGB lightbulbs as a 6-digit hex string."
      },
      native: {}
    };
    if (rootType === "device") {
      ret.native.path = "lightList.[0].color";
    } else if (rootType === "group") {
      ret.native.path = "__virtual__";
    } else if (rootType === "virtual group") {
      ret.native.path = "color";
    }
    return ret;
  },
  hue: (rootId, rootType) => {
    const ret = {
      _id: rootType === "device" ? `${rootId}.lightbulb.hue` : `${rootId}.hue`,
      type: "state",
      common: {
        name: "Hue",
        read: true,
        write: true,
        min: 0,
        max: 360,
        unit: "\xB0",
        type: "number",
        role: "level.color.hue",
        desc: rootType === "device" ? "Hue of this RGB lightbulb" : "Hue of this group's RGB lightbulbs"
      },
      native: {}
    };
    if (rootType === "device") {
      ret.native.path = "lightList.[0].hue";
    } else if (rootType === "group") {
      ret.native.path = "__virtual__";
    } else if (rootType === "virtual group") {
      ret.native.path = "hue";
    }
    return ret;
  },
  saturation: (rootId, rootType) => {
    const ret = {
      _id: rootType === "device" ? `${rootId}.lightbulb.saturation` : `${rootId}.saturation`,
      type: "state",
      common: {
        name: "Saturation",
        read: true,
        write: true,
        min: 0,
        max: 100,
        unit: "%",
        type: "number",
        role: "level.color.saturation",
        desc: rootType === "device" ? "Saturation of this RGB lightbulb" : "Saturation of this group's RGB lightbulbs"
      },
      native: {}
    };
    if (rootType === "device") {
      ret.native.path = "lightList.[0].saturation";
    } else if (rootType === "group") {
      ret.native.path = "__virtual__";
    } else if (rootType === "virtual group") {
      ret.native.path = "saturation";
    }
    return ret;
  },
  batteryPercentage: (rootId) => ({
    _id: `${rootId}.batteryPercentage`,
    type: "state",
    common: {
      name: "Battery percentage",
      read: true,
      write: false,
      type: "number",
      min: 0,
      max: 100,
      def: 100,
      role: "indicator.maintenance",
      unit: "%"
    },
    native: {
      path: "deviceInfo.battery",
      onlyChanges: true
    }
  }),
  position: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.position` : `${rootId}.position`,
    type: "state",
    common: {
      name: "Blind position",
      desc: (rootType === "device" ? "Position of the blind in percent." : "Position of this group's blinds in percent.") + " 0% is fully open, 100% is fully closed.",
      read: true,
      write: true,
      type: "number",
      min: 0,
      max: 100,
      role: "blind",
      unit: "%"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "position"
    }
  }),
  stopBlinds: (rootId, rootType, deviceType) => {
    const isGroup = rootType !== "device";
    return {
      _id: isGroup ? `${rootId}.stopBlinds` : `${rootId}.${accessoryTypeToString(deviceType)}.stop`,
      type: "state",
      common: {
        name: isGroup ? "Stop blinds" : "Stop",
        desc: isGroup ? "Stops all moving blinds in this group." : "Stops the motion of this blind.",
        read: false,
        write: true,
        type: "boolean",
        role: "blind"
      },
      native: {
        path: getCoapAccessoryPropertyPathPrefix(deviceType) + `stop${isGroup ? "Blinds" : ""}`
      }
    };
  },
  airQuality: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.airQuality` : `${rootId}.airQuality`,
    type: "state",
    common: {
      name: "Air quality",
      desc: (rootType === "device" ? "Air quality measured by this air purifier." : "Air quality measured by this group's air purifiers.") + " 0..35 = good, 36..85 = OK, >= 86 == not good.",
      read: true,
      write: false,
      type: "number",
      min: 0,
      max: 100,
      role: "value"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "airQuality"
    }
  }),
  fanMode: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.fanMode` : `${rootId}.fanMode`,
    type: "state",
    common: {
      name: "Fan mode",
      read: true,
      write: true,
      type: "number",
      min: 0,
      max: 50,
      role: "level.mode.fan",
      states: {
        0: "Off",
        1: "Auto",
        10: "Level 1",
        20: "Level 2",
        30: "Level 3",
        40: "Level 4",
        50: "Level 5"
      }
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "fanMode"
    }
  }),
  fanSpeed: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.fanSpeed` : `${rootId}.fanSpeed`,
    type: "state",
    common: {
      name: "Fan speed",
      read: true,
      write: true,
      type: "number",
      min: 0,
      max: 50,
      role: "level",
      states: {
        0: "Off",
        10: "min",
        15: "15",
        20: "20",
        25: "25",
        30: "30",
        35: "35",
        40: "40",
        45: "45",
        50: "max"
      }
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "fanSpeed"
    }
  }),
  statusLEDs: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.statusLEDs` : `${rootId}.statusLEDs`,
    type: "state",
    common: {
      name: "Status LEDs",
      read: true,
      write: true,
      type: "boolean",
      role: "switch"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "statusLEDs"
    }
  }),
  controlsLocked: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.controlsLocked` : `${rootId}.controlsLocked`,
    type: "state",
    common: {
      name: "Controls locked",
      desc: rootType === "device" ? "Enable/disable the controls of this air purifier." : "Enable/disable the controls of this group's air purifiers.",
      read: true,
      write: true,
      type: "boolean",
      role: "switch"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "controlsLocked"
    }
  }),
  filterLifetime: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.filterLifetime` : `${rootId}.filterLifetime`,
    type: "state",
    common: {
      name: "Filter: Total lifetime",
      read: true,
      write: false,
      type: "number",
      role: "value"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "totalFilterLifetime"
    }
  }),
  filterRuntime: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.filterRuntime` : `${rootId}.filterRuntime`,
    type: "state",
    common: {
      name: "Filter: Runtime",
      read: true,
      write: false,
      type: "number",
      role: "value"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "filterRuntime"
    }
  }),
  filterRemainingLifetime: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.filterRemainingLifetime` : `${rootId}.filterRemainingLifetime`,
    type: "state",
    common: {
      name: "Filter: Remaining lifetime",
      read: true,
      write: false,
      type: "number",
      role: "value"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "filterRemainingLifetime"
    }
  }),
  filterStatus: (rootId, rootType, deviceType) => ({
    _id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType)}.filterStatus` : `${rootId}.filterStatus`,
    type: "state",
    common: {
      name: "Filter: Status",
      read: true,
      write: false,
      type: "number",
      role: "value"
    },
    native: {
      path: getCoapAccessoryPropertyPathPrefix(deviceType) + "filterStatus"
    }
  })
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accessoryToCommon,
  accessoryToNative,
  calcGroupId,
  calcGroupName,
  calcObjId,
  calcObjName,
  calcSceneId,
  calcSceneName,
  extendDevice,
  getAccessoryIcon,
  getInstanceId,
  getRootId,
  groupToCommon,
  groupToNative,
  objectDefinitions,
  updatePossibleScenes
});
//# sourceMappingURL=iobroker-objects.js.map
