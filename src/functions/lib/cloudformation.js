process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const _ = require("lodash");
const AWS = require("aws-sdk");
const cloudFormation = new AWS.CloudFormation();

const listStacks = async () => {
	const loop = async (nextToken, acc = []) => {
		const resp = await cloudFormation.listStacks({
			NextToken: nextToken,
			StackStatusFilter: [
				"CREATE_COMPLETE", 
				"ROLLBACK_COMPLETE", 
				"UPDATE_COMPLETE", 
				"UPDATE_ROLLBACK_COMPLETE"
			]
		}).promise();
    
		const newAcc = acc.concat(resp.StackSummaries.map(x => x.StackName));
    
		if (resp.NextToken) {
			return await loop(resp.NextToken, newAcc);
		} else {
			return newAcc;
		}
	};

	return loop();
};

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
	describeStack,
	listStacks
};
