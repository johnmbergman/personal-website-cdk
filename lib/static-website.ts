import {Construct, IConstruct} from "constructs";
import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import {HostedZone} from "aws-cdk-lib/aws-route53";
import {
    AllowedMethods,
    Distribution,
    OriginAccessIdentity,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {RemovalPolicy} from "aws-cdk-lib";
import {CanonicalUserPrincipal, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {DnsValidatedCertificate} from "aws-cdk-lib/aws-certificatemanager";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {BucketDeployment, ISource} from "aws-cdk-lib/aws-s3-deployment";

/**
 * Construct properties for {@link StaticWebsite}.
 */
export interface StaticWebsiteProps {
    domain: string
    subdomain: string
    staticContent: ISource
}

/**
 * Construct defining a static website deployed through an S3 bucket and CloudFront distribution.
 */
export class StaticWebsite extends Construct {

    constructor(scope: IConstruct, id: string, props: StaticWebsiteProps) {
        super(scope, id);

        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', { domainName: props.domain });
        const fullDomain = `${props.subdomain}.${props.domain}`;
        const originAccessIdentity = new OriginAccessIdentity(this, 'CloudFrontOAI', {
            comment: `OAI for ${id}`,
        });

        // Create Website Contents Bucket
        const bucket = new Bucket(this, 'WebsiteContentBucket', {
            bucketName: fullDomain,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,

            /**
             * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
             * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
             * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
             *
             * Explicitly set the removal policy to RETAIN.
             */
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Grant website content bucket access to CloudFront
        bucket.addToResourcePolicy(new PolicyStatement({
            actions: [
                `s3:GetObject`
            ],
            resources: [
                bucket.arnForObjects('*')
            ],
            principals: [
                new CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)
            ],
        }));

        // Create TLS certificate
        const wildcardDomain = `*.${props.domain}`;
        const certificate = new DnsValidatedCertificate(this, 'WebsiteCertificate', {
            domainName: wildcardDomain,
            hostedZone: hostedZone,
            region: 'us-east-1', // CloudFront only checks this region for certificates.
        });

        // Create CloudFront distribution
        const distribution = new Distribution(this, 'WebsiteDistribution', {
            certificate: certificate,
            defaultRootObject: "index.html",
            domainNames: [props.domain, fullDomain],
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            defaultBehavior: {
                origin: new S3Origin(bucket, {
                    originAccessIdentity: originAccessIdentity,
                }),
                compress: true,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            }
        });

        // Deploy website content to website content bucket
        new BucketDeployment(this, 'StaticContentDeployment', {
            sources: [props.staticContent],
            destinationBucket: bucket,
            distribution: distribution,
            distributionPaths: ['/*'],
        });
    }
}