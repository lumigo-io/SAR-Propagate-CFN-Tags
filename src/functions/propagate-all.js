const log = require("@dazn/lambda-powertools-logger");
const cloudFormation = require("./lib/cloudformation");
const { propagateTags } = require("./lib/propagate-tags");
const retry = require("async-retry");

const retries = parseFloat(process.env.RETRIES || "5");
const minTimeout = parseFloat(process.env.RETRY_MIN_TIMEOUT || "5000");
const maxTimeout = parseFloat(process.env.RETRY_MAX_TIMEOUT || "60000");

module.exports.handler = async (event) => {
	log.debug("received event...", { event });
  
	const stackNames = await cloudFormation.listStacks();
	log.info("loaded stacks...", {
		count: stackNames.length
	});
  
	for (const stackName of stackNames) {
		try {
			await retry(async () => propagateTags(stackName), {
				retries,
				minTimeout,
				maxTimeout,
				factor: 2,
				onRetry: (err) => {
					log.warn("retrying after error...", err);
				}
			});
			log.info("processed stack...", { stackName });
		} catch (error) {
			log.error("failed to process stack, skipped...", { stackName }, error);
		}
	}
};
