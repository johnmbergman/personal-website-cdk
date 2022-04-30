import {Environment, SecretValue, Stack, StackProps} from "aws-cdk-lib";
import {IConstruct} from "constructs";
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
import {GitHubTrigger} from "aws-cdk-lib/aws-codepipeline-actions";

/**
 * Stack properties for {@link DeploymentPipelineStack}.
 */
export interface DeploymentPipelineStackProps extends StackProps {
    env: Environment
}

/**
 * Stack defining the deployment pipeline for the application.
 */
export class DeploymentPipelineStack extends Stack {

    constructor(scope: IConstruct, id: string, props: DeploymentPipelineStackProps) {
        super(scope, id, props);

        new CodePipeline(this, 'CodePipelineResource', {
            pipelineName: 'PersonalWebsite',
            synth: new ShellStep('some-id', {
                input: CodePipelineSource.gitHub('johnmbergman/personal-website-cdk', 'main', {
                    authentication: SecretValue.secretsManager('github-oauth-token'),
                    trigger: GitHubTrigger.WEBHOOK,
                }),
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                ],
            }),
        });
    }

}