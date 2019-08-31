const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");
const cloudFormation = require("./lib/cloudformation");
const { propagateTags } = require("./lib/propagate-tags");

module.exports.handler = async (event) => {
	log.debug("received event...", { event });
  
	const stackNames = await cloudFormation.listStacks();
	log.info("loaded stacks...", {
		count: stackNames.length
	});
  
	while (!_.isEmpty(stackNames)) {
		const stackName = stackNames.pop();
		await propagateTags(stackName);
		log.info("processed stack...", { stackName });
	}
};
