webpackJsonp(["main"],{

/***/ "./admin/src/components/editable-label.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var EditableLabel = /** @class */ (function (_super) {
    __extends(EditableLabel, _super);
    function EditableLabel(props) {
        var _this = _super.call(this, props) || this;
        _this.beginEdit = function () {
            _this.setState({ editMode: true });
            _this.selectPending = true;
        };
        _this.onEdit = function () {
            _this.setState({
                text: _this.txtEdit.value,
            });
        };
        _this.endEdit = function (save) {
            if (save === void 0) { save = true; }
            _this.setState({
                editMode: false,
            });
            _this.selectPending = false;
            if (save) {
                _this.props.textChanged(_this.state.text);
            }
            else {
                _this.setState({ text: _this.props.text });
            }
        };
        _this.keyDown = function (e) {
            if (e.keyCode === 13 /* Enter */) {
                _this.endEdit();
            }
            else if (e.keyCode === 27 /* Escape */) {
                _this.endEdit(false);
            }
        };
        _this.selectPending = false;
        _this.state = {
            editMode: false,
            text: props.text,
        };
        return _this;
    }
    EditableLabel.prototype.render = function () {
        var _this = this;
        if (this.state.editMode) {
            return (React.createElement("input", { type: "text", ref: function (me) {
                    _this.txtEdit = me;
                    if (_this.txtEdit != null && _this.selectPending) {
                        _this.txtEdit.select();
                        _this.selectPending = false;
                    }
                }, onBlur: function () { return _this.endEdit(); }, onKeyDown: this.keyDown, onChange: this.onEdit, value: this.state.text, maxLength: this.props.maxLength || 200, autoFocus: true }));
        }
        else {
            return (React.createElement("span", { onClick: this.beginEdit }, this.state.text));
        }
    };
    return EditableLabel;
}(React.Component));
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

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
var MultiDropdown = /** @class */ (function (_super) {
    __extends(MultiDropdown, _super);
    function MultiDropdown(props) {
        var _this = _super.call(this, props) || this;
        _this.optionClicked = function (event, ui) {
            var index = _this.state.checkedOptions.indexOf(ui.value);
            var checked = _this.state.checkedOptions.slice();
            if (ui.checked) {
                if (index === -1)
                    checked.push(ui.value);
            }
            else {
                if (index !== -1)
                    checked.splice(index, 1);
            }
            _this.setState({ checkedOptions: checked });
        };
        _this.dropdownClosed = function () {
            _this.props.checkedChanged(_this.state.checkedOptions);
        };
        _this.state = {
            checkedOptions: props.checkedOptions,
        };
        return _this;
    }
    MultiDropdown.prototype.componentDidMount = function () {
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
    };
    MultiDropdown.prototype.componentDidUpdate = function () {
        this.updateChecked();
    };
    MultiDropdown.prototype.updateChecked = function () {
        var $dropdown = adapter_1.$$(this.dropdown);
        $dropdown.find("option:selected").prop("selected", false);
        this.state.checkedOptions.forEach(function (val) {
            $dropdown.find("option[value=" + val + "]").prop("selected", true);
        });
        $dropdown.multiselect("refresh");
    };
    MultiDropdown.prototype.render = function () {
        var _this = this;
        return (React.createElement("select", { multiple: true, ref: function (me) { return _this.dropdown = me; } }, Object.keys(this.props.options).map(function (k) { return (React.createElement("option", { key: k, value: k }, _this.props.options[k])); })));
    };
    return MultiDropdown;
}(React.Component));
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

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
var Tabs = /** @class */ (function (_super) {
    __extends(Tabs, _super);
    function Tabs(props) {
        var _this = _super.call(this, props) || this;
        // this.state = {
        // 	tabs: props.tabs,
        // };
        _this.containerId = _this.props.id || "tabs";
        return _this;
    }
    Tabs.prototype.componentDidMount = function () {
        adapter_1.$$("#" + this.containerId).tabs();
    };
    Tabs.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { id: this.containerId },
            React.createElement("ul", null, this.props.labels.map(function (k, i) { return React.createElement("li", { key: i },
                React.createElement("a", { href: "#" + _this.containerId + "-" + i }, adapter_1._(k))); })),
            this.props.labels.map(function (k, i) { return React.createElement("div", { key: i, id: _this.containerId + "-" + i }, _this.props.children[i]); })));
    };
    return Tabs;
}(React.Component));
exports.Tabs = Tabs;


/***/ }),

