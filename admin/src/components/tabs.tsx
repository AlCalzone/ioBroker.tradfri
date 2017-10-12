// Renders some components in jQuery UI tabs
import * as React from "react";
import * as ReactDOM from "react-dom";

// fix missing property errors/warnings
const $window = window as any;
const $ = $window.jQuery as JQuery;
const $$ = $ as any;

export class Tabs extends React.Component<any, any> {

	constructor(props) {
		super(props);
		this.state = {
			tabs: props.tabs,
		};
		this.containerId = this.props.id || "tabs";
	}

	private containerId: string;

	public componentDidMount() {
		if (!$) return; // we're in a test environment without jQuery

		$$(`#${this.containerId}`).tabs();
	}

	public render() {
		return (
			<div id={this.containerId}>
				<ul>
					{Object.keys(this.state.tabs).map(
						(k, i) => <li key={i}><a href={`#${this.containerId}-${i}`} className="translate">{k}</a></li>,
					)}
				</ul>
				{Object.keys(this.state.tabs).map(
					(k, i) => <div key={i} id={`#${this.containerId}-${i}`}>{this.state.tabs[k]}</div>,
				)}
			</div>
		);
	}
}
