import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

import Fragment from "../components/fragment";

// Load communication objects as defined in the message module
import { Group } from "../../../src/adapter/communication";

export interface GroupDictionary {
	[id: string]: Group;
}
interface GroupsProps {
	groups: GroupDictionary;
}

export class Groups extends React.Component<GroupsProps, any> {

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
						{(this.props.groups && Object.keys(this.props.groups).length > 0 ? (
							Object.keys(this.props.groups)
							.map(k => this.props.groups[k])
							.map(group => (
							<tr>
								<td>{group.id}</td>
								<td>{group.name}</td>
								{/* TODO: Turn this into a multiselect dropdown */}
								<td>{group.deviceIDs.join(", ")}</td>
							</tr>
							))
						) : (
							<tr>
								<td className="empty" colSpan={3}>{_("No virtual groups defined")}</td>
							</tr>
						))}
					</tbody>
				</table>
			</Fragment>
		);
	}

}
