#!/usr/bin/env node
import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import {DeploymentPipelineStack} from "../lib/deployment-pipeline-stack";

const app = new App();

new DeploymentPipelineStack(app, `DeploymentPipelineStack`, {
    env: {
        account: app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
    }
})
