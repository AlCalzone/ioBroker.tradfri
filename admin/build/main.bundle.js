webpackJsonp(["main"],{

/***/ "./admin/src/components/editable-label.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
class EditableLabel extends React.Component {
    constructor(props) {
        super(props);
        this.beginEdit = () => {
            this.setState({ editMode: true });
            this.selectPending = true;
        };
        this.onEdit = () => {
            this.setState({
                text: this.txtEdit.value,
            });
        };
        this.endEdit = (save = true) => {
            this.setState({
                editMode: false,
            });
            this.selectPending = false;
            if (save) {
                this.props.textChanged(this.state.text);
            }
            else {
                this.setState({ text: this.props.text });
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
            editMode: false,
            text: props.text,
        };
    }
    render() {
        if (this.state.editMode) {
            return (React.createElement("input", { type: "text", ref: (me) => {
                    this.txtEdit = me;
                    if (this.txtEdit != null && this.selectPending) {
                        this.txtEdit.select();
                        this.selectPending = false;
                    }
                }, onBlur: () => this.endEdit(), onKeyDown: this.keyDown, onChange: this.onEdit, value: this.state.text, maxLength: this.props.maxLength || 200, autoFocus: true }));
        }
        else {
            return (React.createElement("span", { onClick: this.beginEdit }, this.state.text));
        }
    }
}
exports.EditableLabel = EditableLabel;


/***/ }),

/***/ "./admin/src/components/fragment.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function Fragment(props) {
    return props.children;
}
exports.default = Fragment;


/***/ }),

/***/ "./admin/src/components/multi-dropdown.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
class MultiDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.optionClicked = (event, ui) => {
            const index = this.state.checkedOptions.indexOf(ui.value);
            const checked = [...this.state.checkedOptions];
            if (ui.checked) {
                if (index === -1)
                    checked.push(ui.value);
            }
            else {
                if (index !== -1)
                    checked.splice(index, 1);
            }
            this.setState({ checkedOptions: checked });
        };
        this.dropdownClosed = () => {
            this.props.checkedChanged(this.state.checkedOptions);
        };
        this.state = {
            checkedOptions: props.checkedOptions,
        };
    }
    componentDidMount() {
        adapter_1.$$(this.dropdown).multiselect({
            minWidth: 250,
            header: false,
            classes: "ui-selectmenu-button",
            noneSelectedText: adapter_1._("select devices"),
            selectedText: adapter_1._("# devices selected"),
            click: this.optionClicked,
            close: this.dropdownClosed,
        });
        this.updateChecked();
    }
    componentDidUpdate() {
        this.updateChecked();
    }
    updateChecked() {
        const $dropdown = adapter_1.$$(this.dropdown);
        $dropdown.find("option:selected").prop("selected", false);
        this.state.checkedOptions.forEach(val => {
            $dropdown.find(`option[value=${val}]`).prop("selected", true);
        });
        $dropdown.multiselect("refresh");
    }
    render() {
        return (React.createElement("select", { multiple: true, ref: (me) => this.dropdown = me }, Object.keys(this.props.options).map(k => (React.createElement("option", { key: k, value: k }, this.props.options[k])))));
    }
}
exports.MultiDropdown = MultiDropdown;
// $('#assAssNodes').multiselect({
// 	header: false,
// 	minWidth: 250,
// 	noneSelectedText: '<span class="ui-selectmenu-text">select nodes</span>',
// 	selectedText: '<span class="ui-selectmenu-text"># nodes selected</span>',
// 	classes: 'ui-selectmenu-button',
// 	click: function(event, ui){
// 		if (ui.checked) {
// 		}
// 	}
// })


/***/ }),

/***/ "./admin/src/components/tabs.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
class Tabs extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {
        // 	tabs: props.tabs,
        // };
        this.containerId = this.props.id || "tabs";
    }
    componentDidMount() {
        adapter_1.$$(`#${this.containerId}`).tabs();
    }
    render() {
        return (React.createElement("div", { id: this.containerId },
            React.createElement("ul", null, this.props.labels.map((k, i) => React.createElement("li", { key: i },
                React.createElement("a", { href: `#${this.containerId}-${i}` }, adapter_1._(k))))),
            this.props.labels.map((k, i) => React.createElement("div", { key: i, id: `${this.containerId}-${i}` }, this.props.children[i]))));
    }
}
exports.Tabs = Tabs;


/***/ }),

/***/ "./admin/src/index.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
const ReactDOM = __webpack_require__("./node_modules/react-dom/index.js");
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
// components
const fragment_1 = __webpack_require__("./admin/src/components/fragment.tsx");
const tabs_1 = __webpack_require__("./admin/src/components/tabs.tsx");
const groups_1 = __webpack_require__("./admin/src/pages/groups.tsx");
const settings_1 = __webpack_require__("./admin/src/pages/settings.tsx");
const namespace = `tradfri.${adapter_1.instance}`;
// layout components
function Header() {
    return (React.createElement("h3", { className: "translate", "data-role": "adapter-name" }, adapter_1._("Tradfri adapter settings")));
}
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
            else if (!obj || obj.common.type === "device") {
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
        return (React.createElement(fragment_1.default, null,
            React.createElement(Header, null),
            React.createElement(tabs_1.Tabs, { labels: ["Settings", "Groups"] },
                React.createElement(settings_1.Settings, { settings: this.props.settings, onChange: this.props.onSettingsChanged }),
                React.createElement(groups_1.Groups, { groups: this.state.groups, devices: this.state.devices }))));
    }
}
exports.Root = Root;
let curSettings;
// the function loadSettings has to exist ...
adapter_1.$window.load = (settings, onChange) => {
    const settingsChanged = (newSettings, hasChanges) => {
        curSettings = newSettings;
        onChange(hasChanges);
    };
    ReactDOM.render(React.createElement(Root, { settings: settings, onSettingsChanged: settingsChanged }), document.getElementById("adapter-container"));
    // Signal to admin, that no changes yet
    onChange(false);
};
// ... and the function save has to exist.
// you have to make sure the callback is called with the settings object as first param!
adapter_1.$window.save = (callback) => {
    // save the settings
    callback(curSettings);
};


