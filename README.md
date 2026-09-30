# personal-website-cdk

Personal website of John Bergman — a static site built with [Eleventy](https://www.11ty.dev/)
and deployed to S3 + CloudFront by AWS CDK.

## Updating the site

Each page's content lives in its own Nunjucks (`.njk`) file under `src/`.

| To change… | Edit |
| --- | --- |
| Home, About, Contact | `src/index.njk`, `src/about.njk`, `src/contact.njk` |
| Experience and education | the `experience:` / `education:` lists in `src/experience.njk`'s front matter |
| Skills | the `skills:` groups in `src/skills.njk`'s front matter |
| A project | `src/projects/<slug>.njk` |
| A post | `src/writing/<slug>.njk` |
| Social links | `src/_includes/social.njk` |
| Shared layout and styles | `src/_includes/`, `src/css/styles.css` |
| Images and favicon | `src/assets/` |

**Adding a project:** create `src/projects/<slug>.njk`. The filename becomes the URL
(`/projects/<slug>/`), and `order` sets its position in the grid. `tech` drives the
card tags and which skill pages list it. Anything below the front matter appears on
the project page under the description.

```njk
---
title: "My Project"
description: "One-sentence summary shown on the card and the project page."
tech: ["Java", "AWS"]
order: 7
---
```

**Adding a post:** create `src/writing/<slug>.njk`. Posts are listed newest first by
`date`, which displays as month and year.

```njk
---
title: "My Post"
date: 2026-09-01
description: "One-line excerpt shown in the writing list."
---
<p>First paragraph.</p>
<p>Second paragraph.</p>
```

Skill filter pages (`/projects/skill-<slug>/`) are generated automatically for every
skill that matches at least one project's `tech`.

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

Connections created since the CodeStar Connections → CodeConnections rename have
`codeconnections` ARNs, while this version of the CDK grants the older
`codestar-connections:UseConnection`. The pipeline stack grants the matching
`codeconnections:UseConnection` explicitly, so either ARN prefix works.
