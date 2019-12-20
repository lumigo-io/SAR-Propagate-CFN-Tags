const AWS = require("aws-sdk");

const mockTagResource = jest.fn();
AWS.StepFunctions.prototype.tagResource = mockTagResource;

console.log = jest.fn();

beforeEach(() => {
	mockTagResource.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockTagResource.mockReset();
});

describe("step-functions", () => {
	const arn = "arn:aws:states:us-east-1:1234567:stateMachine:FooBar";
  
	describe("upsert-tags", () => {
		const stackTags = {
			team: "atlantis",
			feature: "content-item"
		};
		const stackTagsKV = [{
			key: "team",
			value: "atlantis"
		}, {
			key: "feature",
			value: "content-item"
		}];
    
		test("tagResource is called with new tags", async () => {
			const StepFunctions = require("./step-functions");
      
			await StepFunctions.upsertTags(arn, stackTags);
			expect(mockTagResource).toBeCalledWith({
				resourceArn: arn,
				tags: stackTagsKV
			});
		});
	});
});
