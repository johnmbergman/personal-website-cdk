# personal-website-cdk

Personal website of John Bergman — a static site built with [Eleventy](https://www.11ty.dev/)
and deployed to S3 + CloudFront by AWS CDK.

## Updating the site

Almost all content lives in one file: [`src/_data/portfolio.json`](src/_data/portfolio.json).
Edit it and the pages regenerate — projects, experience, education, skills and posts each
render from their array, so adding an entry is enough to create the corresponding page.

| Path | What it is |
| --- | --- |
| `src/_data/portfolio.json` | All site content |
| `src/*.njk` | One template per page |
| `src/_includes/` | Shared layout and partials |
| `src/css/styles.css` | Design tokens and component styles |
| `src/assets/` | Images and favicon |

## Commands

```bash
npm install          # install dependencies
npm run build        # compile CDK (tsc) and build the site into _site/
npm run serve        # local preview at http://localhost:8080 with live reload
npm test             # run CDK tests
npx cdk synth        # synthesize the CloudFormation templates
```

Pushing to `main` triggers the CodePipeline defined in `lib/deployment-pipeline-stack.ts`,
which runs `npm run build` and deploys `_site/` to the website bucket.

## Pipeline source

The pipeline reads GitHub through a [CodeStar connection](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections.html)
rather than a personal access token, so there is no credential to rotate and no
secret to pay for.

The connection must be created once by hand — authorizing the AWS Connector GitHub
app requires a browser — then recorded as the `connectionArn` context value in
`cdk.json`:

```json
{
  "context": {
    "connectionArn": "arn:aws:codestar-connections:us-east-1:<account>:connection/<uuid>"
  }
}
```

To create it: **CodePipeline → Settings → Connections → Create connection → GitHub**,
authorize the app, then copy the ARN. A connection left in `Pending` status has not
been authorized and the pipeline will not be able to read the repository.
