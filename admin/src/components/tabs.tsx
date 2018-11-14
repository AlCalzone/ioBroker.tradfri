// Renders some components in jQuery UI tabs
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { $window, _, instance } from "../lib/adapter";

interface TabsProps {
	id?: string;
	labels: string[];
	children: React.ReactNode[];
}

export class Tabs extends React.Component<TabsProps> {

	constructor(props: TabsProps) {
		super(props);
		this.containerId = this.props.id || "tabs";
	}

	private containerId: string;

	public render() {
		return (
			<div className="row" id={this.containerId}>
				<div className="tabs-header col s12">
					<ul className="tabs">
						{this.props.labels.map(
							(k, i) => <li className="tab col s3" key={i}><a href={`#${this.containerId}-${i}`}>{_(k)}</a></li>,
						)}
					</ul>
				</div>
				{React.Children.map(this.props.children, (child, i) => (
					<div className="col s12" key={i} id={`${this.containerId}-${i}`}>
						{child}
					</div>
				))}
			</div>
		);
	}
}
