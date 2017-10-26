// Renders some components in jQuery UI tabs
import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

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
		this.doJQueryStuff();
	}

	public componentDidUpdate() {
		this.doJQueryStuff();
	}

	private doJQueryStuff() {
		$$(this.dropdown).multiselect({
			minWidth: 250,
			classes: "ui-selectmenu-button",
			click: this.optionClicked,
			close: this.dropdownClosed,
		});
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
				<option key={k}
					value={k}
					selected={this.state.checkedOptions.indexOf(k) > -1}
				>
					{this.props.options[k]}
				</option>
			))}
			</select>
		);
	}
}
// $('#assAssNodes').multiselect({
// 	header: false,
// 	minWidth: 250,
// 	noneSelectedText: '<span class="ui-selectmenu-text">select nodes</span>',
// 	selectedText: '<span class="ui-selectmenu-text"># nodes selected</span>',
// 	classes: 'ui-selectmenu-button',
// 	click: function(event, ui){
// 		if (ui.checked) {
// 		}
// 	}
// })
