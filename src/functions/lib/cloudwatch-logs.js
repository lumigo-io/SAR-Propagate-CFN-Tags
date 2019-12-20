process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const cloudWatchLogs = new AWS.CloudWatchLogs();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::Logs::LogGroup";

const upsertTags = async (logGroupName, toUpsert) => {
	const tagNames = Object.keys(toUpsert);
	if (tagNames.length > 0) {
		log.info("upserting tags...", {
			logGroupName,
			count: tagNames.length,
			tags: tagNames.join(",")
		});
		await cloudWatchLogs
			.tagLogGroup({ logGroupName, tags: toUpsert })
			.promise();
	}
};

module.exports = {
	resourceType,
	upsertTags
};
