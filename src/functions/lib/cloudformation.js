const _ = require("lodash");
const AWS = require("./aws");
const cloudFormation = new AWS.CloudFormation();

const describeStack = async (stackName) => {
	const resp = await cloudFormation.describeStacks({
		StackName: stackName
	}).promise();
  
	if (_.isEmpty(resp.Stacks)) {
		return { 
			stackId: null, 
			tags: {}, 
			resources: [] 
		};
	}

	const stack = resp.Stacks[0];
	const tags = _.zipObject(
		_.map(stack.Tags, "Key"),
		_.map(stack.Tags, "Value")
	);
	const resources = await getResources(stackName);

	return {
		stackId: stack.StackId,
		tags,
		resources
	};
};

const getResources = async (stackName) => {
	const resp = await cloudFormation.describeStackResources({
		StackName: stackName    
	}).promise();
  
	return resp.StackResources.map(x => ({
		resourceType: x.ResourceType,
		physicalResourceId: x.PhysicalResourceId
	}));
};

module.exports = {
	describeStack
};
