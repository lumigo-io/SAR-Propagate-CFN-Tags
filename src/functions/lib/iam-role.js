process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const IAM = new AWS.IAM();
const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::IAM::Role";

const getTags = async (roleName) => {
	const resp = await IAM
		.listRoleTags({ RoleName: roleName })
		.promise();
	const pairs = resp.Tags.map(({ Key, Value }) => [Key, Value]);
	return _.fromPairs(pairs);
};

const replaceTags = async (roleName, oldTags, newTags) => {
	// don't try to delete system tags, like aws:cloudformation:stack-id
	const toRemove = Object.keys(oldTags)
		.filter(x => !x.includes(":") && !newTags[x]);
	if (toRemove.length > 0) {
		log.info("removing tags...", {
			roleName,
			count: toRemove.length,
			tags: toRemove.join(",")
		});
		await IAM
			.untagRole({ RoleName: roleName, TagKeys: toRemove })
			.promise();
	}
  
	const toUpsert = Object.keys(newTags).filter(key => oldTags[key] !== newTags[key]);
	if (toUpsert.length > 0) {
		log.info("upserting tags...", {
			roleName,
			count: toUpsert.length,
			tags: toUpsert.join(",")
		});
		const tags = Object.keys(newTags).map(key => ({
			Key: key,
			Value: newTags[key]
		}));
		await IAM
			.tagRole({ RoleName: roleName, Tags: tags })
			.promise();
	}
};

module.exports = {
	resourceType,
	getTags,
	replaceTags
};
