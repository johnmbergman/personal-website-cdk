import {Environment, Stack, StackProps} from "aws-cdk-lib";
import {IConstruct} from "constructs";
import {CodePipeline, CodePipelineSource, ShellStep} from "aws-cdk-lib/pipelines";
import {LinuxBuildImage} from "aws-cdk-lib/aws-codebuild";
import {DeploymentStage} from "./deployment-stage";

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

        /**
         * ARN of the CodeStar connection authorizing AWS to access the GitHub repository.
         * The connection is created once in the console (it requires a browser to authorize
         * the GitHub app) and its ARN recorded in cdk.json. Unlike a personal access token
         * it does not expire, so the pipeline cannot be broken by credential rotation.
         */
        const connectionArn = this.node.tryGetContext('connectionArn');
        if (!connectionArn) {
            throw new Error(
                'Missing required context value "connectionArn". Create a GitHub connection in the ' +
                'CodeStar Connections console, then set its ARN in cdk.json or pass -c connectionArn=<arn>.'
            );
        }

        const pipeline = new CodePipeline(this, 'CodePipelineResource', {
            pipelineName: 'PersonalWebsite',

            // The default image (standard:5.0) tops out at Node 14; Eleventy 3 needs Node 18+.
            codeBuildDefaults: {
                buildEnvironment: {
                    buildImage: LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:7.0'),
                },
            },
            synth: new ShellStep('some-id', {
                input: CodePipelineSource.connection('johnmbergman/personal-website-cdk', 'main', {
                    connectionArn: connectionArn,
                }),
                commands: [
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                ],
            }),
        });

        pipeline.addStage(new DeploymentStage(this, 'ProdStage', {
            stage: 'Prod',
            env: props.env,
            domain: this.node.tryGetContext('domain'),
            subdomain: this.node.tryGetContext('subdomain'),
        }));
    }

}