/***/ "./admin/src/index.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var ReactDOM = __webpack_require__("./node_modules/react-dom/index.js");
var adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
// components
var fragment_1 = __webpack_require__("./admin/src/components/fragment.tsx");
var tabs_1 = __webpack_require__("./admin/src/components/tabs.tsx");
var groups_1 = __webpack_require__("./admin/src/pages/groups.tsx");
var settings_1 = __webpack_require__("./admin/src/pages/settings.tsx");
var namespace = "tradfri." + adapter_1.instance;
// layout components
function Header() {
    return (React.createElement("h3", { className: "translate", "data-role": "adapter-name" }, adapter_1._("Tradfri adapter settings")));
}
var Root = /** @class */ (function (_super) {
    __extends(Root, _super);
    function Root(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            groups: {},
            devices: {},
        };
        return _this;
    }
    Root.prototype.componentDidMount = function () {
        var _this = this;
        // subscribe to changes of virtual group objects
        adapter_1.socket.emit("subscribeObjects", namespace + ".VG-*");
        adapter_1.socket.on("objectChange", function (id, obj) {
            if (id.substring(0, namespace.length) !== namespace)
                return;
            if (id.match(/VG\-\d+$/)) {
                _this.updateGroups();
            }
            else if (!obj || obj.common.type === "device") {
                _this.updateDevices();
            }
        });
        // and update once on start
        this.updateGroups();
        this.updateDevices();
    };
    Root.prototype.updateGroups = function () {
        var _this = this;
        adapter_1.sendTo(null, "getGroups", { type: "virtual" }, function (result) {
            if (result && result.error) {
                console.error(result.error);
            }
            else {
                _this.setState({ groups: result.result });
            }
        });
    };
    Root.prototype.updateDevices = function () {
        var _this = this;
        adapter_1.sendTo(null, "getDevices", { type: "lightbulb" }, function (result) {
            if (result && result.error) {
                console.error(result.error);
            }
            else {
                _this.setState({ devices: result.result });
            }
        });
    };
    Root.prototype.render = function () {
        return (React.createElement(fragment_1.default, null,
            React.createElement(Header, null),
            React.createElement(tabs_1.Tabs, { labels: ["Settings", "Groups"] },
                React.createElement(settings_1.Settings, { settings: this.props.settings, onChange: this.props.onSettingsChanged }),
                React.createElement(groups_1.Groups, { groups: this.state.groups, devices: this.state.devices }))));
    };
    return Root;
}(React.Component));
exports.Root = Root;
var curSettings;
// the function loadSettings has to exist ...
adapter_1.$window.load = function (settings, onChange) {
    var settingsChanged = function (newSettings, hasChanges) {
        curSettings = newSettings;
        onChange(hasChanges);
    };
    ReactDOM.render(React.createElement(Root, { settings: settings, onSettingsChanged: settingsChanged }), document.getElementById("adapter-container"));
    // Signal to admin, that no changes yet
    onChange(false);
};
// ... and the function save has to exist.
// you have to make sure the callback is called with the settings object as first param!
adapter_1.$window.save = function (callback) {
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
exports._ = exports.$window._ || (function (text) { return text; });
exports.socket = exports.$window.socket;
exports.sendTo = exports.$window.sendTo;


/***/ }),

/***/ "./admin/src/pages/groups.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
var editable_label_1 = __webpack_require__("./admin/src/components/editable-label.tsx");
var fragment_1 = __webpack_require__("./admin/src/components/fragment.tsx");
var multi_dropdown_1 = __webpack_require__("./admin/src/components/multi-dropdown.tsx");
var ADD_GROUP_BUTTON_ID = "btnAddGroup";
var Groups = /** @class */ (function (_super) {
    __extends(Groups, _super);
    function Groups(props) {
        return _super.call(this, props) || this;
    }
    Groups.prototype.componentDidMount = function () {
        adapter_1.$$("#" + ADD_GROUP_BUTTON_ID).button({
            icons: { primary: "ui-icon-plusthick" },
        });
        adapter_1.$$("#virtual-groups .delete-group").button({
            icons: { primary: "ui-icon-trash" },
            text: false,
        });
    };
    Groups.prototype.componentDidUpdate = function () {
        adapter_1.$$("#virtual-groups .delete-group").button({
            icons: { primary: "ui-icon-trash" },
            text: false,
        });
    };
    Groups.prototype.addGroup = function () {
        adapter_1.sendTo(null, "addVirtualGroup", null, function (result) {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    };
    Groups.prototype.deleteGroup = function (id) {
        adapter_1.sendTo(null, "deleteVirtualGroup", { id: id }, function (result) {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    };
    Groups.prototype.renameGroup = function (id, newName) {
        var group = this.props.groups[id];
        // if we have a valid name
        if (typeof newName === "string" && newName.length > 0 && newName !== group.name) {
            // update it on the server
            adapter_1.sendTo(null, "editVirtualGroup", { id: id, name: newName }, function (result) {
                if (result && result.error) {
                    console.error(result.error);
                }
            });
        }
    };
    Groups.prototype.changeGroupDevices = function (id, deviceIDs) {
        // update it on the server
        adapter_1.sendTo(null, "editVirtualGroup", { id: id, deviceIDs: deviceIDs }, function (result) {
            if (result && result.error) {
                console.error(result.error);
            }
        });
    };
    Groups.prototype.devicesToDropdownSource = function (devices) {
        var ret = {};
        for (var _i = 0, _a = Object.keys(devices); _i < _a.length; _i++) {
            var key = _a[_i];
            ret[key] = devices[key].name;
        }
        return ret;
    };
    Groups.prototype.render = function () {
        var _this = this;
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
                    .map(function (k) { return _this.props.groups[k]; })
                    .map(function (group) { return (React.createElement("tr", { key: group.id },
                    React.createElement("td", null, group.id),
                    React.createElement("td", null,
                        React.createElement(editable_label_1.EditableLabel, { text: group.name, maxLength: 100, textChanged: function (newText) { return _this.renameGroup(group.id, newText); } })),
                    React.createElement("td", null, (_this.props.devices && Object.keys(_this.props.devices).length > 0) ? (React.createElement(multi_dropdown_1.MultiDropdown, { options: _this.devicesToDropdownSource(_this.props.devices), checkedOptions: (group.deviceIDs || []).map(function (id) { return "" + id; }), checkedChanged: function (checked) { return _this.changeGroupDevices(group.id, checked); } })) : adapter_1._("no devices")),
                    React.createElement("td", null,
                        React.createElement("button", { title: adapter_1._("delete group"), className: "delete-group", onClick: function () { return _this.deleteGroup(group.id); } })))); })) : (React.createElement("tr", null,
                    React.createElement("td", { className: "empty", colSpan: 4 }, adapter_1._("No virtual groups defined"))))))),
            React.createElement("p", null, adapter_1._("changes are live"))));
    };
    return Groups;
}(React.Component));
exports.Groups = Groups;


