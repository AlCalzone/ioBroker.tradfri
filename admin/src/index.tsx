// root objects
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

// components
import Fragment from "./components/fragment";
import { Groups } from "./components/groups";
import { OnSettingsChangedCallback, Settings } from "./components/settings";
import { Tabs } from "./components/tabs";

const $window = window as any;
const namespace = `tradfri.${$window.instance}`;

// layout components
function Header() {
	return (
		<h3 className="translate" data-role="adapter-name">Tradfri adapter settings</h3>
	);
}

function Root(props) {
	return (
		<Fragment>
			<Header />
			<Tabs tabs={{
				Settings: <Settings settings={props.settings} onChange={props.onSettingsChanged} />,
				Groups: <Groups />,
			}} />
		</Fragment>
	);
}

let curSettings: any;

// the function loadSettings has to exist ...
$window.load = (settings, onChange) => {

	const settingsChanged: OnSettingsChangedCallback = (newSettings, hasChanges: boolean) => {
		curSettings = newSettings;
		onChange(hasChanges);
		console.log(`settings changed: ${JSON.stringify(curSettings)}, hasChanges=${hasChanges}`);
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
