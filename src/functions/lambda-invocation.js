const AWS = require("./lib/aws");
const lambda = new AWS.Lambda();
const customResource = require("./lib/custom-resource");
const schema = require("./lambda-invocation.schema");

const invokeFunction = async ({ FunctionName, Payload }) => {
	await lambda.invoke({
		FunctionName,
		InvocationType: "RequestResponse",
		Payload: JSON.stringify(Payload)
	}).promise();
};

const onCreate = async (invocation) => {
	await invokeFunction(invocation);
};

const onUpdate = async (_physicalResourceId, invocation) => {
	await invokeFunction(invocation);
};

const onDelete = async (physicalResourceId) => physicalResourceId;

module.exports.handler = customResource(
	schema, onCreate, onUpdate, onDelete);
