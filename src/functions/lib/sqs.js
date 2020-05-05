process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const SQS = new AWS.SQS();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::SQS::Queue";

const upsertTags = async (QueueUrl, Tags) => {
	const tagNames = Object.keys(Tags);
	if (tagNames.length > 0) {
		log.info("upserting tags...", {
			QueueUrl,
			count: tagNames.length,
			tags: tagNames.join(",")
		});

		await SQS
			.tagQueue({ QueueUrl, Tags })
			.promise();
	}
};

module.exports = {
	resourceType,
	upsertTags
};
