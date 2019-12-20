const AWS = require("aws-sdk");

const mockTagRole = jest.fn();
AWS.IAM.prototype.tagRole = mockTagRole;

console.log = jest.fn();

beforeEach(() => {
	mockTagRole.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockTagRole.mockReset();
});

describe("iam-role", () => {
	const roleName = "test-dev-us-east-1-lambdaRole";
  
	describe("upsert-tags", () => {
		const stackTags = {
			team: "atlantis",
			feature: "content-item"
		};
		const stackTagsKV = [{
			Key: "team",
			Value: "atlantis"
		}, {
			Key: "feature",
			Value: "content-item"
		}];
    
		test("tagRole is called with new tags", async () => {
			const IAM = require("./iam-role");
      
			await IAM.upsertTags(roleName, stackTags);
			expect(mockTagRole).toBeCalledWith({
				RoleName: roleName,
				Tags: stackTagsKV
			});
		});
	});
});
