const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");
const lambda = require("./lib/lambda");
const cloudFormation = require("./lib/cloudformation");
const { propagateTags } = require("./lib/propagate-tags");

const ONE_MINUTE = 60 * 1000;
let stackNames = [];

module.exports.handler = async (event, context) => {
	log.debug("received event...", event);
  
	if (!_.isEmpty(stackNames)) {
		log.info("continuing from last recursion...", { 
			remainingCount: stackNames.length
		});
	} else {
		stackNames = await cloudFormation.listStacks();
		log.info("loaded stacks...", {
			remainingCount: stackNames.length
		});
	}
  
	try {
		do {
			const stackName = stackNames.pop();
			await propagateTags(stackName);
			log.debug("processed stack...", { stackName });
		} while (!_.isEmpty(stackNames) && context.getRemainingTimeInMillis() > ONE_MINUTE);

		if (!_.isEmpty(stackNames)) {
			await lambda.recurse(event);
			return "to be continued...";
		} else {
			return "the end...";
		}
	} catch (err) {
		throw err;
	}  
};
