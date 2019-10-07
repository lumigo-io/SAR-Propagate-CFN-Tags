const AWS = require("aws-sdk");

const mockListRoleTags = jest.fn();
AWS.IAM.prototype.listRoleTags = mockListRoleTags;
const mockTagRole = jest.fn();
AWS.IAM.prototype.tagRole = mockTagRole;
const mockUntagRole = jest.fn();
AWS.IAM.prototype.untagRole = mockUntagRole;

console.log = jest.fn();

beforeEach(() => {
	mockTagRole.mockReturnValue({
		promise: () => Promise.resolve()
	});
  
	mockUntagRole.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockListRoleTags.mockReset();
	mockTagRole.mockReset();
	mockUntagRole.mockReset();
});

describe("iam-role", () => {
	const roleName = "test-dev-us-east-1-lambdaRole";
  
	describe("get-tags", () => {
		test("returns empty object when there are no tags", async () => {
			const IAM = require("./iam-role");
      
			givenListTagsReturns([]);
      
			const tags = await IAM.getTags(roleName);
			expect(mockListRoleTags).toBeCalled();
			expect(tags).toEqual({});
		});
    
		test("returns state machine tags as object", async () => {
			const IAM = require("./iam-role");
      
			givenListTagsReturns([{
				Key: "team",
				Value: "atlantis"
			}, {
				Key: "feature",
				Value: "content-item"
			}]);
      
			const tags = await IAM.getTags(roleName);
			expect(mockListRoleTags).toBeCalled();
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
			Key: "team",
			Value: "atlantis"
		}, {
			Key: "feature",
			Value: "content-item"
		}];
    
		describe("when there is no existing tags", () => {
			test("untagResource is not called", async () => {
				const IAM = require("./iam-role");
      
				await IAM.replaceTags(roleName, {}, stackTags);
				expect(mockUntagRole).not.toBeCalled();
				expect(mockTagRole).toBeCalledWith({
					RoleName: roleName,
					Tags: stackTagsKV
				});
			});
		});
    
		describe("when some existing tags are removed", () => {
			test("old tags are removed", async () => {
				const IAM = require("./iam-role");
      
				const oldTags = {
					sprint: "ultron"
				};
				await IAM.replaceTags(roleName, oldTags, stackTags);
				expect(mockUntagRole).toBeCalledWith({
					RoleName: roleName,
					TagKeys: ["sprint"]
				});
				expect(mockTagRole).toBeCalledWith({
					RoleName: roleName,
					Tags: stackTagsKV
				});
			});
		});
    
		describe("when some existing tags are updated", () => {
			test("old tags are replaced with new values", async () => {
				const IAM = require("./iam-role");
      
				const oldTags = {
					team: "aquaman"
				};
				await IAM.replaceTags(roleName, oldTags, stackTags);
				expect(mockUntagRole).not.toBeCalled();
				expect(mockTagRole).toBeCalledWith({
					RoleName: roleName,
					Tags: stackTagsKV
				});
			});
		});
    
		describe("when existing tags matches new tags", () => {
			test("nothing is done", async () => {
				const IAM = require("./iam-role");
      
				await IAM.replaceTags(roleName, stackTags, stackTags);
				expect(mockUntagRole).not.toBeCalled();
				expect(mockTagRole).not.toBeCalled();
			});
		});
	});
});

function givenListTagsReturns(tags) {
	mockListRoleTags.mockReturnValueOnce({
		promise: () => Promise.resolve({
			Tags: tags
		})
	});
}
