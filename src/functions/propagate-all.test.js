const cloudFormation = require("./lib/cloudformation");
const propagateTags = require("./lib/propagate-tags");

// listStacks is tested by lib/cloudformation.test.js module already
// so no need to test it here as well
const mockListStacks = jest.fn();
cloudFormation.listStacks = mockListStacks;

// propagateTags is tested by the propagate.test.js module already
// so no need to test it here as well
const mockPropagateTags = jest.fn();
propagateTags.propagateTags = mockPropagateTags;

console.log = jest.fn();

afterEach(() => {
	mockListStacks.mockClear();
	mockPropagateTags.mockClear();
});

describe("propagate-all", () => {
	test("processes all stacks returned by listStacks", async () => {
		givenListStacksReturns(["stack1", "stack2", "stack3"]);
    
		givenPropagateTagsSucceeds(); // stack1
		givenPropagateTagsSucceeds(); // stack2
		givenPropagateTagsSucceeds(); // stack3
    
		const handler = require("./propagate-all").handler;
		await handler({}, { getRemainingTimeInMillis: () => 900000 });
    
		expect(mockListStacks).toBeCalled();
		expect(mockPropagateTags).toBeCalledTimes(3);
	});
});

function givenListStacksReturns(stackNames) {
	mockListStacks.mockReturnValueOnce(stackNames);
}

function givenPropagateTagsSucceeds() {
	mockPropagateTags.mockResolvedValueOnce();
}
