import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

import Fragment from "./fragment";

export class Groups extends React.Component<any, any> {

	constructor(props) {
		super(props);
	}

	public render() {
		return (
			<Fragment>
				<table id="virtual-groups">
					<thead>
						<tr className="ui-widget-header">
							<td className="id">{_("ID")}</td>
							<td className="name">{_("Name")}</td>
							<td className="devices">{_("Devices")}</td>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td colSpan={3}>Placeholder</td>
						</tr>
						<tr>
							<td colSpan={3}>Placeholder</td>
						</tr>
						<tr>
							<td colSpan={3}>Placeholder</td>
						</tr>
					</tbody>
				</table>
			</Fragment>
		);
	}

}
