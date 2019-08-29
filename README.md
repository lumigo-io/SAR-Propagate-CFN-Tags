# SAR-Propagate-CloudFormation-Tags

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![CircleCI](https://circleci.com/gh/lumigo-io/SAR-Propagate-CFN-Tags.svg?style=svg)](https://circleci.com/gh/lumigo-io/SAR-Propagate-CFN-Tags)

SAR app to propagate CloudFormation's stack tags to resources that are currently not propagated automatically - e.g. CloudWatch Logs.

## Deploying to your account (via the console)

Go to this [page](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:374852340823:applications~propagate-cfn-tags) and click the `Deploy` button.

This app would deploy the following resources to your region:

* a Lambda function that propagates CloudFormation's tags to resources that aren't tagged automatically
* a CloudWatch event pattern that triggers the Lambda function whenever `CloudFormation:CreateStack` and `CloudFormation:UpdateStack` events are captured by CloudTrail

## Deploying via SAM/Serverless framework/CloudFormation

To deploy this app via SAM, you need something like this in the CloudFormation template:

```yml
AutoDeployMyAwesomeLambdaLayer:
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
