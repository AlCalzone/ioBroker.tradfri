webpackJsonp(["main"],{

/***/ "./admin/src/index.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const ReactDOM = __webpack_require__("./node_modules/react-dom/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
// components
const iobroker_react_components_1 = __webpack_require__("./node_modules/iobroker-react-components/build/index.js");
const groups_1 = __webpack_require__("./admin/src/pages/groups.tsx");
const settings_1 = __webpack_require__("./admin/src/pages/settings.tsx");
const namespace = `tradfri.${adapter_1.instance}`;
// layout components
function Header() {
    return (React.createElement("h3", { className: "translate", "data-role": "adapter-name" }, adapter_1._("Tradfri adapter settings")));
}
// TODO: Remove `any`
class Root extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: {},
            devices: {},
        };
    }
    componentDidMount() {
        // subscribe to changes of virtual group objects
        adapter_1.socket.emit("subscribeObjects", namespace + ".VG-*");
        adapter_1.socket.on("objectChange", (id, obj) => {
            if (id.substring(0, namespace.length) !== namespace)
                return;
            if (id.match(/VG\-\d+$/)) {
                this.updateGroups();
            }
            else if (!obj || obj.type === "device") {
                this.updateDevices();
            }
        });
        // and update once on start
        this.updateGroups();
        this.updateDevices();
    }
    updateGroups() {
        adapter_1.sendTo(null, "getGroups", { type: "virtual" }, (result) => {
            if (result && result.error) {
                console.error(result.error);
            }
            else {
                this.setState({ groups: result.result });
            }
        });
    }
    updateDevices() {
        adapter_1.sendTo(null, "getDevices", { type: "lightbulb" }, (result) => {
            if (result && result.error) {
                console.error(result.error);
            }
            else {
                this.setState({ devices: result.result });
            }
        });
    }
    render() {
        return (
        // <>
        // 	<Header />
        React.createElement(iobroker_react_components_1.Tabs, { labels: ["Settings", "Groups"] },
            React.createElement(settings_1.Settings, { settings: this.props.settings, onChange: this.props.onSettingsChanged }),
            React.createElement(groups_1.Groups, { groups: this.state.groups, devices: this.state.devices }))
        // </>
        );
    }
}
exports.Root = Root;
let curSettings;
let originalSettings;
/**
 * Checks if any setting was changed
 */
function hasChanges() {
    if (Object.keys(originalSettings).length !== Object.keys(curSettings).length)
        return true;
    for (const key of Object.keys(originalSettings)) {
        if (originalSettings[key] !== curSettings[key])
            return true;
    }
    return false;
}
// the function loadSettings has to exist ...
adapter_1.$window.load = (settings, onChange) => {
    originalSettings = settings;
    const settingsChanged = (newSettings) => {
        curSettings = newSettings;
        onChange(hasChanges());
    };
    ReactDOM.render(React.createElement(Root, { settings: settings, onSettingsChanged: settingsChanged }), document.getElementById("adapter-container") || document.getElementsByClassName("adapter-container")[0]);
    // Signal to admin, that no changes yet
    onChange(false);
};
// ... and the function save has to exist.
// you have to make sure the callback is called with the settings object as first param!
adapter_1.$window.save = (callback) => {
    // save the settings
    callback(curSettings);
    originalSettings = curSettings;
};


/***/ }),

/***/ "./admin/src/lib/adapter.ts":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.$window = window;
// export interface JQueryUI {
// 	tabs: (selector?: any) => JQuery & JQueryUI;
// 	button: (selector?: any) => JQuery & JQueryUI;
// 	multiselect: (selector?: any) => JQuery & JQueryUI;
// }
// export const $$ = $window.jQuery as any as (...args: any[]) => JQuery /* & JQueryUI */;
exports.instance = exports.$window.instance || 0;
exports._ = exports.$window._ || ((text) => text);
exports.socket = exports.$window.socket;
exports.sendTo = exports.$window.sendTo;


/***/ }),

