import Link from "next/link";
import { buttonVariants, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn";

const featureCards = [
  {
    title: "Users",
    summary: "Search and manage roles.",
    href: "/admin2/users",
  },
  {
    title: "Languages",
    summary: "Edit language metadata.",
    href: "/admin2/languages",
  },
  {
    title: "Courses",
    summary: "Maintain course settings.",
    href: "/admin2/courses",
  },
  {
    title: "Story",
    summary: "Open and moderate stories.",
    href: "/admin2/story",
  },
];

export default function Admin2OverviewPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Admin Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl text-slate-600">Manage users, languages, courses, and stories.</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {featureCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{card.summary}</p>
              <Link href={card.href} className={`${buttonVariants({ size: "sm" })} mt-4`}>
                Open {card.title}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