/***/ }),

/***/ "./admin/src/pages/settings.tsx":
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __webpack_require__("./node_modules/react/index.js");
var adapter_1 = __webpack_require__("./admin/src/lib/adapter.ts");
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
var Settings = /** @class */ (function (_super) {
    __extends(Settings, _super);
    function Settings(props) {
        var _this = _super.call(this, props) || this;
        // settings are our state
        _this.state = __assign({}, props.settings);
        // remember the original settings
        _this.originalSettings = __assign({}, props.settings);
        // setup change handlers
        _this.handleChange = _this.handleChange.bind(_this);
        return _this;
    }
    // gets called when the form elements are changed by the user
    Settings.prototype.handleChange = function (event) {
        var _this = this;
        var target = event.target; // TODO: more types
        // store the setting
        this.putSetting(target.id, target.value, function () {
            // and notify the admin UI about changes
            _this.props.onChange(_this.state, _this.hasChanges());
        });
    };
    /**
     * Reads a setting from the state object and transforms the value into the correct format
     * @param key The setting key to lookup
     */
    Settings.prototype.getSetting = function (key) {
        return this.state[key];
    };
    /**
     * Saves a setting in the state object and transforms the value into the correct format
     * @param key The setting key to store at
     */
    Settings.prototype.putSetting = function (key, value, callback) {
        this.setState((_a = {}, _a[key] = value, _a), callback);
        var _a;
    };
    /**
     * Checks if any setting was changed
     */
    Settings.prototype.hasChanges = function () {
        for (var _i = 0, _a = Object.keys(this.originalSettings); _i < _a.length; _i++) {
            var key = _a[_i];
            if (this.originalSettings[key] !== this.state[key])
                return true;
        }
        return false;
    };
    Settings.prototype.onSave = function () {
        return this.state;
    };
    Settings.prototype.render = function () {
        return (React.createElement("p", { key: "content", className: "settings-table" },
            React.createElement(Label, { for: "host", text: "Gateway IP/Hostname:" }),
            React.createElement(Tooltip, { text: "hostname tooltip" }),
            React.createElement("input", { className: "value", id: "host", value: this.getSetting("host"), onChange: this.handleChange }),
            React.createElement("br", null),
            React.createElement(Label, { for: "securityCode", text: "Security-Code:" }),
            React.createElement(Tooltip, { text: "security code tooltip" }),
            React.createElement("input", { className: "value", id: "securityCode", value: this.getSetting("securityCode"), onChange: this.handleChange }),
            React.createElement("span", null, adapter_1._("code not stored")),
            React.createElement("br", null),
            React.createElement(Label, { for: "preserveTransitionTime", text: "Preserve transition time:" }),
            React.createElement(Tooltip, { text: "transition time tooltip" }),
            React.createElement("input", { className: "value", id: "preserveTransitionTime", value: this.getSetting("preserveTransitionTime"), onChange: this.handleChange })));
    };
    return Settings;
}(React.Component));
exports.Settings = Settings;


/***/ })

},["./admin/src/index.tsx"]);
//# sourceMappingURL=main.bundle.js.map