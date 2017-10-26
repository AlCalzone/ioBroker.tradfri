import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance, sendTo, socket} from "../lib/adapter";

import { EditableLabel } from "../components/editable-label";
import Fragment from "../components/fragment";

// Load communication objects as defined in the message module
import { Group } from "../../../src/adapter/communication";

export interface GroupDictionary {
	[id: string]: Group;
}
interface GroupsProps {
	groups: GroupDictionary;
}

const ADD_GROUP_BUTTON_ID = "btnAddGroup";

export class Groups extends React.Component<GroupsProps, any> {

	constructor(props) {
		super(props);
	}

	public componentDidMount() {
		$$(`#${ADD_GROUP_BUTTON_ID}`).button({
			icons: { primary: "ui-icon-plusthick" },
		});
		$$(`#virtual-groups .delete-group`).button({
			icons: { primary: "ui-icon-trash" },
			text: false,
		});
	}

	public componentDidUpdate() {
		$$(`#virtual-groups .delete-group`).button({
			icons: { primary: "ui-icon-trash" },
			text: false,
		});
	}

	private addGroup() {
		sendTo(null, "addVirtualGroup", null, (result) => {
			if (result && result.error) {
				console.error(result.error);
			}
		});
	}

	private deleteGroup(id: string) {
		sendTo(null, "deleteVirtualGroup", {id}, (result) => {
			if (result && result.error) {
				console.error(result.error);
			}
		});
	}

	private renameGroup(id: string, newName: string) {
		const group = this.props.groups[id];
		// if we have a valid name
		if (typeof newName === "string" && newName.length > 0 && newName !== group.name) {
			// update it on the server
			sendTo(null, "editVirtualGroup", {id, name: newName}, (result) => {
				if (result && result.error) {
					console.error(result.error);
				}
			});
		}
	}

	public render() {
		return (
			<Fragment>
				<p className="actions-panel">
					<button id={ADD_GROUP_BUTTON_ID} onClick={this.addGroup}>{_("add group")}</button>
				</p>
				<table id="virtual-groups">
					<thead>
						<tr className="ui-widget-header">
							<td className="id">{_("ID")}</td>
							<td className="name">{_("Name")}</td>
							<td className="devices">{_("Devices")}</td>
							<td className="delete"></td>
						</tr>
					</thead>
					<tbody>
						{(this.props.groups && Object.keys(this.props.groups).length > 0 ? (
							Object.keys(this.props.groups)
							.map(k => this.props.groups[k])
							.map(group => (
							<tr key={group.id}>
								<td>{group.id}</td>
								<td>
									<EditableLabel
										text={group.name}
										textChanged={(newText: string) => this.renameGroup(group.id, newText)}
									/>
								</td>
								{/* TODO: Turn this into a multiselect dropdown */}
								<td>{group.deviceIDs ? group.deviceIDs.join(", ") : ""}</td>
								<td>
									<button title={_("delete group")} className="delete-group" onClick={() => this.deleteGroup(group.id)}></button>
								</td>
							</tr>
							))
						) : (
							<tr>
								<td className="empty" colSpan={4}>{_("No virtual groups defined")}</td>
							</tr>
						))}
					</tbody>
				</table>
			</Fragment>
		);
	}

}
