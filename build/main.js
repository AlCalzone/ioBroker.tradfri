var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
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
var utils = __toModule(require("@iobroker/adapter-core"));
var import_helpers = __toModule(require("alcalzone-shared/helpers"));
var import_objects = __toModule(require("alcalzone-shared/objects"));
var import_node_tradfri_client = __toModule(require("node-tradfri-client"));
var path = __toModule(require("path"));
var import_colors = __toModule(require("./lib/colors"));
var import_fix_objects = __toModule(require("./lib/fix-objects"));
var import_global = __toModule(require("./lib/global"));
var import_iobroker_objects = __toModule(require("./lib/iobroker-objects"));
var import_math = __toModule(require("./lib/math"));
var import_virtual_group = __toModule(require("./lib/virtual-group"));
var import_custom_subscriptions = __toModule(require("./modules/custom-subscriptions"));
var import_groups = __toModule(require("./modules/groups"));
var import_message = __toModule(require("./modules/message"));
var import_operations = __toModule(require("./modules/operations"));
var import_session = __toModule(require("./modules/session"));
let connectionAlive;
let adapter;
function startAdapter(options = {}) {
  return adapter = utils.adapter(__spreadProps(__spreadValues({}, options), {
    name: "tradfri",
    ready: async () => {
      adapter = import_global.Global.extend(adapter);
      import_global.Global.adapter = adapter;
      await (0, import_fix_objects.ensureInstanceObjects)();
      await (0, import_fix_objects.fixAdapterObjects)();
      await adapter.setStateAsync("info.connection", false, true);
      if (adapter.config && (adapter.config.host != null && adapter.config.host !== "" || adapter.config.discoverGateway) && (adapter.config.securityCode != null && adapter.config.securityCode !== "" || adapter.config.identity != null && adapter.config.identity !== "")) {
      } else {
        adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
        return;
      }
      let hostname = adapter.config.host && adapter.config.host.toLowerCase();
      const useAutoDiscovery = adapter.config.discoverGateway;
      const securityCode = adapter.config.securityCode;
      let identity = adapter.config.identity;
      let psk = adapter.config.psk;
      if (useAutoDiscovery) {
        import_global.Global.log("Discovering the gateway automatically...");
        const discovered = await (0, import_node_tradfri_client.discoverGateway)();
        if (discovered && discovered.addresses.length) {
          import_global.Global.log(`Found gateway ${discovered.name || "with unknown name"} at ${discovered.addresses[0]}`);
          hostname = discovered.addresses[0];
        } else {
          import_global.Global.log("discovery failed!", "warn");
          if (!hostname) {
            adapter.log.error("In order to use this adapter without auto-discovery, please set a hostname!");
            return;
          }
        }
      }
      if (typeof adapter.config.roundToDigits === "string") {
        await updateConfig({
          roundToDigits: parseInt(adapter.config.roundToDigits, 10)
        });
      }
      adapter.subscribeStates(`${adapter.namespace}.*`);
      adapter.subscribeObjects(`${adapter.namespace}.*`);
      (0, import_custom_subscriptions.subscribeStates)(/L\-\d+\.lightbulb\./, import_groups.syncGroupsWithState);
      (0, import_custom_subscriptions.subscribeStates)(/B\-\d+\.blind\./, import_groups.syncGroupsWithState);
      import_session.session.tradfri = new import_node_tradfri_client.TradfriClient(hostname, {
        customLogger: import_global.Global.log,
        watchConnection: true
      });
      if (identity && identity.length > 0 && psk && psk.length > 0) {
        import_session.session.tradfri.on("connection failed", (attempt, maxAttempts) => {
          import_global.Global.log(`failed connection attempt ${attempt} of ${Number.isFinite(maxAttempts) ? maxAttempts : "\u221E"}`, "warn");
        });
        try {
          await import_session.session.tradfri.connect(identity, psk);
        } catch (e) {
          if (e instanceof import_node_tradfri_client.TradfriError) {
            switch (e.code) {
              case import_node_tradfri_client.TradfriErrorCodes.ConnectionTimedOut: {
                import_global.Global.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
                import_global.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
              }
              case import_node_tradfri_client.TradfriErrorCodes.AuthenticationFailed: {
                import_global.Global.log(`The stored credentials are no longer valid!`, "warn");
                import_global.Global.log(`The adapter will now restart and re-authenticate! If not, please restart it manually.`, "warn");
                await updateConfig({
                  identity: "",
                  psk: ""
                });
                return;
              }
              case import_node_tradfri_client.TradfriErrorCodes.ConnectionFailed: {
                import_global.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
                import_global.Global.log(e.message, "error");
                return;
              }
            }
          } else {
            import_global.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
            import_global.Global.log(e.message, "error");
            return;
          }
        }
      } else if (securityCode != null && securityCode.length > 0) {
        try {
          ({identity, psk} = await import_session.session.tradfri.authenticate(securityCode));
          import_global.Global.log(`The authentication was successful. The adapter should now restart. If not, please restart it manually.`, "info");
          await updateConfig({
            identity,
            psk
          });
        } catch (e) {
          if (e instanceof import_node_tradfri_client.TradfriError) {
            switch (e.code) {
              case import_node_tradfri_client.TradfriErrorCodes.ConnectionTimedOut: {
                import_global.Global.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
                import_global.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
              }
              case import_node_tradfri_client.TradfriErrorCodes.AuthenticationFailed: {
                import_global.Global.log(`The security code is incorrect or something else went wrong with the authentication.`, "error");
                import_global.Global.log(`Please check your adapter settings and restart the adapter!`, "error");
                return;
              }
              case import_node_tradfri_client.TradfriErrorCodes.ConnectionFailed: {
                import_global.Global.log(`Could not authenticate with the gateway ${hostname}!`, "error");
                import_global.Global.log(e.message, "error");
                return;
              }
            }
          } else {
            import_global.Global.log(`Could not authenticate with the gateway ${hostname}!`, "error");
            import_global.Global.log(e.message, "error");
            return;
          }
        }
      }
      await adapter.setStateAsync("info.connection", true, true);
      connectionAlive = true;
      import_session.session.tradfri.on("connection alive", () => {
        if (connectionAlive)
          return;
        import_global.Global.log("Connection to gateway reestablished", "info");
        adapter.setState("info.connection", true, true);
        connectionAlive = true;
      }).on("connection lost", () => {
        if (!connectionAlive)
          return;
        import_global.Global.log("Lost connection to gateway", "warn");
        adapter.setState("info.connection", false, true);
        connectionAlive = false;
      });
      await loadDevices();
      await loadGroups();
      await loadVirtualGroups();
      import_session.session.tradfri.on("device updated", tradfri_deviceUpdated).on("device removed", tradfri_deviceRemoved).on("group updated", tradfri_groupUpdated).on("group removed", tradfri_groupRemoved).on("scene updated", tradfri_sceneUpdated).on("scene removed", tradfri_sceneRemoved).on("error", tradfri_error);
      observeAll();
    },
    message: import_message.onMessage,
    objectChange: (id, obj) => {
      import_global.Global.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");
      if (id.startsWith(adapter.namespace)) {
        if (obj) {
          const instanceId = (0, import_iobroker_objects.getInstanceId)(id);
          if (instanceId == void 0)
            return;
          if (obj.type === "device" && instanceId in import_session.session.devices && import_session.session.devices[instanceId] != null) {
            const acc = import_session.session.devices[instanceId];
            if (obj.common && obj.common.name !== acc.name) {
              import_global.Global.log(`the device ${id} was renamed to "${obj.common.name}"`);
              (0, import_operations.renameDevice)(acc, obj.common.name);
            }
          } else if (obj.type === "channel" && instanceId in import_session.session.groups && import_session.session.groups[instanceId] != null) {
            const grp = import_session.session.groups[instanceId].group;
            if (obj.common && obj.common.name !== grp.name) {
              import_global.Global.log(`the group ${id} was renamed to "${obj.common.name}"`);
              (0, import_operations.renameGroup)(grp, obj.common.name);
            }
          }
          import_session.session.objects[id] = obj;
        } else {
          if (id in import_session.session.objects)
            delete import_session.session.objects[id];
        }
      }
      (0, import_custom_subscriptions.applyCustomObjectSubscriptions)(id, obj);
    },
    stateChange: async (id, state) => {
      if (state) {
        import_global.Global.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${String(state.val)}`, "debug");
      } else {
        import_global.Global.log(`{{blue}} state with id ${id} deleted`, "debug");
      }
      if (!connectionAlive && state && !state.ack && id.startsWith(adapter.namespace)) {
        import_global.Global.log("Not connected to the gateway. Cannot send changes!", "warn");
        return;
      }
      (0, import_custom_subscriptions.applyCustomStateSubscriptions)(id, state);
      if (state && !state.ack && id.startsWith(adapter.namespace)) {
        const stateObj = import_session.session.objects[id];
        if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
          return;
        const rootId = (0, import_iobroker_objects.getRootId)(id);
        if (rootId) {
          const rootObj = import_session.session.objects[rootId];
          let val = state.val;
          if (stateObj.common.type === "number") {
            let roundToDigits = adapter.config.roundToDigits || 2;
            if (id.endsWith("transitionDuration"))
              roundToDigits = 2;
            val = (0, import_math.roundTo)(val, roundToDigits);
            if (stateObj.common.min != null)
              val = Math.max(stateObj.common.min, val);
            if (stateObj.common.max != null)
              val = Math.min(stateObj.common.max, val);
          }
          switch (rootObj.native.type) {
            case "group": {
              if (!(rootObj.native.instanceId in import_session.session.groups)) {
                import_global.Global.log(`The group with ID ${rootObj.native.instanceId} was not found!`, "warn");
                return;
              }
              const group = import_session.session.groups[rootObj.native.instanceId].group;
              let wasAcked = false;
              if (id.endsWith(".state")) {
                wasAcked = !await group.toggle(val);
              } else if (id.endsWith(".brightness")) {
                wasAcked = !await group.setBrightness(val, await getTransitionDuration(group));
              } else if (id.endsWith(".position")) {
                wasAcked = !await group.setPosition(val);
              } else if (id.endsWith(".activeScene")) {
                wasAcked = !await group.activateScene(val);
              } else if (id.endsWith(".color")) {
                val = (0, import_colors.normalizeHexColor)(val);
                if (val != null) {
                  state.val = val;
                  await (0, import_operations.operateVirtualGroup)(group, {
                    color: val,
                    transitionTime: await getTransitionDuration(group)
                  });
                  wasAcked = true;
                }
              } else if (id.endsWith(".colorTemperature")) {
                await (0, import_operations.operateVirtualGroup)(group, {
                  colorTemperature: val,
                  transitionTime: await getTransitionDuration(group)
                });
                wasAcked = true;
              } else if (/\.(hue|saturation)$/.test(id)) {
                const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                const hueState = await import_global.Global.adapter.getStateAsync(prefix + "hue");
                if (hueState == void 0)
                  return;
                const saturationState = await import_global.Global.adapter.getStateAsync(prefix + "saturation");
                if (saturationState == void 0)
                  return;
                const hue = hueState.val;
                const saturation = saturationState.val;
                await (0, import_operations.operateVirtualGroup)(group, {
                  hue,
                  saturation,
                  transitionTime: await getTransitionDuration(group)
                });
                wasAcked = true;
              } else if (id.endsWith(".transitionDuration")) {
                wasAcked = true;
              } else if (id.endsWith(".stopBlinds")) {
                await group.stopBlinds();
              }
              if (wasAcked)
                adapter.setStateAsync(id, state, true);
              return;
            }
            case "virtual group": {
              if (!(rootObj.native.instanceId in import_session.session.virtualGroups)) {
                import_global.Global.log(`The virtual group with ID ${rootObj.native.instanceId} was not found!`, "warn");
                return;
              }
              const vGroup = import_session.session.virtualGroups[rootObj.native.instanceId];
              let operation;
              let wasAcked = false;
              if (id.endsWith(".state")) {
                operation = {
                  onOff: val
                };
              } else if (id.endsWith(".brightness")) {
                operation = {
                  dimmer: val,
                  transitionTime: await getTransitionDuration(vGroup)
                };
              } else if (id.endsWith(".position")) {
                operation = {
                  position: val
                };
              } else if (id.endsWith(".color")) {
                val = (0, import_colors.normalizeHexColor)(val);
                if (val != null) {
                  state.val = val;
                  operation = {
                    color: val,
                    transitionTime: await getTransitionDuration(vGroup)
                  };
                }
              } else if (id.endsWith(".colorTemperature")) {
                operation = {
                  colorTemperature: val,
                  transitionTime: await getTransitionDuration(vGroup)
                };
              } else if (/\.(hue|saturation)$/.test(id)) {
                const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                const hueState = await import_global.Global.adapter.getStateAsync(prefix + "hue");
                if (hueState == void 0)
                  return;
                const saturationState = await import_global.Global.adapter.getStateAsync(prefix + "saturation");
                if (saturationState == void 0)
                  return;
                const hue = hueState.val;
                const saturation = saturationState.val;
                operation = {
                  hue,
                  saturation,
                  transitionTime: await getTransitionDuration(vGroup)
                };
              } else if (id.endsWith(".transitionDuration")) {
                wasAcked = true;
              } else if (id.endsWith(".stopBlinds")) {
                await (0, import_operations.stopBlinds)(vGroup);
              } else if (id.endsWith(".whenPowerRestored")) {
                operation = {
                  whenPowerRestored: val
                };
              } else if (id.endsWith(".fanMode")) {
                operation = {
                  fanMode: val
                };
              } else if (id.endsWith(".fanSpeed")) {
                operation = {
                  fanSpeed: val
                };
              } else if (id.endsWith(".statusLEDs")) {
                operation = {
                  statusLEDs: val
                };
              } else if (id.endsWith(".controlsLocked")) {
                operation = {
                  controlsLocked: val
                };
              }
              if (operation != null) {
                (0, import_operations.operateVirtualGroup)(vGroup, operation);
                wasAcked = true;
              }
              if (wasAcked)
                adapter.setStateAsync(id, state, true);
              return;
            }
            default: {
              if (id.indexOf(".lightbulb.") > -1 || id.indexOf(".plug.") > -1 || id.indexOf(".blind.") > -1 || id.indexOf(".airPurifier.") > -1) {
                if (!(rootObj.native.instanceId in import_session.session.devices)) {
                  import_global.Global.log(`The device with ID ${rootObj.native.instanceId} was not found!`, "warn");
                  return;
                }
                const accessory = import_session.session.devices[rootObj.native.instanceId];
                const light = accessory.lightList && accessory.lightList[0];
                const plug = accessory.plugList && accessory.plugList[0];
                const blind = accessory.blindList && accessory.blindList[0];
                const airPurifier = accessory.airPurifierList && accessory.airPurifierList[0];
                const specificAccessory = light || plug || blind || airPurifier;
                if (specificAccessory == void 0) {
                  import_global.Global.log(`Cannot operate an accessory that is neither a lightbulb nor a plug nor a blind nor an airPurifier!`, "warn");
                  return;
                }
                let wasAcked = false;
                if (id.endsWith(".state")) {
                  wasAcked = !await specificAccessory.toggle(val);
                } else if (id.endsWith(".brightness")) {
                  if (light != void 0) {
                    wasAcked = !await light.setBrightness(val, await getTransitionDuration(accessory));
                  } else if (plug != void 0) {
                    wasAcked = !await plug.setBrightness(val);
                  }
                } else if (id.endsWith(".position")) {
                  if (blind != void 0) {
                    wasAcked = !await blind.setPosition(val);
                  }
                } else if (id.endsWith(".color")) {
                  if (light.spectrum === "rgb") {
                    val = (0, import_colors.normalizeHexColor)(val);
                    if (val != null) {
                      state.val = val;
                      wasAcked = !await light.setColor(val, await getTransitionDuration(accessory));
                    }
                  } else if (light.spectrum === "white") {
                    wasAcked = !await light.setColorTemperature(val, await getTransitionDuration(accessory));
                  }
                } else if (id.endsWith(".colorTemperature")) {
                  wasAcked = !await light.setColorTemperature(val, await getTransitionDuration(accessory));
                } else if (/\.(hue|saturation)$/.test(id)) {
                  const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                  const hueState = await import_global.Global.adapter.getStateAsync(prefix + "hue");
                  if (hueState == void 0)
                    return;
                  const saturationState = await import_global.Global.adapter.getStateAsync(prefix + "saturation");
                  if (saturationState == void 0)
                    return;
                  const hue = hueState.val;
                  const saturation = saturationState.val;
                  wasAcked = !await import_session.session.tradfri.operateLight(accessory, {
                    hue,
                    saturation,
                    transitionTime: await getTransitionDuration(accessory)
                  });
                } else if (id.endsWith(".transitionDuration")) {
                  wasAcked = true;
                } else if (id.endsWith("blind.stop")) {
                  await blind.stop();
                } else if (id.endsWith(".whenPowerRestored")) {
                  wasAcked = !await import_session.session.tradfri.operateLight(accessory, {
                    whenPowerRestored: val
                  });
                } else if (id.endsWith(".fanMode")) {
                  if (airPurifier != void 0) {
                    wasAcked = !await airPurifier.setFanMode(val);
                  }
                } else if (id.endsWith(".fanSpeed")) {
                  if (airPurifier != void 0) {
                    wasAcked = !await airPurifier.setFanSpeed(val);
                  }
                } else if (id.endsWith(".statusLEDs")) {
                  if (airPurifier != void 0) {
                    wasAcked = !await airPurifier.setStatusLEDs(val);
                  }
                } else if (id.endsWith(".controlsLocked")) {
                  if (airPurifier != void 0) {
                    wasAcked = !await airPurifier.setControlsLocked(val);
                  }
                }
                if (wasAcked)
                  adapter.setStateAsync(id, state, true);
                return;
              }
            }
          }
        }
      } else if (!state) {
      }
    },
    unload: (callback) => {
      try {
        import_session.session.tradfri.destroy();
        adapter.setState("info.connection", false, true);
        callback();
      } catch (e) {
        callback();
      }
    }
  }));
}
async function updateConfig(newConfig) {
  const config = __spreadValues(__spreadValues({}, adapter.config), newConfig);
  const adapterObj = await adapter.getForeignObjectAsync(`system.adapter.${adapter.namespace}`);
  adapterObj.native = config;
  await adapter.setForeignObjectAsync(`system.adapter.${adapter.namespace}`, adapterObj);
}
async function observeAll() {
  await import_session.session.tradfri.observeDevices();
  import_global.Global.log("received all devices");
  await import_session.session.tradfri.observeGroupsAndScenes();
  import_global.Global.log("received all groups and scenes");
}
function tradfri_deviceUpdated(device) {
  import_session.session.devices[device.instanceId] = device;
  (0, import_iobroker_objects.extendDevice)(device);
}
async function tradfri_deviceRemoved(instanceId) {
  if (instanceId in import_session.session.devices) {
    const deviceName = (0, import_iobroker_objects.calcObjName)(import_session.session.devices[instanceId]);
    await adapter.deleteDeviceAsync(deviceName);
    delete import_session.session.devices[instanceId];
  }
}
async function tradfri_groupUpdated(group) {
  if (!(group.instanceId in import_session.session.groups)) {
    import_session.session.groups[group.instanceId] = {
      group: null,
      scenes: {}
    };
  }
  import_session.session.groups[group.instanceId].group = group;
  (0, import_groups.extendGroup)(group);
  (0, import_groups.updateGroupStates)(group);
  group.transitionTime = await getTransitionDuration(group);
}
async function tradfri_groupRemoved(instanceId) {
  if (instanceId in import_session.session.groups) {
    const groupName = (0, import_iobroker_objects.calcGroupName)(import_session.session.groups[instanceId].group);
    await adapter.deleteChannelAsync(groupName);
    delete import_session.session.groups[instanceId];
  }
}
function tradfri_sceneUpdated(groupId, scene) {
  if (groupId in import_session.session.groups) {
    import_session.session.groups[groupId].scenes[scene.instanceId] = scene;
    (0, import_iobroker_objects.updatePossibleScenes)(import_session.session.groups[groupId]);
  }
}
function tradfri_sceneRemoved(groupId, instanceId) {
  if (groupId in import_session.session.groups) {
    const groupInfo = import_session.session.groups[groupId];
    if (instanceId in groupInfo.scenes)
      delete groupInfo.scenes[instanceId];
  }
}
function tradfri_error(error) {
  if (error instanceof import_node_tradfri_client.TradfriError) {
    if (error.code === import_node_tradfri_client.TradfriErrorCodes.NetworkReset || error.code === import_node_tradfri_client.TradfriErrorCodes.ConnectionTimedOut) {
      return;
    }
  }
  import_global.Global.log(error.toString(), "error");
}
async function getTransitionDuration(accessoryOrGroup) {
  let stateId;
  if (accessoryOrGroup instanceof import_node_tradfri_client.Accessory) {
    switch (accessoryOrGroup.type) {
      case import_node_tradfri_client.AccessoryTypes.lightbulb:
        stateId = (0, import_iobroker_objects.calcObjId)(accessoryOrGroup) + ".lightbulb.transitionDuration";
      default:
        return 0;
    }
  } else if (accessoryOrGroup instanceof import_node_tradfri_client.Group || accessoryOrGroup instanceof import_virtual_group.VirtualGroup) {
    stateId = (0, import_iobroker_objects.calcGroupId)(accessoryOrGroup) + ".transitionDuration";
  } else
    return (0, import_helpers.assertNever)(accessoryOrGroup);
  const ret = await adapter.getStateAsync(stateId);
  if (ret != null)
    return ret.val;
  return 0.5;
}
async function loadVirtualGroups() {
  const iobObjects = await import_global.Global.$$(`${adapter.namespace}.VG-*`, "channel");
  const groupObjects = (0, import_objects.values)(iobObjects).filter((g) => {
    return g.native != null && g.native.instanceId != null && g.native.deviceIDs != null && g.native.type === "virtual group";
  });
  Object.assign(import_session.session.virtualGroups, (0, import_objects.composeObject)(groupObjects.map((g) => {
    const id = g.native.instanceId;
    const deviceIDs = g.native.deviceIDs.map((d) => parseInt(d, 10));
    const ret = new import_virtual_group.VirtualGroup(id);
    ret.deviceIDs = deviceIDs;
    ret.name = g.common.name;
    return [`${id}`, ret];
  })));
  for (const obj of (0, import_objects.values)(import_session.session.virtualGroups)) {
    const id = (0, import_iobroker_objects.calcGroupId)(obj);
    import_session.session.objects[id] = iobObjects[id];
    const stateObjs = await import_global.Global.$$(`${id}.*`, "state");
    for (const [sid, sobj] of (0, import_objects.entries)(stateObjs)) {
      import_session.session.objects[sid] = sobj;
    }
  }
}
async function loadDevices() {
  const iobObjects = await import_global.Global.$$(`${adapter.namespace}.*`, "device");
  const deviceObjects = (0, import_objects.values)(iobObjects).filter((d) => {
    return d.native && d.native.instanceId != null;
  });
  for (const obj of deviceObjects) {
    import_session.session.objects[obj._id] = obj;
    const stateObjs = await import_global.Global.$$(`${obj._id}.*`, "state");
    for (const [sid, sobj] of (0, import_objects.entries)(stateObjs)) {
      import_session.session.objects[sid] = sobj;
    }
  }
}
async function loadGroups() {
  const iobObjects = await import_global.Global.$$(`${adapter.namespace}.G-*`, "channel");
  const groupObjects = (0, import_objects.values)(iobObjects).filter((g) => {
    return g.native && g.native.instanceId != null && g.native.type === "group";
  });
  for (const obj of groupObjects) {
    import_session.session.objects[obj._id] = obj;
    const stateObjs = await import_global.Global.$$(`${obj._id}.*`, "state");
    for (const [sid, sobj] of (0, import_objects.entries)(stateObjs)) {
      import_session.session.objects[sid] = sobj;
    }
  }
}
function getMessage(err) {
  if (err == null)
    return "undefined";
  if (typeof err === "string")
    return err;
  if (err.message != null)
    return err.message;
  if (err.name != null)
    return err.name;
  return err.toString();
}
function onUnhandledRejection(err) {
  let message = "unhandled promise rejection:" + getMessage(err);
  if (err instanceof Error && err.stack != null)
    message += "\n> stack: " + err.stack;
  (adapter && adapter.log || console).error(message);
  terminate(1, "unhandled promise rejection");
}
function onUnhandledError(err) {
  let message = "unhandled exception:" + getMessage(err);
  if (err.stack != null)
    message += "\n> stack: " + err.stack;
  (adapter && adapter.log || console).error(message);
  terminate(1, "unhandled exception");
}
function terminate(exitCode, reason) {
  if (adapter && typeof adapter.terminate === "function") {
    adapter.terminate(reason);
  } else {
    process.exit(exitCode);
  }
}
process.on("unhandledRejection", onUnhandledRejection);
process.on("uncaughtException", onUnhandledError);
let tradfriClientLibLoaded = false;
try {
  require("node-tradfri-client");
  tradfriClientLibLoaded = true;
} catch (e) {
  console.error(`The module "node-aead-crypto" was not installed correctly!`);
  console.error(`To try reinstalling it, goto "${path.join(__dirname, "..")}" and run`);
  console.error(`npm install --production`);
  console.error(`If that fails due to missing access rights, run`);
  console.error(`${process.platform !== "win32" ? "sudo -H " : ""}npm install --production --unsafe-perm`);
  console.error(`instead. Afterwards, restart this adapter.`);
}
if (module.parent) {
  if (tradfriClientLibLoaded) {
    module.exports = startAdapter;
  }
} else {
  if (tradfriClientLibLoaded) {
    startAdapter();
  } else {
    terminate(11, "Required library missing");
  }
}
//# sourceMappingURL=main.js.map
