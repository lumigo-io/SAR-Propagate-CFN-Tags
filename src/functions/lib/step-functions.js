process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const StepFunctions = new AWS.StepFunctions();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::StepFunctions::StateMachine";

const upsertTags = async (arn, toUpsert) => {
	const tagNames = Object.keys(toUpsert);
	if (tagNames.length > 0) {
		log.info("upserting tags...", {
			arn,
			count: tagNames.length,
			tags: tagNames.join(",")
		});
    
		const tags = tagNames.map(key => ({
			key: key,
			value: toUpsert[key]
		}));
		await StepFunctions
			.tagResource({ resourceArn: arn, tags })
			.promise();
	}
};

module.exports = {
	resourceType,
	upsertTags
};
