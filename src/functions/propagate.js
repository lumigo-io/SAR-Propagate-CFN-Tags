const _ = require("lodash");
const log = require("@dazn/lambda-powertools-logger");
const { propagateTags } = require("./lib/propagate-tags");

module.exports.handler = async (event) => {
	log.debug("received event...", event);
  
	const stackName = _.get(event, "detail.requestParameters.stackName");
	await propagateTags(stackName);
};
