process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const SQS = new AWS.SQS();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::SQS::Queue";

const upsertTags = async (QueueUrl, toUpsert) => {
	const tagNames = Object.keys(toUpsert);
	if (tagNames.length > 0) {
		log.info("upserting tags...", {
			QueueUrl,
			count: tagNames.length,
			tags: tagNames.join(",")
		});

		const Tags = tagNames.map(key => ({
			key: key,
			value: toUpsert[key]
		}));
		await SQS
			.tagQueue({ QueueUrl, Tags })
			.promise();
	}
};

module.exports = {
	resourceType,
	upsertTags
};
