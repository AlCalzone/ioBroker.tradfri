// root objects
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance, sendTo, socket} from "./lib/adapter";

// components
import Fragment from "./components/fragment";
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
		};
	}

	public componentDidMount() {
		// subscribe to changes of virtual group objects
		socket.emit("subscribeObjects", namespace + ".VG-*");
		socket.on("objectChange", (id: string, obj) => {
			if (id.substring(0, namespace.length) !== namespace) return;
			if (id.match(/VG\-\d+$/)) this.updateGroups();
		});
		// and update once on start
		this.updateGroups();
	}

	public get groups(): GroupDictionary {
		return this.state.groups;
	}
	public set groups(value: GroupDictionary) {
		this.setState({groups: value});
	}

	public updateGroups() {
		sendTo(null, "getGroups", { type: "virtual" }, (result) => {
			if (result && result.error) {
				console.error(result.error);
			} else {
				this.groups = result.result as GroupDictionary;
			}
		});
	}

	public render() {
		return (
			<Fragment>
				<Header />
				<Tabs labels={["Settings", "Groups"]}>
					<Settings settings={this.props.settings} onChange={this.props.onSettingsChanged} />
					<Groups groups={this.state.groups} />
				</Tabs>
			</Fragment>
		);
	}

}

let curSettings: any;

// the function loadSettings has to exist ...
$window.load = (settings, onChange) => {

	const settingsChanged: OnSettingsChangedCallback = (newSettings, hasChanges: boolean) => {
		curSettings = newSettings;
		onChange(hasChanges);
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
};
