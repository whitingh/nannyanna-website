"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Resource = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  age_group: string | null;
  resource_type: string;
  image_url: string | null;
  external_url: string | null;
  file_url: string | null;
  published_at: string | null;
};

const ages = [
  "All",
  "Newborn",
  "Baby",
  "Toddler",
  "Preschool",
  "School age",
  "All ages",
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setLoading(true);

    const { data, error } = await supabase
      .from("resources")
      .select(
        "id, title, slug, description, category, age_group, resource_type, image_url, external_url, file_url, published_at"
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setResources(data || []);
    setLoading(false);
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        resources
          .map((resource) => resource.category)
          .filter((category): category is string => Boolean(category))
      )
    );

    return ["All", ...uniqueCategories];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return resources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchText) ||
        (resource.description || "").toLowerCase().includes(searchText) ||
        (resource.category || "").toLowerCase().includes(searchText) ||
        (resource.age_group || "").toLowerCase().includes(searchText);

      const matchesAge =
        ageFilter === "All" ||
        resource.age_group === ageFilter ||
        resource.age_group === "All ages";

      const matchesCategory =
        categoryFilter === "All" ||
        resource.category === categoryFilter;

      const matchesType =
        typeFilter === "All" ||
        resource.resource_type === typeFilter;

      return (
        matchesSearch &&
        matchesAge &&
        matchesCategory &&
        matchesType
      );
    });
  }, [resources, search, ageFilter, categoryFilter, typeFilter]);

  function getButtonText(resourceType: string) {
    switch (resourceType) {
      case "product":
        return "View product";
      case "guide":
        return "View guide";
      case "download":
        return "View / Download";
      default:
        return "Visit resource";
    }
  }

  function getResourceUrl(resource: Resource) {
    if (resource.resource_type === "download") {
      return resource.file_url || "#";
    }

    return resource.external_url || "#";
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Helpful resources
          </p>

          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
            Useful resources for everyday family life
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#5f675f]">
            Browse Anna&apos;s recommended products, guides, downloads and
            useful links.
          </p>
        </div>

        <div className="mt-10">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-lg outline-none transition focus:border-[#527A5A]"
          />
        </div>

        <div className="mt-8">
          <p className="mb-3 font-semibold">Filter by age</p>

          <div className="flex flex-wrap gap-3">
            {ages.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => setAgeFilter(age)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  ageFilter === age
                    ? "bg-[#527A5A] text-white"
                    : "bg-white hover:bg-[#dcebdd]"
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 font-semibold">Filter by category</p>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  categoryFilter === category
                    ? "bg-[#527A5A] text-white"
                    : "bg-white hover:bg-[#dcebdd]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 font-semibold">Filter by type</p>

          <div className="flex flex-wrap gap-3">
            {[
              { value: "All", label: "All" },
              { value: "link", label: "Useful links" },
              { value: "product", label: "Products" },
              { value: "guide", label: "Guides" },
              { value: "download", label: "Downloads" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setTypeFilter(type.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  typeFilter === type.value
                    ? "bg-[#527A5A] text-white"
                    : "bg-white hover:bg-[#dcebdd]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              Loading resources...
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-[#6b746b]">
                {filteredResources.length}{" "}
                {filteredResources.length === 1
                  ? "resource"
                  : "resources"}{" "}
                found
              </p>

              {filteredResources.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => {
                    const resourceUrl = getResourceUrl(resource);
                    const hasUrl = resourceUrl !== "#";

                    return (
                      <article
                        key={resource.id}
                        className="flex h-auto min-h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm"
                      >
                        {resource.image_url ? (
                          <img
                            src={resource.image_url}
                            alt={resource.title}
                            className="h-48 w-full shrink-0 object-cover"
                          />
                        ) : (
                          <div className="h-48 w-full shrink-0 bg-[#DCEBDD]" />
                        )}

                        <div className="flex flex-1 flex-col px-7 py-7">
                          <div className="flex flex-wrap gap-2">
                            {resource.age_group && (
                              <span className="rounded-full bg-[#E8F3E8] px-3 py-1 text-xs font-semibold text-[#527A5A]">
                                {resource.age_group}
                              </span>
                            )}

                            {resource.category && (
                              <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-xs font-semibold">
                                {resource.category}
                              </span>
                            )}

                            <span className="rounded-full bg-[#F3F3F3] px-3 py-1 text-xs font-semibold capitalize">
                              {resource.resource_type}
                            </span>
                          </div>

                          <h2 className="mt-5 break-words text-2xl font-bold leading-tight">
                            {resource.title}
                          </h2>

                          {resource.description && (
                            <p className="mt-4 break-words leading-7 text-[#636b63]">
                              {resource.description}
                            </p>
                          )}

                          <div className="mt-auto pt-8">
                            {hasUrl ? (
                              <a
                                href={resourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full bg-[#527A5A] px-5 py-3 font-semibold text-white transition hover:bg-[#45694D]"
                              >
                                {getButtonText(resource.resource_type)}
                              </a>
                            ) : (
                              <span className="inline-flex rounded-full bg-[#E8F3E8] px-5 py-3 font-semibold text-[#527A5A]">
                                Coming soon
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                  <h2 className="text-2xl font-bold">
                    No resources found
                  </h2>

                  <p className="mt-3 text-[#636b63]">
                    Try a different keyword or change the filters.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}