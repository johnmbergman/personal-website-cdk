/** Mirrors the design's `matchesSkill` so a skill badge finds its projects. */
function matchesSkill(tech, skill) {
    const a = tech.toLowerCase();
    const b = skill.toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const monthYear = (date) => date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
    eleventyConfig.addPassthroughCopy({ "src/css": "css" });

    eleventyConfig.addGlobalData("year", new Date().getFullYear());

    eleventyConfig.addCollection("projects", (api) =>
        api.getFilteredByGlob("src/projects/*.njk").sort((a, b) => a.data.order - b.data.order));

    eleventyConfig.addCollection("posts", (api) =>
        api.getFilteredByGlob("src/writing/*.njk").sort((a, b) => b.date - a.date));

    /**
     * Only skills matching at least one project become filter pages. Skills with no
     * match render as plain badges, so the design's empty-state branch never fires.
     */
    eleventyConfig.addCollection("skillFilters", (api) => {
        const projects = api.getFilteredByGlob("src/projects/*.njk").sort((a, b) => a.data.order - b.data.order);
        const skillsPage = api.getAll().find((item) => item.data.skills && item.url === "/skills/");
        return [...new Set(Object.values(skillsPage.data.skills).flat())]
            .map((skill) => ({
                skill,
                slug: slugify(skill),
                projects: projects.filter((p) => p.data.tech.some((t) => matchesSkill(t, skill))),
            }))
            .filter((f) => f.projects.length > 0);
    });

    eleventyConfig.addFilter("skillSlug", (skill, skillFilters) =>
        skillFilters.find((f) => f.skill === skill)?.slug ?? null);
    eleventyConfig.addFilter("monthYear", monthYear);

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
        },
    };
};
