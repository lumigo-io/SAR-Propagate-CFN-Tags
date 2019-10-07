const AWS = require("aws-sdk");

const mockListTagsForResource = jest.fn();
AWS.StepFunctions.prototype.listTagsForResource = mockListTagsForResource;
const mockTagResource = jest.fn();
AWS.StepFunctions.prototype.tagResource = mockTagResource;
const mockUntagResource = jest.fn();
AWS.StepFunctions.prototype.untagResource = mockUntagResource;

console.log = jest.fn();

beforeEach(() => {
	mockTagResource.mockReturnValue({
		promise: () => Promise.resolve()
	});
  
	mockUntagResource.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockListTagsForResource.mockReset();
	mockTagResource.mockReset();
	mockUntagResource.mockReset();
});

describe("step-functions", () => {
	const arn = "arn:aws:states:us-east-1:1234567:stateMachine:FooBar";
  
	describe("get-tags", () => {
		test("returns empty object when there are no tags", async () => {
			const StepFunctions = require("./step-functions");
      
			givenListTagsReturns([]);
      
			const tags = await StepFunctions.getTags(arn);
			expect(mockListTagsForResource).toBeCalled();
			expect(tags).toEqual({});
		});
    
		test("returns state machine tags as object", async () => {
			const StepFunctions = require("./step-functions");
      
			givenListTagsReturns([{
				key: "team",
				value: "atlantis"
			}, {
				key: "feature",
				value: "content-item"
			}]);
      
			const tags = await StepFunctions.getTags(arn);
			expect(mockListTagsForResource).toBeCalled();
			expect(tags).toHaveProperty("team");
			expect(tags.team).toEqual("atlantis");
			expect(tags).toHaveProperty("feature");
			expect(tags.feature).toEqual("content-item");
		});
	});
  
	describe("replace-tags", () => {
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
    
		describe("when there is no existing tags", () => {
			test("untagResource is not called", async () => {
				const StepFunctions = require("./step-functions");
      
				await StepFunctions.replaceTags(arn, {}, stackTags);
				expect(mockUntagResource).not.toBeCalled();
				expect(mockTagResource).toBeCalledWith({
					resourceArn: arn,
					tags: stackTagsKV
				});
			});
		});
    
		describe("when there are existing system tags", () => {
			test("they are not deleted", async () => {
				const StepFunctions = require("./step-functions");
      
				const oldTags = {
					"aws:cloudformation:stack-id": "my-stack"
				};
				await StepFunctions.replaceTags(arn, oldTags, stackTags);
				expect(mockUntagResource).not.toBeCalled();
				expect(mockTagResource).toBeCalledWith({
					resourceArn: arn,
					tags: stackTagsKV
				});
			});
		});
    
		describe("when some existing tags are removed", () => {
			test("old tags are removed", async () => {
				const StepFunctions = require("./step-functions");
      
				const oldTags = {
					sprint: "ultron"
				};
				await StepFunctions.replaceTags(arn, oldTags, stackTags);
				expect(mockUntagResource).toBeCalledWith({
					resourceArn: arn,
					tagKeys: ["sprint"]
				});
				expect(mockTagResource).toBeCalledWith({
					resourceArn: arn,
					tags: stackTagsKV
				});
			});
		});
    
		describe("when some existing tags are updated", () => {
			test("old tags are replaced with new values", async () => {
				const StepFunctions = require("./step-functions");
      
				const oldTags = {
					team: "aquaman"
				};
				await StepFunctions.replaceTags(arn, oldTags, stackTags);
				expect(mockUntagResource).not.toBeCalled();
				expect(mockTagResource).toBeCalledWith({
					resourceArn: arn,
					tags: stackTagsKV
				});
			});
		});
    
		describe("when existing tags matches new tags", () => {
			test("nothing is done", async () => {
				const StepFunctions = require("./step-functions");
      
				await StepFunctions.replaceTags(arn, stackTags, stackTags);
				expect(mockUntagResource).not.toBeCalled();
				expect(mockTagResource).not.toBeCalled();
			});
		});
	});
});

function givenListTagsReturns(tags) {
	mockListTagsForResource.mockReturnValueOnce({
		promise: () => Promise.resolve({
			tags
		})
	});
}
