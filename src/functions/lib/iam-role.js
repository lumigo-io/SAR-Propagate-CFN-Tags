process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const IAM = new AWS.IAM();
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::IAM::Role";

const upsertTags = async (roleName, toUpsert) => {
	const tagNames = Object.keys(toUpsert);
	if (tagNames.length > 0) {
		log.info("upserting tags...", {
			roleName,
			count: tagNames.length,
			tags: tagNames.join(",")
		});
		const tags = tagNames.map(key => ({
			Key: key,
			Value: toUpsert[key]
		}));
		await IAM
			.tagRole({ RoleName: roleName, Tags: tags })
			.promise();
	}
};

module.exports = {
	resourceType,
	upsertTags
};
