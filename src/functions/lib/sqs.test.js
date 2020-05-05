const AWS = require("aws-sdk");

const mockTagResource = jest.fn();
AWS.SQS.prototype.tagQueue = mockTagResource;

console.log = jest.fn();

beforeEach(() => {
	mockTagResource.mockReturnValue({
		promise: () => Promise.resolve()
	});
});

afterEach(() => {
	mockTagResource.mockReset();
});

describe("sqs queue", () => {
	const queueUrl = "https://sqs.eu-central-1.amazonaws.com/123456789/my-fancy-queue";

	describe("upsert-tags", () => {
		const stackTags = {
			team: "atlantis",
			feature: "content-item"
		};
		const stackTagsKV = [{
			key: "team",
			value: "atlantis"
		}, {
			key: "feature",
			value: "content-item"
		}];

		test("tagResource is called with new tags", async () => {
			const SQSqueues = require("./sqs");

			await SQSqueues.upsertTags(queueUrl, stackTags);
			expect(mockTagResource).toBeCalledWith({
				QueueUrl: queueUrl,
				Tags: stackTagsKV
			});
		});
	});
});
