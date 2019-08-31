const AWS = require("./aws");
const Lambda = new AWS.Lambda();
const log = require("@dazn/lambda-powertools-logger");

const recurse = async (payload) => {
	const req = {
		FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
		InvocationType: "Event",
		Payload: JSON.stringify(payload)
	};

	log.info("recursing...");
	await Lambda.invoke(req).promise();
};

module.exports = {
	recurse
};
