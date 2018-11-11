import * as React from "react";
import * as ReactDOM from "react-dom";

import { $window, _, instance } from "../lib/adapter";

export type OnSettingsChangedCallback = (newSettings: Record<string, any>) => void;

interface SettingsProps {
	onChange: OnSettingsChangedCallback;
	settings: Record<string, any>;
}

interface LabelProps {
	for: string;
	text: string;
	class?: string[];
	tooltip?: string;
}

/** Helper component for a settings label */
function Label(props: LabelProps) {
	const classNames =
		(props.class as string[] || [])
		;
	return (
		<label htmlFor={props.for} className={classNames.join(" ")}>
			{_(props.text)}
			{props.tooltip != null && <Tooltip text={props.tooltip} />}
		</label>
	);
}

interface CheckboxLabelProps {
	text: string;
	class?: string[];
	tooltip?: string;
}

/** Inner label for a Materializes CSS checkbox (span, no for property) */
function CheckboxLabel(props: CheckboxLabelProps) {
	const classNames =
		(props.class as string[] || [])
		;
	return (
		<span className={classNames.join(" ")}>
			{_(props.text)}
			{props.tooltip != null && <Tooltip text={props.tooltip} />}
		</span>
	);
}

/** Helper component for a tooltip */
function Tooltip(props) {
	return <img className="admin-tooltip-icon" src="../../img/info.png" title={_(props.text)} />;
}

export class Settings extends React.Component<SettingsProps, Record<string, any>> {

	constructor(props: SettingsProps) {
		super(props);
		// settings are our state
		this.state = {
			...props.settings,
		};
		// remember the original settings
		this.originalSettings = { ...props.settings };

		// setup change handlers
		this.handleChange = this.handleChange.bind(this);
	}

	private onChange: OnSettingsChangedCallback;
	private originalSettings: Record<string, any>;

	private chkPreserveTransitionTime: HTMLInputElement;

	private parseChangedSetting(target: HTMLInputElement | HTMLSelectElement): number | string | string[] | boolean {
		// Checkboxes in MaterializeCSS are messed up, so we attach our own handler
		// However that one gets called before the underlying checkbox is actually updated,
		// so we need to invert the checked value here
		return target.type === "checkbox" ? !(target as any).checked
			: target.type === "number" ? parseInt(target.value, 10)
			: target.value
		;
	}

	// gets called when the form elements are changed by the user
	private handleChange(event: React.FormEvent<HTMLElement>) {
		const target = event.target as (HTMLInputElement | HTMLSelectElement); // TODO: more types
		const value = this.parseChangedSetting(target);

		// store the setting
		this.putSetting(target.id, value, () => {
			// and notify the admin UI about changes
			this.props.onChange(this.state);
		});

		return false;
	}

	/**
	 * Reads a setting from the state object and transforms the value into the correct format
	 * @param key The setting key to lookup
	 */
	private getSetting<T = string | number | string[] | boolean>(key: string, defaultValue?: T): T {
		const ret = this.state[key] as T | undefined;
		return ret != undefined ? ret : defaultValue;
	}
	/**
	 * Saves a setting in the state object and transforms the value into the correct format
	 * @param key The setting key to store at
	 */
	private putSetting(key: string, value: string | number | string[] | boolean, callback?: () => void): void {
		this.setState({ [key]: value as any }, callback);
	}

	public componentWillUnmount() {
		if (this.chkPreserveTransitionTime != null) {
			$(this.chkPreserveTransitionTime).off("click", this.handleChange as any);
		}
	}

	public componentDidMount() {
		// update floating labels in materialize design
		M.updateTextFields();
		// Fix materialize checkboxes
		if (this.chkPreserveTransitionTime != null) {
			$(this.chkPreserveTransitionTime).on("click", this.handleChange as any);
		}
	}

	public render() {
		return (
			<>
				<div className="row">
					<div className="col s4 input-field">
						<input type="text" className="value" id="host" value={this.getSetting("host")} onChange={this.handleChange} />
						<Label for="host" text="Gateway IP/Hostname:" tooltip="hostname tooltip" />
					</div>
					<div className="col s4 input-field">
						<input type="text" className="value" id="securityCode" value={this.getSetting("securityCode")} onChange={this.handleChange} />
						<Label for="securityCode" text="Security-Code:" tooltip="security code tooltip" />
						<span>{_("code not stored")}</span>
					</div>
				</div>
				<div className="row">
					<div className="col s4">
						<label htmlFor="preserveTransitionTime">
							<input type="checkbox" className="value" id="preserveTransitionTime" defaultChecked={this.getSetting("preserveTransitionTime")}
								ref={me => this.chkPreserveTransitionTime = me}
							/>
							<CheckboxLabel text="Preserve transition time" tooltip="transition time tooltip" />
						</label>
					</div>
					<div className="col s4 input-field">
						<input type="number" min="0" max="2" className="value" id="roundToDigits" value={this.getSetting("roundToDigits") || 2} onChange={this.handleChange} />
						<Label for="roundToDigits" text="Decimal places:" tooltip="roundto tooltip" />
					</div>
				</div>
			</>
		);
	}

	public oldrender() {
		return (
			<p key="content" className="settings-table">

				<Label for="securityCode" text="Security-Code:" />
				<Tooltip text="security code tooltip" />
				<input className="value" id="securityCode" value={this.getSetting("securityCode")} onChange={this.handleChange} />
				<span>{_("code not stored")}</span><br />

				<Label for="preserveTransitionTime" text="Preserve transition time:" />
				<Tooltip text="transition time tooltip" />
				<input type="checkbox" className="value" id="preserveTransitionTime" defaultChecked={this.getSetting("preserveTransitionTime")} onChange={this.handleChange} /><br />

				<Label for="roundToDigits" text="Decimal places:" />
				<Tooltip text="roundto tooltip" />
				<input type="number" min="0" max="2" className="value" id="roundToDigits" value={this.getSetting("roundToDigits", 2)} onChange={this.handleChange}  />
			</p >
		);
	}
}
