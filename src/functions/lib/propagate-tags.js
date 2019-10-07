const _ = require("lodash");
const cloudFormation = require("./cloudformation");
const log = require("@dazn/lambda-powertools-logger");

const Resources = [
	require("./cloudwatch-logs"),
	require("./step-functions"),
	require("./iam-role")
];

const replaceTags = async (stackName, tags, physicalId, Resource) => {
	try {
		const oldTags = await Resource.getTags(physicalId);
		log.debug("found resource tags...", { 
			stackName, 
			resourceType: Resource.resourceType,
			physicalId, 
			tags: oldTags 
		});
      
		await Resource.replaceTags(physicalId, oldTags, tags);
		log.debug("replaced resource tags...", { 
			stackName,
			resourceType: Resource.resourceType,
			physicalId,
			tags
		});
	} catch (error) {
		if (error.name === "ResourceNotFoundException") {
			log.warn("resource does not exist, skipped...", { 
				stackName,
				resourceType: Resource.resourceType,
				physicalId
			});
		} else {
			log.error("failed to replace resource tags", { 
				stackName,
				resourceType: Resource.resourceType,
				physicalId
			}, error);
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
  
	for (const Resource of Resources) {
		const physicalIds = resources
			.filter(x => x.resourceType === Resource.resourceType)
			.map(x => x.physicalResourceId);
      
		if (_.isEmpty(physicalIds)) {
			log.info("no matching resources, skipped...", { 
				stackName, 
				resourceType: Resource.resourceType 
			});
			continue;
		}
    
		log.debug("found matching resources...", { 
			stackName, 
			resourceType: Resource.resourceType,
			count: physicalIds.length 
		});
		for (const physicalId of physicalIds) {
			await replaceTags(stackName, tags, physicalId, Resource);
		}
	}
};

module.exports = {
	propagateTags
};
