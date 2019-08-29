const AWS = require("./lib/aws");

const mockDescribeStacks = jest.fn();
AWS.CloudFormation.prototype.describeStacks = mockDescribeStacks;
const mockDescribeStackResources = jest.fn();
AWS.CloudFormation.prototype.describeStackResources = mockDescribeStackResources;
const mockListTagsLogGroup = jest.fn();
AWS.CloudWatchLogs.prototype.listTagsLogGroup = mockListTagsLogGroup;
const mockUntagLogGroup = jest.fn();
AWS.CloudWatchLogs.prototype.untagLogGroup = mockUntagLogGroup;
const mockTagLogGroup = jest.fn();
AWS.CloudWatchLogs.prototype.tagLogGroup = mockTagLogGroup;

console.log = jest.fn();

beforeEach(() => {
	mockTagLogGroup.mockReturnValue({
		promise: () => Promise.resolve()
	});
  
	mockUntagLogGroup.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockDescribeStacks.mockClear();
	mockDescribeStackResources.mockClear();
	mockListTagsLogGroup.mockClear();
	mockUntagLogGroup.mockClear();
	mockTagLogGroup.mockClear();
});

const givenStackHasTags = (tags) => {
	const stackTags = Object.keys(tags).map(key => ({
		Key: key,
		Value: tags[key]
	}));

	mockDescribeStacks.mockReturnValue({
		promise: () => Promise.resolve({
			Stacks: [{
				StackId: "test",
				Tags: stackTags
			}]
		})
	});
};

const givenStackIsNotFound = () => {
	mockDescribeStacks.mockReturnValue({
		promise: () => Promise.resolve({
			Stacks: []
		})
	});
};

const givenStackHasResources = (resources) => {
	const stackResources = resources.map(x => ({
		ResourceType: x.resourceType,
		PhysicalResourceId: x.physicalResourceId
	}));
	mockDescribeStackResources.mockReturnValue({
		promise: () => Promise.resolve({
			StackResources: stackResources
		})
	});
};

const givenLogGroupHasTags = (tags) => {
	mockListTagsLogGroup.mockReturnValue({
		promise: () => Promise.resolve({ tags })
	});
};

describe("propagate handler", () => {
	const getEvent = (eventName = "CreateStack", stackName = "test") => ({
		detail: {
			eventName,
			requestParameters: {
				stackName
			}
		}
	});
  
	test("nothing is done if stack is not found", async () => {
		givenStackIsNotFound();
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockDescribeStackResources).not.toBeCalled();
		expect(mockListTagsLogGroup).not.toBeCalled();
		expect(mockTagLogGroup).not.toBeCalled();
		expect(mockUntagLogGroup).not.toBeCalled();
	});
  
	test("nothing is done if stack has no tags", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({});
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).not.toBeCalled();
		expect(mockTagLogGroup).not.toBeCalled();
		expect(mockUntagLogGroup).not.toBeCalled();
	});
  
	test("nothing is done if stack has no log groups", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Lambda::Function",
			physicalResourceId: "hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).not.toBeCalled();
		expect(mockTagLogGroup).not.toBeCalled();
		expect(mockUntagLogGroup).not.toBeCalled();
	});
  
	test("all stack tags are added to log group", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
		givenLogGroupHasTags({});

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).toBeCalled();
		expect(mockTagLogGroup).toBeCalledWith({
			logGroupName: "/aws/lambda/hello-world-dev",
			tags: { Author: "theburningmonk" }
		});
		expect(mockUntagLogGroup).not.toBeCalled();
	});
  
	test("existing log group tags are updated to match stack tags", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
		givenLogGroupHasTags({ Author: "Yan Cui"});

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).toBeCalled();
		expect(mockTagLogGroup).toBeCalledWith({
			logGroupName: "/aws/lambda/hello-world-dev",
			tags: { Author: "theburningmonk" }
		});
		expect(mockUntagLogGroup).not.toBeCalled();
	});
  
	test("old log group tags are removed if they are no longer on the stack", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
		givenLogGroupHasTags({ Team: "lumigo" });

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).toBeCalled();
		expect(mockTagLogGroup).toBeCalledWith({
			logGroupName: "/aws/lambda/hello-world-dev",
			tags: { Author: "theburningmonk" }
		});
		expect(mockUntagLogGroup).toBeCalledWith({
			logGroupName: "/aws/lambda/hello-world-dev",
			tags: [ "Team" ]
		});
	});
  
	test("nothing is done if the log group already has exact tags to stack", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk", Team: "lumigo" });
		givenLogGroupHasTags({ Author: "theburningmonk", Team: "lumigo" });

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockListTagsLogGroup).toBeCalled();
		expect(mockTagLogGroup).not.toBeCalled();
		expect(mockUntagLogGroup).not.toBeCalled();
	});
});
