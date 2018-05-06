// root objects
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance, sendTo, socket} from "./lib/adapter";

// components
import { Tabs } from "./components/tabs";
import { GroupDictionary, Groups } from "./pages/groups";
import { OnSettingsChangedCallback, Settings } from "./pages/settings";

const namespace = `tradfri.${instance}`;

// layout components
function Header() {
	return (
		<h3 className="translate" data-role="adapter-name">{_("Tradfri adapter settings")}</h3>
	);
}

export class Root extends React.Component<any, any> {

	constructor(props) {
		super(props);
		this.state = {
			groups: {},
			devices: {},
		};
	}

	public componentDidMount() {
		// subscribe to changes of virtual group objects
		socket.emit("subscribeObjects", namespace + ".VG-*");
		socket.on("objectChange", (id: string, obj) => {
			if (id.substring(0, namespace.length) !== namespace) return;
			if (id.match(/VG\-\d+$/)) {
				this.updateGroups();
			} else if (!obj || obj.common.type === "device") {
				this.updateDevices();
			}
		});
		// and update once on start
		this.updateGroups();
		this.updateDevices();
	}

	public updateGroups() {
		sendTo(null, "getGroups", { type: "virtual" }, (result) => {
			if (result && result.error) {
				console.error(result.error);
			} else {
				this.setState({groups: result.result as GroupDictionary});
			}
		});
	}

	public updateDevices() {
		sendTo(null, "getDevices", { type: "lightbulb" }, (result) => {
			if (result && result.error) {
				console.error(result.error);
			} else {
				this.setState({devices: result.result as GroupDictionary});
			}
		});
	}

	public render() {
		return (
			<>
				<Header />
				<Tabs labels={["Settings", "Groups"]}>
					<Settings settings={this.props.settings} onChange={this.props.onSettingsChanged} />
					<Groups groups={this.state.groups} devices={this.state.devices} />
				</Tabs>
			</>
		);
	}

}

let curSettings: Record<string, any>;
let originalSettings: Record<string, any>;

/**
 * Checks if any setting was changed
 */
function hasChanges(): boolean {
	if (Object.keys(originalSettings).length !== Object.keys(curSettings).length) return true;
	for (const key of Object.keys(originalSettings)) {
		if (originalSettings[key] !== curSettings[key]) return true;
	}
	return false;
}

// the function loadSettings has to exist ...
$window.load = (settings, onChange) => {

	originalSettings = settings;

	const settingsChanged: OnSettingsChangedCallback = (newSettings) => {
		curSettings = newSettings;
		onChange(hasChanges());
	};

	ReactDOM.render(
		<Root settings={settings} onSettingsChanged={settingsChanged} />,
		document.getElementById("adapter-container"),
	);

	// Signal to admin, that no changes yet
	onChange(false);
};

// ... and the function save has to exist.
// you have to make sure the callback is called with the settings object as first param!
$window.save = (callback) => {
	// save the settings
	callback(curSettings);
	originalSettings = curSettings;
};
