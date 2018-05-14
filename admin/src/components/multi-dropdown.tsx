// Renders some components in jQuery UI tabs
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { /*$$,*/ $window, _, instance} from "../lib/adapter";

interface MultiDropdownProps {
	options: {[key: string]: string};
	checkedOptions: string[];
	checkedChanged: (selected: string[]) => void;
}

interface MultiDropdownState {
	checkedOptions: string[];
}

export class MultiDropdown extends React.Component<MultiDropdownProps, MultiDropdownState> {

	constructor(props) {
		super(props);
		this.state = {
			checkedOptions: props.checkedOptions,
		};
	}

	private dropdown: any;

	public componentDidMount() {
		// $$(this.dropdown).multiselect({
		// 	minWidth: 250,
		// 	header: false,
		// 	classes: "ui-selectmenu-button",
		// 	noneSelectedText: _("select devices"),
		// 	selectedText: _("# devices selected"),
		// 	click: this.optionClicked,
		// 	close: this.dropdownClosed,
		// });
		this.updateChecked();
	}

	public componentDidUpdate() {
		this.updateChecked();
	}

	private updateChecked() {
		const $dropdown = $(this.dropdown);
		$dropdown.find("option:selected").prop("selected", false);
		this.state.checkedOptions.forEach(val => {
			$dropdown.find(`option[value=${val}]`).prop("selected", true);
		});
		// $dropdown.multiselect("refresh");
	}

	private optionClicked = (event, ui) => {
		const index = this.state.checkedOptions.indexOf(ui.value);
		const checked = [...this.state.checkedOptions];
		if (ui.checked) {
			if (index === -1) checked.push(ui.value);
		} else {
			if (index !== -1) checked.splice(index, 1);
		}
		this.setState({checkedOptions: checked});
	}

	private dropdownClosed = () => {
		this.props.checkedChanged(this.state.checkedOptions);
	}

	public render() {
		return (
			<select
				multiple={true}
				ref={(me) => this.dropdown = me}
			>
			{Object.keys(this.props.options).map(k => (
				<option key={k} value={k}>
					{this.props.options[k]}
				</option>
			))}
			</select>
		);
	}
}
