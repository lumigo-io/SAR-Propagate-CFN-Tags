const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");
const cloudFormation = require("./lib/cloudformation");
const { propagateTags } = require("./lib/propagate-tags");
const retry = require("async-retry");

module.exports.handler = async (event) => {
	log.debug("received event...", { event });
  
	const stackNames = await cloudFormation.listStacks();
	log.info("loaded stacks...", {
		count: stackNames.length
	});
  
	while (!_.isEmpty(stackNames)) {
		const stackName = stackNames.pop();        
		await retry(async () => propagateTags(stackName), {
			retries: 10,
			// always wait 1 min between retry to give the API bucket
			// a chance to refill
			minTimeout: 60000,
			maxTimeout: 60000,
			factor: 1,
			onRetry: (err) => {
				log.warn("retrying after error...", err);
			}
		});
		log.info("processed stack...", { stackName });
	}
};
