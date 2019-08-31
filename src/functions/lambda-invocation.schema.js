const Joi = require("@hapi/joi");

const ARN = Joi.string().regex(/arn:aws:lambda/g);

const LambdaInvocation = Joi.object().keys({
	FunctionName: ARN.required(),
	Payload: Joi.object()
});

module.exports = LambdaInvocation;
