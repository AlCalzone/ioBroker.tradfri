import * as React from "react";

import { _, sendTo } from "../lib/adapter";

import { CancelableInput, MultiDropdown } from "iobroker-react-components";

// Load communication objects as defined in the message module
import { Device, Group } from "../../../src/modules/communication";

export interface GroupDictionary {
	[id: string]: Group;
}
export interface DeviceDictionary {
	[id: string]: Device;
}
interface GroupsProps {
	groups: GroupDictionary;
	devices: DeviceDictionary;
}

const ADD_GROUP_BUTTON_ID = "btnAddGroup";

export class Groups extends React.Component<GroupsProps, any> {

	constructor(props: GroupsProps) {
		super(props);
	}

	private addGroup() {
		sendTo(null, "addVirtualGroup", null, (result) => {
			if (result && result.error) {
				console.error(result.error);
			}
		});
	}

	private deleteGroup(id: string) {
		sendTo(null, "deleteVirtualGroup", { id }, (result) => {
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
			sendTo(null, "editVirtualGroup", { id, name: newName }, (result) => {
				if (result && result.error) {
					console.error(result.error);
				}
			});
		}
	}

	private changeGroupDevices(id: string, deviceIDs: string[]) {
		// update it on the server
		sendTo(null, "editVirtualGroup", { id, deviceIDs }, (result) => {
			if (result && result.error) {
				console.error(result.error);
			}
		});
	}

	private devicesToDropdownSource(devices: DeviceDictionary) {
		const ret: Record<keyof DeviceDictionary, string> = {};
		for (const key of Object.keys(devices) as (keyof DeviceDictionary)[]) {
			ret[key] = devices[key].name;
		}
		return ret;
	}

	public render() {
		return (
			<>
				<p className="actions-panel">
					<button id={ADD_GROUP_BUTTON_ID} onClick={this.addGroup} className="btn">
						<i className="material-icons left">library_add</i>{_("add group")}
					</button>
				</p>
				<table id="virtual-groups">
					<thead>
						<tr>
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
								.map(group => {
									console.log("Rendering group: " + JSON.stringify(group));
									return (
										<tr key={group.id}>
											<td>{group.id}</td>
											<td>
												<CancelableInput
													text={group.name}
													maxLength={100}
													textChanged={(newText: string) => this.renameGroup(group.id, newText)}
												/>
											</td>
											<td>{
												(this.props.devices && Object.keys(this.props.devices).length > 0) ? (
													<MultiDropdown
														options={this.devicesToDropdownSource(this.props.devices)}
														checkedOptions={(group.deviceIDs || []).map(id => `${id}`)}
														checkedChanged={(checked: string[]) => this.changeGroupDevices(group.id, checked)}
													/>
												) : _("no devices")
											}</td>
											<td>
												<button title={_("delete group")} className="btn-small red" onClick={() => this.deleteGroup(group.id)}>
													<i className="material-icons">delete</i>
												</button>
											</td>
										</tr>
									);
								})
						) : (
								<tr>
									<td className="empty" colSpan={4}>{_("No virtual groups defined")}</td>
								</tr>
							))}
					</tbody>
				</table>
				<p>{_("changes are live")}</p>
			</>
		);
	}

}