/***/ "./admin/src/pages/groups.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
const iobroker_react_components_1 = __webpack_require__("./node_modules/iobroker-react-components/build/index.js");
const ADD_GROUP_BUTTON_ID = "btnAddGroup";
class Groups extends React.Component {
    constructor(props) {
        super(props);
    }
    addGroup() {
        adapter_1.sendTo(null, "addVirtualGroup", null, (result) => {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    }
    deleteGroup(id) {
        adapter_1.sendTo(null, "deleteVirtualGroup", { id }, (result) => {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    }
    renameGroup(id, newName) {
        const group = this.props.groups[id];
        // if we have a valid name
        if (typeof newName === "string" && newName.length > 0 && newName !== group.name) {
            // update it on the server
            adapter_1.sendTo(null, "editVirtualGroup", { id, name: newName }, (result) => {
                if (result && result.error) {
                    console.error(result.error);
                }
            });
        }
    }
    changeGroupDevices(id, deviceIDs) {
        // update it on the server
        adapter_1.sendTo(null, "editVirtualGroup", { id, deviceIDs }, (result) => {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    }
    devicesToDropdownSource(devices) {
        const ret = {};
        for (const key of Object.keys(devices)) {
            ret[key] = devices[key].name;
        }
        return ret;
    }
    render() {
        return (React.createElement(React.Fragment, null,
            React.createElement("p", { className: "actions-panel" },
                React.createElement("button", { id: ADD_GROUP_BUTTON_ID, onClick: this.addGroup, className: "btn" },
                    React.createElement("i", { className: "material-icons left" }, "library_add"),
                    adapter_1._("add group"))),
            React.createElement("table", { id: "virtual-groups" },
                React.createElement("thead", null,
                    React.createElement("tr", null,
                        React.createElement("td", { className: "id" }, adapter_1._("ID")),
                        React.createElement("td", { className: "name" }, adapter_1._("Name")),
                        React.createElement("td", { className: "devices" }, adapter_1._("Devices")),
                        React.createElement("td", { className: "delete" }))),
                React.createElement("tbody", null, (this.props.groups && Object.keys(this.props.groups).length > 0 ? (Object.keys(this.props.groups)
                    .map(k => this.props.groups[k])
                    .map(group => {
                    console.log("Rendering group: " + JSON.stringify(group));
                    return (React.createElement("tr", { key: group.id },
                        React.createElement("td", null, group.id),
                        React.createElement("td", null,
                            React.createElement(iobroker_react_components_1.CancelableInput, { text: group.name, maxLength: 100, textChanged: (newText) => this.renameGroup(group.id, newText) })),
                        React.createElement("td", null, (this.props.devices && Object.keys(this.props.devices).length > 0) ? (React.createElement(iobroker_react_components_1.MultiDropdown, { options: this.devicesToDropdownSource(this.props.devices), checkedOptions: (group.deviceIDs || []).map(id => `${id}`), checkedChanged: (checked) => this.changeGroupDevices(group.id, checked) })) : adapter_1._("no devices")),
                        React.createElement("td", null,
                            React.createElement("button", { title: adapter_1._("delete group"), className: "btn-small red", onClick: () => this.deleteGroup(group.id) },
                                React.createElement("i", { className: "material-icons" }, "delete")))));
                })) : (React.createElement("tr", null,
                    React.createElement("td", { className: "empty", colSpan: 4 }, adapter_1._("No virtual groups defined"))))))),
            React.createElement("p", null, adapter_1._("changes are live"))));
    }
}
exports.Groups = Groups;


/***/ }),

/***/ "./admin/src/pages/settings.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const iobroker_react_components_1 = __webpack_require__("./node_modules/iobroker-react-components/build/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
/** Helper component for a settings label */
function Label(props) {
    const classNames = (props.class || []);
    return (React.createElement("label", { htmlFor: props.for, className: classNames.join(" ") },
        adapter_1._(props.text),
        props.tooltip != null && React.createElement(iobroker_react_components_1.Tooltip, { text: props.tooltip })));
}
/** Inner label for a Materializes CSS checkbox (span, no for property) */
function CheckboxLabel(props) {
    const classNames = (props.class || []);
    return (React.createElement("span", { className: classNames.join(" ") },
        adapter_1._(props.text),
        props.tooltip != null && React.createElement(iobroker_react_components_1.Tooltip, { text: props.tooltip })));
}
class Settings extends React.Component {
    constructor(props) {
        super(props);
        // settings are our state
        this.state = Object.assign({}, props.settings);
        // setup change handlers
        this.handleChange = this.handleChange.bind(this);
    }
    parseChangedSetting(target) {
        // Checkboxes in MaterializeCSS are messed up, so we attach our own handler
        // However that one gets called before the underlying checkbox is actually updated,
        // so we need to invert the checked value here
        return target.type === "checkbox" ? !target.checked
            : target.type === "number" ? parseInt(target.value, 10)
                : target.value;
    }
    // gets called when the form elements are changed by the user
    handleChange(event) {
        const target = event.target; // TODO: more types
        const value = this.parseChangedSetting(target);
        // store the setting
        this.putSetting(target.id, value, () => {
            // and notify the admin UI about changes
            this.props.onChange(this.state);
        });
        return false;
    }
    /**
     * Reads a setting from the state object and transforms the value into the correct format
     * @param key The setting key to lookup
     */
    getSetting(key, defaultValue) {
        const ret = this.state[key];
        return ret != undefined ? ret : defaultValue;
    }
    /**
     * Saves a setting in the state object and transforms the value into the correct format
     * @param key The setting key to store at
     */
    putSetting(key, value, callback) {
        this.setState({ [key]: value }, callback);
    }
    componentWillUnmount() {
        if (this.chkPreserveTransitionTime != null) {
            $(this.chkPreserveTransitionTime).off("click", this.handleChange);
        }
    }
    componentDidMount() {
        // update floating labels in materialize design
        M.updateTextFields();
        // Fix materialize checkboxes
        if (this.chkPreserveTransitionTime != null) {
            $(this.chkPreserveTransitionTime).on("click", this.handleChange);
        }
    }
    render() {
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "row" },
                React.createElement("div", { className: "col s4 input-field" },
                    React.createElement("input", { type: "text", className: "value", id: "host", value: this.getSetting("host"), onChange: this.handleChange }),
                    React.createElement(Label, { for: "host", text: "Gateway IP/Hostname:", tooltip: "hostname tooltip" })),
                React.createElement("div", { className: "col s4 input-field" },
                    React.createElement("input", { type: "text", className: "value", id: "securityCode", value: this.getSetting("securityCode"), onChange: this.handleChange }),
                    React.createElement(Label, { for: "securityCode", text: "Security-Code:", tooltip: "security code tooltip" }),
                    React.createElement("span", null, adapter_1._("code not stored")))),
            React.createElement("div", { className: "row" },
                React.createElement("div", { className: "col s4" },
                    React.createElement("label", { htmlFor: "preserveTransitionTime" },
                        React.createElement("input", { type: "checkbox", className: "value", id: "preserveTransitionTime", defaultChecked: this.getSetting("preserveTransitionTime"), ref: me => this.chkPreserveTransitionTime = me }),
                        React.createElement(CheckboxLabel, { text: "Preserve transition time", tooltip: "transition time tooltip" }))),
                React.createElement("div", { className: "col s4 input-field" },
                    React.createElement("input", { type: "number", min: "0", max: "2", className: "value", id: "roundToDigits", value: this.getSetting("roundToDigits", 2), onChange: this.handleChange }),
                    React.createElement(Label, { for: "roundToDigits", text: "Decimal places:", tooltip: "roundto tooltip" })))));
    }
}
exports.Settings = Settings;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/components/cancelable-input.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
class CancelableInput extends React.Component {
    constructor(props) {
        super(props);
        this.beginEdit = () => {
            this.selectPending = true;
            this.setState({ editing: true });
        };
        this.onEdit = () => {
            this.setState({
                text: this.txtEdit.value,
            });
        };
        this.endEdit = (save = true) => {
            this.setState({
                editing: false,
            });
            this.selectPending = false;
            if (save) {
                if (this.state.text !== this.props.text)
                    this.props.textChanged(this.state.text);
                this.txtEdit.blur();
            }
            else {
                this.setState({ text: this.props.text }, () => this.txtEdit.blur());
            }
        };
        this.keyDown = (e) => {
            if (e.keyCode === 13 /* Enter */) {
                this.endEdit();
            }
            else if (e.keyCode === 27 /* Escape */) {
                this.endEdit(false);
            }
        };
        this.selectPending = false;
        this.state = {
            editing: false,
            text: props.text,
        };
    }
    render() {
        return (React.createElement("input", { type: "text", ref: (me) => {
                this.txtEdit = me;
                if (this.txtEdit != null && this.selectPending) {
                    this.txtEdit.select();
                    this.selectPending = false;
                }
            }, onBlur: () => this.endEdit(), onKeyDown: this.keyDown, onChange: this.onEdit, onFocus: this.beginEdit, value: this.state.text, maxLength: this.props.maxLength || 200 }));
    }
}
exports.CancelableInput = CancelableInput;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/components/label.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const tooltip_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/tooltip.js");
/** Helper component for a settings label */
function Label(props) {
    const classNames = (props.class || []);
    return (React.createElement("label", { htmlFor: props.for, className: classNames.join(" ") },
        _(props.text),
        props.tooltip != null && React.createElement(tooltip_1.Tooltip, { text: props.tooltip })));
}
exports.Label = Label;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/components/multi-dropdown.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Renders some components in jQuery UI tabs
const React = __webpack_require__("./node_modules/react/index.js");
// tslint:disable-next-line:variable-name
const M_Select = (M.FormSelect || M.Select);
class MultiDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.readStateFromUI = this.readStateFromUI.bind(this);
    }
    componentDidMount() {
        if (this.dropdown != null) {
            $(this.dropdown).on("change", this.readStateFromUI);
            this.mcssSelect = M_Select.getInstance(this.dropdown) || new M_Select(this.dropdown);
        }
    }
    componentWillUnmount() {
        if (this.dropdown != null) {
            $(this.dropdown).off("change", this.readStateFromUI);
        }
    }
    readStateFromUI() {
        if (!this.mcssSelect)
            return;
        // update the adapter settings
        this.props.checkedChanged(this.mcssSelect.getSelectedValues());
    }
    render() {
        return (React.createElement("select", { multiple: true, ref: me => this.dropdown = me, defaultValue: this.props.checkedOptions },
            React.createElement("option", { value: "", disabled: true }, _("select devices")),
            Object.keys(this.props.options).map(k => (React.createElement("option", { key: k, value: k }, this.props.options[k])))));
    }
}
MultiDropdown.defaultProps = {
    checkedOptions: [],
};
exports.MultiDropdown = MultiDropdown;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/components/tabs.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
// Renders some components in jQuery UI tabs
const React = __webpack_require__("./node_modules/react/index.js");
class Tabs extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("div", { className: "row", id: this.props.id },
            React.createElement("div", { className: "tabs-header col s12" },
                React.createElement("ul", { className: "tabs" }, this.props.labels.map((k, i) => React.createElement("li", { className: `tab col s${this.props.tabSize}`, key: i },
                    React.createElement("a", { href: `#${this.props.id}-${i}` }, _(k)))))),
            React.Children.map(this.props.children, (child, i) => (React.createElement("div", { className: "col s12", key: i, id: `${this.props.id}-${i}` }, child)))));
    }
}
Tabs.defaultProps = {
    id: "tabs",
    tabSize: 3,
};
exports.Tabs = Tabs;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/components/tooltip.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
/** Helper component for a tooltip */
function Tooltip(props) {
    return React.createElement("i", { className: "material-icons", title: _(props.text) }, "live_help");
}
exports.Tooltip = Tooltip;


/***/ }),

/***/ "./node_modules/iobroker-react-components/build/index.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var label_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/label.js");
exports.Label = label_1.Label;
var multi_dropdown_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/multi-dropdown.js");
exports.MultiDropdown = multi_dropdown_1.MultiDropdown;
var tabs_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/tabs.js");
exports.Tabs = tabs_1.Tabs;
var tooltip_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/tooltip.js");
exports.Tooltip = tooltip_1.Tooltip;
var cancelable_input_1 = __webpack_require__("./node_modules/iobroker-react-components/build/components/cancelable-input.js");
exports.CancelableInput = cancelable_input_1.CancelableInput;


/***/ })

},["./admin/src/index.tsx"]);
//# sourceMappingURL=main.bundle.js.map