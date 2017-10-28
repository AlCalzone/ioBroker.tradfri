import * as React from "react";
import * as ReactDOM from "react-dom";

import {$$, $window, _, instance} from "../lib/adapter";

interface EditableLabelState {
	editMode: boolean;
	text: string;
}
interface EditableLabelProps {
	text: string;
	maxLength?: number;
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

	private txtEdit: HTMLInputElement;

	private readonly beginEdit = () => {
		this.setState({editMode: true});
		this.selectPending = true;
	}
	private readonly onEdit = () => {
		this.setState({
			text: this.txtEdit.value,
		});
	}
	private readonly endEdit = (save: boolean = true) => {
		this.setState({
			editMode: false,
		});
		this.selectPending = false;
		if (save) {
			this.props.textChanged(this.state.text);
		} else {
			this.setState({text: this.props.text});
		}
	}

	private readonly keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.keyCode === 13 /* Enter */) {
			this.endEdit();
		} else if (e.keyCode === 27 /* Escape */) {
			this.endEdit(false);
		}
	}

	private selectPending: boolean = false;

	public render() {
		if (this.state.editMode) {
			return (
				<input
					type="text"
					ref={(me) => {
						this.txtEdit = me;
						if (this.txtEdit != null && this.selectPending) {
							this.txtEdit.select();
							this.selectPending = false;
						}
					}}
					onBlur={() => this.endEdit()}
					onKeyDown={this.keyDown}
					onChange={this.onEdit}
					value={this.state.text}
					maxLength={this.props.maxLength || 200}
					autoFocus
				/>
			);
		} else {
			return (
				<span onClick={this.beginEdit}>{this.state.text}</span>
			);
		}
	}

}
