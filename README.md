# SAR-Propagate-CloudFormation-Tags

[![Version](https://img.shields.io/badge/semver-1.9.0-blue)](template.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![CircleCI](https://circleci.com/gh/lumigo-io/SAR-Propagate-CFN-Tags.svg?style=svg)](https://circleci.com/gh/lumigo-io/SAR-Propagate-CFN-Tags)
[![codecov](https://codecov.io/gh/lumigo-io/SAR-Propagate-CFN-Tags/branch/master/graph/badge.svg)](https://codecov.io/gh/lumigo-io/SAR-Propagate-CFN-Tags)

SAR app to propagate CloudFormation's stack tags to resources that are currently not propagated automatically - e.g. CloudWatch Logs. It also propagates stack tag updates to resources whose tags are not automatically updated - e.g. Step Functions, SQS and IAM roles.

## Deploying to your account (via the console)

Go to this [page](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:374852340823:applications~propagate-cfn-tags) and click the `Deploy` button.

This app would deploy the following resources to your region:

* a `Propagate` Lambda function that propagates CloudFormation's tags to resources that aren't tagged automatically
* a CloudWatch event pattern that triggers the `Propagate` function whenever `CloudFormation:CreateStack` and `CloudFormation:UpdateStack` events are captured by CloudTrail
* a `PropagateAll` Lambda function that iterates through all CloudFormation stacks in the region and propates their tags, this function is only triggered once, when you deploy the SAR app
* a `Custom::LambdaInvocation` CloudFormation custom resource, which would trigger the `PropagateAll` Lambda function during the deployment of this SAR app

## Deploying via SAM/Serverless framework/CloudFormation

To deploy this app via SAM, you need something like this in the CloudFormation template:

```yml
PropagateCloudFormationTags:
  Type: AWS::Serverless::Application
  Properties:
    Location:
      ApplicationId: arn:aws:serverlessrepo:us-east-1:374852340823:applications/propagate-cfn-tags
      SemanticVersion: <enter latest version>
```

To do the same via CloudFormation or the Serverless framework, you need to first add the following `Transform`:

```yml
Transform: AWS::Serverless-2016-10-31
```

For more details, read this [post](https://theburningmonk.com/2019/05/how-to-include-serverless-repository-apps-in-serverless-yml/).
