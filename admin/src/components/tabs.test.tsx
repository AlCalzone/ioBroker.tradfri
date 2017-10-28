// React component test
import * as React from "react";
import * as ReactDOM from "react-dom";

// Setup Enzyme adapter
import {configure, shallow} from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
configure({ adapter: new (Adapter as any)() });

// tslint:disable:no-unused-expression
import { assert, expect } from "chai";
import * as sinon from "sinon";

// import components
import { Tabs } from "./tabs";

describe("jQuery-UI tabs", () => {

	const definition = {
		"Tab 1": "Hallo",
		"Tab 2": <div id="test">Test</div>,
		"Tab 3": null,
	};
	const tabCount = Object.keys(definition).length;

	const tab = <Tabs labels={Object.keys(definition)}>{
		Object.keys(definition).map(k => definition[k])
	}</Tabs>;

	it(`renders the correct amount (${tabCount}) of headers`, () => {
		expect(shallow(tab).find("li")).to.have.length(tabCount);
	});
	it(`renders the correct amount (${tabCount}) of tab divs`, () => {
		expect(shallow(tab).find("div#tabs > div")).to.have.length(tabCount);
	});
	it(`renders the defined tabs`, () => {
		expect(shallow(tab).find("div#test")).to.have.length(1);
	});

});
