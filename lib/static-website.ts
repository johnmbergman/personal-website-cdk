import {Construct, IConstruct} from "constructs";
import {BlockPublicAccess, Bucket} from "aws-cdk-lib/aws-s3";
import {HostedZone} from "aws-cdk-lib/aws-route53";
import {
    AllowedMethods,
    Distribution,
    OriginAccessIdentity,
    Function as CloudFrontFunction,
    FunctionCode,
    FunctionEventType,
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

        /**
         * Create TLS certificate.
         *
         * A wildcard matches exactly one label, so `*.example.com` covers `www.example.com`
         * but NOT the bare `example.com`. The distribution serves both, so the apex is the
         * certificate's domain name and the wildcard is added as an alternative name.
         */
        const certificate = new DnsValidatedCertificate(this, 'WebsiteCertificate', {
            domainName: props.domain,
            subjectAlternativeNames: [`*.${props.domain}`],
            hostedZone: hostedZone,
            region: 'us-east-1', // CloudFront only checks this region for certificates.
        });

        /**
         * The S3 origin is a REST endpoint (it is fronted by an OAI), so S3 does not resolve
         * directory indexes, and `defaultRootObject` only applies to `/`. Without this, every
         * page below the root — `/projects/`, `/writing/<slug>/` — would 404. Rewrite those
         * requests to the `index.html` the static site generator wrote there.
         */
        const directoryIndexFunction = new CloudFrontFunction(this, 'DirectoryIndexFunction', {
            comment: 'Rewrites directory requests to their index.html object',
            code: FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if (uri.charAt(uri.length - 1) === '/') {
        request.uri = uri + 'index.html';
    } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
        request.uri = uri + '/index.html';
    }
    return request;
}
            `),
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
                functionAssociations: [{
                    function: directoryIndexFunction,
                    eventType: FunctionEventType.VIEWER_REQUEST,
                }],
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