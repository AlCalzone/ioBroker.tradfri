import * as React from "react";
import * as ReactDOM from "react-dom";

import Fragment from "./fragment";

const $window = window as any;

/** Translates text */
const _ = $window._ as (text: string) => string;

export class Groups extends React.Component<any, any> {

	constructor(props) {
		super(props);
	}

	public render() {
		return (
			<div>Placeholder for group management functions</div>
		);
	}

}
