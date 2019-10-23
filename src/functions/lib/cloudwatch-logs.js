process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const cloudWatchLogs = new AWS.CloudWatchLogs();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::Logs::LogGroup";

const getTags = async (logGroupName) => {
	const resp = await cloudWatchLogs
		.listTagsLogGroup({ logGroupName })
		.promise();    
	return resp.tags;
};

const replaceTags = async (logGroupName, oldTags, newTags) => {
	const toRemove = Object.keys(oldTags)
		.filter(x => !x.includes(":") && !newTags[x]);
	if (toRemove.length > 0) {
		log.info("removing tags...", {
			logGroupName,
			count: toRemove.length,
			tags: toRemove.join(",")
		});
		await cloudWatchLogs
			.untagLogGroup({ logGroupName, tags: toRemove })
			.promise();
	}
  
	const toUpsert = Object.keys(newTags).filter(key => oldTags[key] !== newTags[key]);
	if (toUpsert.length > 0) {
		log.info("upserting tags...", {
			logGroupName,
			count: toUpsert.length,
			tags: toUpsert.join(",")
		});
		await cloudWatchLogs
			.tagLogGroup({ logGroupName, tags: newTags })
			.promise();
	}
};

module.exports = {
	resourceType,
	getTags,
	replaceTags
};
