process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const AWS = require("aws-sdk");
const StepFunctions = new AWS.StepFunctions();
const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");

const resourceType = "AWS::StepFunctions::StateMachine";

const getTags = async (arn) => {
	const resp = await StepFunctions
		.listTagsForResource({ resourceArn: arn })
		.promise();
	const pairs = resp.tags.map(({ key, value }) => [key, value]);
	return _.fromPairs(pairs);
};

const replaceTags = async (arn, oldTags, newTags) => {
	// don't try to delete system tags, like aws:cloudformation:stack-id
	const toRemove = Object.keys(oldTags)
		.filter(x => !x.includes(":") && !newTags[x]);
	if (toRemove.length > 0) {
		log.info("removing tags...", {
			arn,
			count: toRemove.length,
			tags: toRemove.join(",")
		});
		await StepFunctions
			.untagResource({ resourceArn: arn, tagKeys: toRemove })
			.promise();
	}
  
	const toUpsert = Object.keys(newTags).filter(key => oldTags[key] !== newTags[key]);
	if (toUpsert.length > 0) {
		log.info("upserting tags...", {
			arn,
			count: toUpsert.length,
			tags: toUpsert.join(",")
		});
		await StepFunctions
			.tagResource({ resourceArn: arn, tags: newTags })
			.promise();
	}
};

module.exports = {
	resourceType,
	getTags,
	replaceTags
};
