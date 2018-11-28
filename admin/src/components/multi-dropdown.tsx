// Renders some components in jQuery UI tabs
import $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { $window, _, instance} from "../lib/adapter";

// tslint:disable-next-line:variable-name
const M_Select = (M.FormSelect || (M as any).Select as typeof M.FormSelect);

interface MultiDropdownProps {
	options: {[key: string]: string};
	checkedOptions: string[];
	checkedChanged: (selected: string[]) => void;
}

interface MultiDropdownState {
	checkedOptions: string[];
}

export class MultiDropdown extends React.Component<MultiDropdownProps, MultiDropdownState> {

	constructor(props: MultiDropdownProps) {
		super(props);
		this.state = {
			checkedOptions: props.checkedOptions,
		};

		this.readStateFromUI = this.readStateFromUI.bind(this);
	}

	private dropdown: HTMLSelectElement | null | undefined;
	private mcssSelect: M.FormSelect | null | undefined;

	public componentDidMount() {
		this.updateUI();

		if (this.dropdown != null) {
			$(this.dropdown).on("change", this.readStateFromUI as any);

			this.mcssSelect = M_Select.init(this.dropdown);
		}
	}

	public componentWillUnmount() {
		if (this.dropdown != null) {
			$(this.dropdown).off("change", this.readStateFromUI as any);
		}
	}

	public componentDidUpdate() {
		this.updateUI();
	}

	private updateUI() {
		if (!this.dropdown) return;
		const $dropdown = $(this.dropdown);
		$dropdown.find("option:selected").prop("selected", false);
		this.state.checkedOptions.forEach(val => {
			$dropdown.find(`option[value=${val}]`).prop("selected", true);
		});
	}

	private readStateFromUI() {
		if (!this.mcssSelect) return;
		// read data from UI
		this.setState({checkedOptions: this.mcssSelect.getSelectedValues()}, () => {
			// update the adapter settings
			this.props.checkedChanged(this.state.checkedOptions);
		});
	}

	public render() {
		return (
			<select
				multiple={true}
				ref={(me) => this.dropdown = me}
				defaultValue={[""]}
			>
			<option value="" disabled>{_("select devices")}</option>
			{Object.keys(this.props.options).map(k => (
				<option key={k} value={k}>
					{this.props.options[k]}
				</option>
			))}
			</select>
		);
	}
}
