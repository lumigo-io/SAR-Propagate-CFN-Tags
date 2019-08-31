const _ = require("lodash");
const cloudFormation = require("./cloudformation");
const cloudWatchLogs = require("./cloudwatch-logs");
const log = require("@dazn/lambda-powertools-logger");

const propagateTags = async (stackName) => {
	const { stackId, tags, resources } = await cloudFormation.describeStack(stackName);
  
	if (!stackId) {
		log.warn("stack is not found, skipped...", { stackName });
		return;
	}

	log.debug("found stack...", {
		stackName,
		tags,
		resouceCount: resources.length
	});
  
	if (_.isEmpty(tags)) {
		log.info("stack has no tags, skipped...");
		return;
	}
  
	const logGroupNames = resources
		.filter(x => x.resourceType === "AWS::Logs::LogGroup")
		.map(x => x.physicalResourceId);
    
	if (_.isEmpty(logGroupNames)) {
		log.info("no log groups, skipped...");
		return;
	}

	log.debug("found log groups...", { count: logGroupNames.length });  
	for (const logGroupName of logGroupNames) {
		const groupTags = await cloudWatchLogs.getTags(logGroupName);
		log.debug("found log group tags...", { logGroupName, tags: groupTags });
    
		await cloudWatchLogs.replaceTags(logGroupName, groupTags, tags);
		log.debug("replaced log group tags...", { logGroupName });
	}
};

module.exports = {
	propagateTags
};
