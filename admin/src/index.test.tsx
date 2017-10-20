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

describe("tsx dummy test", () => {

	it("renders without crashing", () => {
		expect(shallow(<div/>)).to.have.length(1);
	});

});
