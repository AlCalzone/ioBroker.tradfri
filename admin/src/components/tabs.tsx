// Renders some components in jQuery UI tabs
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

export class Tabs extends React.Component<any, any> {

	constructor(props) {
		super(props);
		// this.state = {
		// 	tabs: props.tabs,
		// };
		this.containerId = this.props.id || "tabs";
	}

	private containerId: string;

	public componentDidMount() {
		$$(`#${this.containerId}`).tabs();
	}

	public render() {
		return (
			<div id={this.containerId}>
				<ul>
					{this.props.labels.map(
						(k, i) => <li key={i}><a href={`#${this.containerId}-${i}`}>{_(k)}</a></li>,
					)}
				</ul>
				{this.props.labels.map(
					(k, i) => <div key={i} id={`${this.containerId}-${i}`}>{this.props.children[i]}</div>,
				)}
			</div>
		);
	}
}
