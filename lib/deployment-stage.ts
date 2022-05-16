import {Environment, Stage, StageProps} from "aws-cdk-lib";
import {IConstruct} from "constructs";
import {StaticWebsiteStack} from "./static-website-stack";

export interface DeploymentStageProps extends StageProps {
    stage: string
    domain: string
    subdomain: string
}

export class DeploymentStage extends Stage {

    constructor(scope: IConstruct, id: string, props: DeploymentStageProps) {
        super(scope, id, props);

        new StaticWebsiteStack(this, `PersonalStaticWebsiteStack${props.stage}`, {
            env: props.env,
            domain: props.domain,
            subdomain: props.subdomain,
        });
    }
}