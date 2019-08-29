const _ = require("lodash");
const cloudFormation = require("./lib/cloudformation");
const cloudWatchLogs = require("./lib/cloudwatch-logs");
const log = require("@dazn/lambda-powertools-logger");

module.exports.handler = async (event) => {
	log.debug("received event...", event);
  
	const stackName = _.get(event, "detail.requestParameters.stackName");
	const { tags, resources } = await cloudFormation.describeStack(stackName);
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
