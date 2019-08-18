"use strict";
// tslint:disable:variable-name
Object.defineProperty(exports, "__esModule", { value: true });
// Endpunkte, die abgefragt werden können
exports.Endpoints = {
    DEVICES: "15001",
    HS_LINK: "15002",
    GROUPS: "15004",
    SCENE: "15005",
    NOTIFICATIONS: "15006",
    UNKNOWN1: "15010",
    GATEWAY: "15011",
    GATEWAY_DETAILS: "15012",
};
exports.Commands = {
    GROUP_SETTINGS: "9045",
    LIGHT_SETTING: "15013",
};
exports.AuthenticationResponse = {
    sessionId: "9033",
    sessionLength: "9064",
};
exports.GatewayDetails = {
    CURRENT_TIMESTAMP: "9059",
    COMMISSIONING_MODE: "9061",
    GATEWAY_NAME: "9035",
    GATEWAY_TIME_SOURCE: "9071",
    OTA_UPDATE_STATE: "9054",
    NTP_SERVER: "9023",
    FORCE_CHECK_OTA_UPDATE: "9032",
    UPDATE_ACCEPTED_TIMESTAMP: "9069",
    GATEWAY_UPDATE_PROGRESS: "9055",
    GATEWAY_UPDATE_DETAILS_URL: "9056",
    OTA_TYPE: "9066",
    VERSION: "9029",
};
exports.GetNewPskResponse = {
    NEW_PSK_BY_GW: "9091",
};
exports.IPSODevice = {
    NAME: "9001",
    CREATED_AT: "9002",
    INSTANCE_ID: "9003",
};
// seems to be related
exports.GroupSetting = {
    ONOFF: "5850",
    DIMMER: "5851",
    INSTANCE_ID: "9003",
    SCENE_ID: "9039",
};
exports.HSGroup = {
    // from IPSODevice:
    NAME: "9001",
    CREATED_AT: "9002",
    INSTANCE_ID: "9003",
    //
    ONOFF: "5850",
    DIMMER: "5851",
    HS_ACCESSORY_LINK: "9018",
    SCENE_ID: "9039",
};
exports.HSLink = {
    INSTANCE_ID: "9003",
};
// */
// for example the remote
exports.HSAccessory = {
    // from IPSODevice:
    NAME: "9001",
    CREATED_AT: "9002",
    INSTANCE_ID: "9003",
    //
    DEVICE: "3",
    LAST_SEEN: "9020",
    LIGHT: "3311",
    PLUG: "3312",
    REACHABILITY_STATE: "9019",
    SENSOR: "3300",
    SWITCH: "15009",
    OTA_UPDATE_STATE: "9054",
};
exports.Light = {
    COLOR: "5706",
    COLOR_X: "5709",
    COLOR_Y: "5710",
    CUM_ACTIVE_POWER: "5805",
    DIMMER: "5851",
    ONOFF: "5850",
    ON_TIME: "5852",
    POWER_FACTOR: "5820",
    TRANSITION_TIME: "5712",
    UNIT: "5701",
    _defaultColor: "#f1e0b5",
    _maxDimmer: 254,
    _dimmerTransitionTime: 5,
};
exports.LightSetting = {
    COLOR: "5706",
    DIMMER: "5851",
    INSTANCE_ID: "9003",
    ONOFF: "5850",
};
exports.Plug = {
    CUM_ACTIVE_POWER: "5805",
    DIMMER: "5851",
    ONOFF: "5850",
    ON_TIME: "5852",
    POWER_FACTOR: "5820",
};
exports.Scene = {
    // from IPSODevice:
    NAME: "9001",
    // ?CREATED_AT: '9002',
    // ?INSTANCE_ID: '9003',
    SCENE_ACTIVATE_FLAG: "9058",
    IKEA_MOODS: "9068",
    LIGHT_SETTING: "15013",
    SCENE_INDEX: "9057",
    USE_CURRENT_LIGHT_SETTINGS: "9070",
};
exports.Notification = {
    // from IPSODevice:
    // NAME: '9001',
    CREATED_AT: "9002",
    // INSTANCE_ID: '9003',
    NOTIFICATION_EVENT: "9015",
    NOTIFICATION_NVPAIR: "9017",
    NOTIFICATION_STATE: "9014",
};
exports.NotificationEvents = {
    LOSS_OF_INTERNET_CONNECTIVITY: "5001",
    GATEWAY_REBOOT_NOTIFICATION: "1003",
    NEW_FIRMWARE_AVAILABLE: "1001",
    UNKNOWN1: "1004",
    UNKNOWN2: "1005",
};
exports.Sensor = {
    SENSOR_TYPE: "5751",
    SENSOR_VALUE: "5700",
    TYPE: "5750",
    UNIT: "5701",
    MAX_MSR_VALUE: "5602",
    MAX_RNG_VALUE: "5604",
    MIN_MSR_VALUE: "5601",
    MIN_RNG_VALUE: "5603",
    RESET_MIN_MAX_MSR: "5605",
};
exports.Shortcut = {
    GROUP_SETTINGS: "9045",
    SHORTCUT_ICON_REFERENCE_TYPE: "9051",
};
exports.SmartTask = {
    END_ACTION: "9043",
    SMART_TASK_TYPE: "9040",
    START_ACTION: "9042",
    ONOFF: "5850",
    TRIGGER_TIME_INTERVAL: "9044",
    REPEAT_DAYS: "9041",
};
exports.SmartTaskAction = {
    GROUP_SETTINGS: "9045",
    LIGHT_SETTING: "15013",
    ONOFF: "5850",
};
exports.SmartTaskLightSettings = {
    DIMMER: "5851",
    INSTANCE_ID: "9003",
    TRANSITION_TIME: "5712",
};
exports.SmartTaskNotification = {
    INSTANCE_ID: "9003",
    ONOFF: "5850",
    SMART_TASK_ACTION: "9050",
};
exports.Device = {
    Battery: "9",
    FirmwareVersion: "3",
    Manufacture: "0",
    ModelNumber: "1",
    Power: "6",
    SerialNumber: "2",
};
exports.Time = {
    END_TIME_HR: "9048",
    END_TIME_MN: "9049",
    START_TIME_HR: "9046",
    START_TIME_MN: "9047",
};
// ===============
exports.ALL = {
    AUTH_PATH: "9063",
    CLIENT_IDENTITY_PROPOSED: "9090",
    COLOR: "5706",
    COLOR_X: "5709",
    COLOR_Y: "5710",
    COMMISSIONING_MODE: "9061",
    CREATED_AT: "9002",
    CUM_ACTIVE_POWER: "5805",
    CURRENT_TIMESTAMP: "9059",
    DEFAULT_DIMMER_TRANSITION_TIME: 5,
    DEVICE: "3",
    DIMMER: "5851",
    DIMMER_MAX: 254,
    DIMMER_MIN: 0,
    END_ACTION: "9043",
    END_TIME_HR: "9048",
    END_TIME_MN: "9049",
    ERROR_TAG: "errorcode",
    FORCE_CHECK_OTA_UPDATE: "9032",
    GATEWAY: "15011",
    GATEWAY_DETAILS: "15012",
    GATEWAY_NAME: "9035",
    GATEWAY_REBOOT_NOTIFICATION: "1003",
    GATEWAY_REBOOT_NOTIFICATION_TYPE: "9052",
    GATEWAY_TIME_SOURCE: "9071",
    GATEWAY_UPDATE_DETAILS_URL: "9056",
    GATEWAY_UPDATE_PROGRESS: "9055",
    GROUPS: "15004",
    GROUP_ID: "9038",
    GROUP_LINK_ARRAY: "9995",
    GROUP_SETTINGS: "9045",
    HS_ACCESSORY_LINK: "9018",
    HS_LINK: "15002",
    IKEA_MOODS: "9068",
    INSTANCE_ID: "9003",
    LAST_SEEN: "9020",
    LIGHT: "3311",
    LIGHT_SETTING: "15013",
    LOSS_OF_INTERNET_CONNECTIVITY: "5001",
    MASTER_TOKEN_TAG: "9036",
    MAX_MSR_VALUE: "5602",
    MAX_RNG_VALUE: "5604",
    MIN_MSR_VALUE: "5601",
    MIN_RNG_VALUE: "5603",
    NAME: "9001",
    NEW_FIRMWARE_AVAILABLE: "1001",
    NEW_PSK_BY_GW: "9091",
    NOTIFICATION_EVENT: "9015",
    NOTIFICATION_NVPAIR: "9017",
    NOTIFICATION_STATE: "9014",
    NTP_SERVER: "9023",
    ONOFF: "5850",
    ON_TIME: "5852",
    OPEN: "1",
    OPTION_APP_TOKEN: "2051",
    OTA_UPDATE: "9037",
    OTA_UPDATE_STATE: "9054",
    PLUG: "3312",
    POWER_FACTOR: "5820",
    REACHABILITY_STATE: "9019",
    REBOOT: "9030",
    REPEAT_DAYS: "9041",
    RESET: "9031",
    RESET_MIN_MAX_MSR: "5605",
    SCENE: "15005",
    SCENE_ACTIVATE_FLAG: "9058",
    SCENE_ID: "9039",
    SCENE_INDEX: "9057",
    SCENE_LINK: "9009",
    SENSOR: "3300",
    SENSOR_TYPE: "5751",
    SENSOR_VALUE: "5700",
    SESSION_ID: "9033",
    SESSION_LENGTH: "9064",
    SHORTCUT_ICON_REFERENCE_TYPE: "9051",
    SMART_TASK_ACTION: "9050",
    SMART_TASK_TEMPLATE: "9016",
    SMART_TASK_TRIGGERED_EVENT: "1002",
    SMART_TASK_TYPE: "9040",
    START_ACTION: "9042",
    START_TIME_HR: "9046",
    START_TIME_MN: "9047",
    SWITCH: "15009",
    TIME_ARRAY: "9994",
    TIME_REMAINING_IN_SECONDS: "9024",
    TRANSITION_TIME: "5712",
    TRIGGER_TIME_INTERVAL: "9044",
    TYPE: "5750",
    UNIT: "5701",
    UPDATE_ACCEPTED_TIMESTAMP: "9069",
    UPDATE_FIRMWARE: "9034",
    USE_CURRENT_LIGHT_SETTINGS: "9070",
    VERSION: "9029",
    NOT_AT_HOME_SMART_TASK: 1,
    LIGHTS_OFF_SMART_TASK: 2,
    WAKE_UP_SMART_TASK: 3,
    OTA_TYPE: "9066",
    OTA_CRITICAL: 1,
    OTA_FORCED: 5,
    OTA_NORMAL: 0,
    OTA_REQUIRED: 2,
};
