const portfolio = require("./src/_data/portfolio.json");

/** Mirrors the design's `matchesSkill` so a skill badge finds its projects. */
function matchesSkill(tag, skill) {
    const a = tag.toLowerCase();
    const b = skill.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Only skills matching at least one project become filter pages. Skills with no
 * match render as plain badges, so the design's empty-state branch never fires.
 */
const skillFilters = [...new Set(Object.values(portfolio.skills).flat())]
    .map((skill) => ({
        skill,
        slug: slugify(skill),
        projects: portfolio.projects.filter((p) => p.tags.some((t) => matchesSkill(t, skill))),
    }))
    .filter((f) => f.projects.length > 0);

const linkedSkills = new Set(skillFilters.map((f) => f.skill));

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
    eleventyConfig.addPassthroughCopy({ "src/css": "css" });

    eleventyConfig.addGlobalData("year", new Date().getFullYear());
    eleventyConfig.addGlobalData("skillFilters", skillFilters);
    eleventyConfig.addFilter("skillSlug", (skill) => (linkedSkills.has(skill) ? slugify(skill) : null));

    return {
        dir: {
            input: "src",
            output: "_site",
            data: "_data",
            includes: "_includes",
        },
    };
};
