webpackJsonp(["main"],{

/***/ "./admin/src/components/fragment.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function Fragment(props) {
    return props.children;
}
exports.default = Fragment;


/***/ }),

/***/ "./admin/src/components/groups.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const React = __webpack_require__("./node_modules/react/index.js");
class Groups extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("div", null, "Placeholder for group management functions"));
    }
}
exports.Groups = Groups;


/***/ }),

/***/ "./admin/src/components/settings.tsx":
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
            React.createElement(Tooltip, { text: "Der Hostname ist \"gw-\" gefolgt von der MAC-Adresse bzw. Seriennummer des Gateways, ohne Sonderzeichen, z.B. gw-a0b1c2d3e4f5. Er findet sich auf der Unterseite des Gateways" }),
            React.createElement("input", { className: "value", id: "host", value: this.getSetting("host"), onChange: this.handleChange }),
            React.createElement("br", null),
            React.createElement(Label, { for: "securityCode", text: "Security-Code:" }),
            React.createElement(Tooltip, { text: "Der Security-Code findet sich auf der Unterseite des Gateways" }),
            React.createElement("input", { className: "value", id: "securityCode", value: this.getSetting("securityCode"), onChange: this.handleChange })));
    }
}
exports.Settings = Settings;


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
        this.state = {
            tabs: props.tabs,
        };
        this.containerId = this.props.id || "tabs";
    }
    componentDidMount() {
        if (!adapter_1.$$)
            return; // we're in a test environment without jQuery
        adapter_1.$$(`#${this.containerId}`).tabs();
    }
    render() {
        return (React.createElement("div", { id: this.containerId },
            React.createElement("ul", null, Object.keys(this.state.tabs).map((k, i) => React.createElement("li", { key: i },
                React.createElement("a", { href: `#${this.containerId}-${i}` }, adapter_1._(k))))),
            Object.keys(this.state.tabs).map((k, i) => React.createElement("div", { key: i, id: `${this.containerId}-${i}` }, this.state.tabs[k]))));
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
const groups_1 = __webpack_require__("./admin/src/components/groups.tsx");
const settings_1 = __webpack_require__("./admin/src/components/settings.tsx");
const tabs_1 = __webpack_require__("./admin/src/components/tabs.tsx");
const namespace = `tradfri.${adapter_1.instance}`;
// layout components
function Header() {
    return (React.createElement("h3", { className: "translate", "data-role": "adapter-name" }, adapter_1._("Tradfri adapter settings")));
}
function Root(props) {
    return (React.createElement(fragment_1.default, null,
        React.createElement(Header, null),
        React.createElement(tabs_1.Tabs, { tabs: {
                Settings: React.createElement(settings_1.Settings, { settings: props.settings, onChange: props.onSettingsChanged }),
                Groups: React.createElement(groups_1.Groups, null),
            } })));
}
let curSettings;
// the function loadSettings has to exist ...
adapter_1.$window.load = (settings, onChange) => {
    const settingsChanged = (newSettings, hasChanges) => {
        curSettings = newSettings;
        onChange(hasChanges);
        console.log(`settings changed: ${JSON.stringify(curSettings)}, hasChanges=${hasChanges}`);
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
// fix missing property errors/warnings
exports.$window = window;
exports.$$ = exports.$window.jQuery;
exports.instance = exports.$window.instance;
exports._ = exports.$window._;


/***/ })

},["./admin/src/index.tsx"]);
//# sourceMappingURL=main.bundle.js.map