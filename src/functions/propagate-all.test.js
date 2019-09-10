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

beforeEach(() => {
	process.env.RETRY_MIN_TIMEOUT = "100";
	process.env.RETRY_MAX_TIMEOUT = "100";
});

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
		await handler();
    
		expect(mockListStacks).toBeCalled();
		expect(mockPropagateTags).toBeCalledTimes(3);
	});
  
	describe("error handling", () => {
		test("errors are retried", async () => {
			givenListStacksReturns(["stack1"]);
    
			givenPropagateTagsFailed();   // attempt
			givenPropagateTagsSucceeds(); // retry
      
			const handler = require("./propagate-all").handler;
			await handler();
      
			expect(mockListStacks).toBeCalled();
			expect(mockPropagateTags).toBeCalledTimes(2);
		});
    
		test("errors are swallowed after 5 retries", async () => {
			givenListStacksReturns(["stack1"]);
    
			givenPropagateTagsFailed();   // attempt 1
			givenPropagateTagsFailed();   // retry 1
			givenPropagateTagsFailed();   // retry 2
			givenPropagateTagsFailed();   // retry 3
			givenPropagateTagsFailed();   // retry 4
			givenPropagateTagsFailed();   // retry 5
      
			const handler = require("./propagate-all").handler;
			await handler();
      
			expect(mockListStacks).toBeCalled();
			expect(mockPropagateTags).toBeCalledTimes(6);
		});
	});
});

function givenListStacksReturns(stackNames) {
	mockListStacks.mockReturnValueOnce(stackNames);
}

function givenPropagateTagsSucceeds() {
	mockPropagateTags.mockResolvedValueOnce();
}

function givenPropagateTagsFailed() {
	mockPropagateTags.mockRejectedValueOnce(new Error("boom"));
}
