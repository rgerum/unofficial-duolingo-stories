import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getDocsData, getPageData } from "@/app/docs/[[...slug]]/doc_data";
import {
  DocsRoutePage,
  type DocsPageData,
} from "@/routes/-components/docs_route";

const loadDocsPage = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<DocsPageData> => {
    const navigationData = await getDocsData();
    const pathTitles: Record<string, { group: string; title: string }> = {};

    for (const group of navigationData.navigation) {
      for (const page of group.pages) {
        pathTitles[page.slug] = {
          group: group.group,
          title: page.title,
        };
      }
    }

    const activeSlug = slug || "introduction";
    const page = await getPageData(`/${activeSlug}`);
    let groupName = "Docs";
    let previous: DocsPageData["previous"] = null;
    let next: DocsPageData["next"] = null;
    let found = false;

    for (const group of navigationData.navigation) {
      for (const navPage of group.pages) {
        if (!next && found) next = { slug: navPage.slug, title: navPage.title };
        if (navPage.slug === activeSlug) {
          groupName = group.group;
          found = true;
        }
        if (!found) previous = { slug: navPage.slug, title: navPage.title };
      }
    }

    return {
      body: page.body ?? "",
      description: page.description,
      group: groupName,
      navigation: navigationData.navigation,
      next,
      pathTitles,
      previous,
      slug: activeSlug,
      title: page.title ?? "Docs",
    };
  });

export const Route = createFileRoute("/docs/")({
  loader: () => loadDocsPage({ data: "introduction" }),
  component: DocsIndexRoute,
});

function DocsIndexRoute() {
  return <DocsRoutePage data={Route.useLoaderData()} />;
}