/***/ }),

/***/ "./admin/src/lib/adapter.ts":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.$window = window;
exports.$$ = exports.$window.jQuery;
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
const editable_label_1 = __webpack_require__("./admin/src/components/editable-label.tsx");
const fragment_1 = __webpack_require__("./admin/src/components/fragment.tsx");
const multi_dropdown_1 = __webpack_require__("./admin/src/components/multi-dropdown.tsx");
const ADD_GROUP_BUTTON_ID = "btnAddGroup";
class Groups extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        adapter_1.$$(`#${ADD_GROUP_BUTTON_ID}`).button({
            icons: { primary: "ui-icon-plusthick" },
        });
        adapter_1.$$(`#virtual-groups .delete-group`).button({
            icons: { primary: "ui-icon-trash" },
            text: false,
        });
    }
    componentDidUpdate() {
        adapter_1.$$(`#virtual-groups .delete-group`).button({
            icons: { primary: "ui-icon-trash" },
            text: false,
        });
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
        return (React.createElement(fragment_1.default, null,
            React.createElement("p", { className: "actions-panel" },
                React.createElement("button", { id: ADD_GROUP_BUTTON_ID, onClick: this.addGroup }, adapter_1._("add group"))),
            React.createElement("table", { id: "virtual-groups" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "ui-widget-header" },
                        React.createElement("td", { className: "id" }, adapter_1._("ID")),
                        React.createElement("td", { className: "name" }, adapter_1._("Name")),
                        React.createElement("td", { className: "devices" }, adapter_1._("Devices")),
                        React.createElement("td", { className: "delete" }))),
                React.createElement("tbody", null, (this.props.groups && Object.keys(this.props.groups).length > 0 ? (Object.keys(this.props.groups)
                    .map(k => this.props.groups[k])
                    .map(group => (React.createElement("tr", { key: group.id },
                    React.createElement("td", null, group.id),
                    React.createElement("td", null,
                        React.createElement(editable_label_1.EditableLabel, { text: group.name, maxLength: 100, textChanged: (newText) => this.renameGroup(group.id, newText) })),
                    React.createElement("td", null, (this.props.devices && Object.keys(this.props.devices).length > 0) ? (React.createElement(multi_dropdown_1.MultiDropdown, { options: this.devicesToDropdownSource(this.props.devices), checkedOptions: (group.deviceIDs || []).map(id => `${id}`), checkedChanged: (checked) => this.changeGroupDevices(group.id, checked) })) : adapter_1._("no devices")),
                    React.createElement("td", null,
                        React.createElement("button", { title: adapter_1._("delete group"), className: "delete-group", onClick: () => this.deleteGroup(group.id) })))))) : (React.createElement("tr", null,
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
const adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
/** Helper component for a settings label */
function Label(props) {
    return React.createElement("label", { htmlFor: props.for, className: (props.class || []).join(" ") },
        adapter_1._(props.text),
        " ");
}
/** Helper component for a tooltip */
function Tooltip(props) {
    return React.createElement("img", { className: "admin-tooltip-icon", src: "../../img/info.png", title: adapter_1._(props.text) });
}
class Settings extends React.Component {
    constructor(props) {
        super(props);
        // settings are our state
        this.state = Object.assign({}, props.settings);
        // remember the original settings
        this.originalSettings = Object.assign({}, props.settings);
        // setup change handlers
        this.handleChange = this.handleChange.bind(this);
    }
    // gets called when the form elements are changed by the user
    handleChange(event) {
        const target = event.target; // TODO: more types
        // store the setting
        this.putSetting(target.id, target.value, () => {
            // and notify the admin UI about changes
            this.props.onChange(this.state, this.hasChanges());
        });
    }
    /**
     * Reads a setting from the state object and transforms the value into the correct format
     * @param key The setting key to lookup
     */
    getSetting(key) {
        return this.state[key];
    }
    /**
     * Saves a setting in the state object and transforms the value into the correct format
     * @param key The setting key to store at
     */
    putSetting(key, value, callback) {
        this.setState({ [key]: value }, callback);
    }
    /**
     * Checks if any setting was changed
     */
    hasChanges() {
        for (const key of Object.keys(this.originalSettings)) {
            if (this.originalSettings[key] !== this.state[key])
                return true;
        }
        return false;
    }
    onSave() {
        return this.state;
    }
    render() {
        return (React.createElement("p", { key: "content", className: "settings-table" },
            React.createElement(Label, { for: "host", text: "Gateway IP/Hostname:" }),
            React.createElement(Tooltip, { text: "hostname tooltip" }),
            React.createElement("input", { className: "value", id: "host", value: this.getSetting("host"), onChange: this.handleChange }),
            React.createElement("br", null),
            React.createElement(Label, { for: "securityCode", text: "Security-Code:" }),
            React.createElement(Tooltip, { text: "security code tooltip" }),
            React.createElement("input", { className: "value", id: "securityCode", value: this.getSetting("securityCode"), onChange: this.handleChange })));
    }
}
exports.Settings = Settings;


/***/ })

},["./admin/src/index.tsx"]);
//# sourceMappingURL=main.bundle.js.map