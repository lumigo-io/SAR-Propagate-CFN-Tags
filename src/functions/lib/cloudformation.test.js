const AWS = require("aws-sdk");

const mockListStacks = jest.fn();
AWS.CloudFormation.prototype.listStacks = mockListStacks;

const cloudFormation = require("./cloudformation");

console.log = jest.fn();

afterEach(() => {
	mockListStacks.mockClear();
});

describe("cloudformation", () => {
	test("listStacks returns all stack names from one page of results", async () => {
		const expected = ["stack1", "stack2", "stack3"];
		givenListStacksReturns(expected);
    
		const stackNames = await cloudFormation.listStacks();
		expect(mockListStacks).toBeCalledTimes(1);
		expect(stackNames).toEqual(expected);
	});
  
	test("listStacks returns all stack names from multiple pages of results", async () => {
		const page1 = ["stack1", "stack2", "stack3"];
		const page2 = ["stack4", "stack5", "stack6"];
		const page3 = ["stack7", "stack8", "stack9"];
		givenListStacksReturns(page1, true);
		givenListStacksReturns(page2, true);
		givenListStacksReturns(page3);
    
		const stackNames = await cloudFormation.listStacks();
		expect(mockListStacks).toBeCalledTimes(3);
		expect(stackNames).toEqual(page1.concat(page2, page3));
	});
});

function givenListStacksReturns(stackNames, hasMore = false) {
	mockListStacks.mockReturnValueOnce({
		promise: () => Promise.resolve({
			NextToken: hasMore === true ? "to be continue..." : undefined,
			StackSummaries: stackNames.map(x => ({
				StackName: x
			}))
		})
	});
}
