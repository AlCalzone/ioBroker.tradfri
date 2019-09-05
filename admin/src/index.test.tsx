// React component test
import * as React from "react";

// Setup Enzyme adapter
import {configure, shallow} from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
configure({ adapter: new (Adapter as any)() });

import { expect } from "chai";
// import * as sinon from "sinon";

describe("tsx dummy test", () => {

	it("renders without crashing", () => {
		expect(shallow(<div/>)).to.have.length(1);
	});

});
