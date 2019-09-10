const _ = require("lodash");
const cloudFormation = require("./cloudformation");
const cloudWatchLogs = require("./cloudwatch-logs");
const log = require("@dazn/lambda-powertools-logger");

const replaceTags = async (stackName, tags, logGroupName) => {
	try {
		const groupTags = await cloudWatchLogs.getTags(logGroupName);
		log.debug("found log group tags...", { stackName, logGroupName, tags: groupTags });
      
		await cloudWatchLogs.replaceTags(logGroupName, groupTags, tags);
		log.debug("replaced log group tags...", { stackName, logGroupName });
	} catch (error) {
		if (error.name === "ResourceNotFoundException") {
			log.warn("log group does not exist, skipped...", { logGroupName });
		} else {
			log.error("failed to replace log group tags", { logGroupName }, error);
			throw error;
		}
	}
};

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
		log.info("stack has no tags, skipped...", { stackName });
		return;
	}
  
	const logGroupNames = resources
		.filter(x => x.resourceType === "AWS::Logs::LogGroup")
		.map(x => x.physicalResourceId);
    
	if (_.isEmpty(logGroupNames)) {
		log.info("no log groups, skipped...", { stackName });
		return;
	}

	log.debug("found log groups...", { stackName, count: logGroupNames.length });  
	for (const logGroupName of logGroupNames) {
		await replaceTags(stackName, tags, logGroupName);
	}
};

module.exports = {
	propagateTags
};
