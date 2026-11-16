import { slugify } from "@/lib/slug";

// Display names are shortened, so two teams can slugify alike; the later one gets its id appended.
export function teamSlugs(
  batch: { id: number; name: string }[],
  stored: { id: number; name: string; slug: string }[],
) {
  const byId = new Map(stored.map((t) => [t.id, t]));
  const owners = new Map(stored.map((t) => [t.slug, t.id]));
  const slugs = new Map<number, string>();
  for (const { id, name } of batch) {
    const own = byId.get(id);
    let slug = own && own.name === name ? own.slug : slugify(name);
    if ((owners.get(slug) ?? id) !== id) slug = `${slug}-${id}`;
    owners.set(slug, id);
    slugs.set(id, slug);
  }
  return slugs;
}
