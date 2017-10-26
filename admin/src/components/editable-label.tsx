import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

interface EditableLabelState {
	editMode: boolean;
	text: string;
}
interface EditableLabelProps {
	text: string;
	textChanged: (newText: string) => void;
}

export class EditableLabel extends React.Component<EditableLabelProps, EditableLabelState> {

	constructor(props) {
		super(props);
		this.state = {
			editMode: false,
			text: props.text,
		};
	}

	private txtEdit: any;

	private readonly beginEdit = () => {
		this.setState({editMode: true});
	}
	private readonly endEdit = () => {
		this.setState({
			editMode: false,
			text: this.txtEdit.value,
		});
		this.props.textChanged(this.state.text);
	}

	private readonly keyPressed = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.keyCode === 13) {
			// Enter
			this.endEdit();
		}
	}

	public render() {
		if (this.state.editMode) {
			return (
				<input
					type="text"
					ref={(me) => this.txtEdit = me}
					onBlur={this.endEdit}
					onKeyPress={this.keyPressed}
					value={this.state.text}
				/>
			);
		} else {
			return (
				<span onClick={this.beginEdit}>{this.state.text}</span>
			);
		}
	}

}
