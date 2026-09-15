import {Template, Match} from 'aws-cdk-lib/assertions'
import {App, Stack} from 'aws-cdk-lib';
import {DeploymentPipelineStack} from "../lib/deployment-pipeline-stack";

describe('Deployment Pipeline', () => {
    const app = new App({
        context: {
            connectionArn: 'arn:aws:codestar-connections:us-east-1:account-id:connection/test-connection',
        },
    });

    const deploymentPipelineStack = new DeploymentPipelineStack(new Stack(app, 'TestParent'), 'DeploymentPipelineTestStack', {
        env: {
            account: 'account-id',
            region: 'us-east-1',
        }
    });

    const template = Template.fromStack(deploymentPipelineStack);

    it('has the correct the name', () => {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
            Name: 'PersonalWebsite',
        });
    });

    it('is hooked up to the correct github repository', () => {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
            Stages: Match.arrayWith([
                Match.objectLike({
                Actions: Match.arrayWith([Match.objectLike({
                    Configuration: {
                        Owner: 'johnmbergman',
                        Repo: 'personal-website-cdk',
                        Branch: 'main'
                    }
                })])
            })])
        });
    });
});
