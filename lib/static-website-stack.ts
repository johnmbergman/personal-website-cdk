import {Stack, StackProps} from "aws-cdk-lib";
import {IConstruct} from "constructs";
import {StaticWebsite} from "./static-website";
import {Source} from "aws-cdk-lib/aws-s3-deployment";

/**
 * Stack properties for {@link StaticWebsiteStack}.
 */
export interface StaticWebsiteStackProps extends StackProps {
    domain: string,
    subdomain: string,
}

/**
 * Stack defining a static website for a given domain and subdomain.
 */
export class StaticWebsiteStack extends Stack {
    constructor(scope: IConstruct, id: string, props: StaticWebsiteStackProps) {
        super(scope, id, props);

        new StaticWebsite(this, 'StaticWebsite', {
            domain: props.domain,
            subdomain: props.subdomain,
            staticContent: Source.asset('./site-contents'),
        });
    }
}