const AWS = require("aws-sdk");

const mockDescribeStacks = jest.fn();
AWS.CloudFormation.prototype.describeStacks = mockDescribeStacks;
const mockDescribeStackResources = jest.fn();
AWS.CloudFormation.prototype.describeStackResources = mockDescribeStackResources;
const mockTagLogGroup = jest.fn();
AWS.CloudWatchLogs.prototype.tagLogGroup = mockTagLogGroup;

console.log = jest.fn();

beforeEach(() => {
	mockDescribeStacks.mockReset();
	mockDescribeStackResources.mockReset();
	mockTagLogGroup.mockReset();
});

describe("propagate handler", () => {
	const getEvent = (eventName = "CreateStack", stackName = "test") => ({
		detail: {
			eventName,
			requestParameters: {
				stackName
			}
		}
	});

	const getEventWithNoStackName = (eventName = "CreateStack") => ({
		detail: {
			eventName,
			requestParameters: {
			}
		}
	});
  
	test("nothing is done if stack is not found", async () => {
		givenStackIsNotFound();
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockDescribeStackResources).not.toBeCalled();
		expect(mockTagLogGroup).not.toBeCalled();
	});
  
	test("nothing is done if stack has no tags", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({});
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockTagLogGroup).not.toBeCalled();
	});
  
	test("nothing is done if stack has no log groups", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Lambda::Function",
			physicalResourceId: "hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
    
		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockTagLogGroup).not.toBeCalled();
	});
  
	test("all stack tags are added to log group", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk" });
		givenTagLogGroupSucceeds();

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockTagLogGroup).toBeCalledWith({
			logGroupName: "/aws/lambda/hello-world-dev",
			tags: { Author: "theburningmonk" }
		});
	});
  
	test("ResourceNotFound exceptions are swallowed", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk", Team: "lumigo" });
		givenLogGroupDoesNotExist();

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockTagLogGroup).toBeCalledTimes(1);
	});
  
	test("Other exceptions are also swallowed", async () => {
		givenStackHasResources([{
			resourceType: "AWS::Logs::LogGroup",
			physicalResourceId: "/aws/lambda/hello-world-dev"
		}]);
		givenStackHasTags({ Author: "theburningmonk", Team: "lumigo" });
		givenTagLogGroupFails("boom", "there goes another one!");

		const handler = require("./propagate").handler;
		await handler(getEvent());
    
		expect(mockTagLogGroup).toBeCalledTimes(1);
	});

	test("propagateTags is not called if stackName is not found in the event", async () => {
		jest.resetModules();
		const propagateTags = require("./lib/propagate-tags");
		const mockPropagateTags = jest.fn();
		propagateTags.propagateTags = mockPropagateTags;
		const handler = require("./propagate").handler;
		await handler(getEventWithNoStackName());

		expect(mockPropagateTags).not.toBeCalled();
	});

});

function givenStackHasTags(tags) {
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
}

function givenStackIsNotFound() {
	mockDescribeStacks.mockReturnValue({
		promise: () => Promise.resolve({
			Stacks: []
		})
	});
}

function givenStackHasResources(resources) {
	const stackResources = resources.map(x => ({
		ResourceType: x.resourceType,
		PhysicalResourceId: x.physicalResourceId
	}));
	mockDescribeStackResources.mockReturnValue({
		promise: () => Promise.resolve({
			StackResources: stackResources
		})
	});
}

function givenLogGroupDoesNotExist() {
	mockTagLogGroup.mockReturnValueOnce({
		promise: () => Promise.reject(
			new CloudWatchLogsError(
				"ResourceNotFoundException", 
				"The specified log group does not exist."))
	});
}

function givenTagLogGroupFails(name, message) {
	mockTagLogGroup.mockReturnValue({
		promise: () => Promise.reject(
			new CloudWatchLogsError(name, message))
	});
}

function givenTagLogGroupSucceeds() {
	mockTagLogGroup.mockReturnValue({
		promise: () => Promise.resolve()
	});
}

class CloudWatchLogsError extends Error {
	constructor (name, message) {
		super(message);
		this.name = name;
	}
}
