"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const resources = [
  {
    title: "Daily routine planner",
    description:
      "A simple printable planner for organising naps, meals, activities and bedtime.",
    category: "Routines & schedules",
    age: "All ages",
    type: "Template",
    slug: "daily-routine-planner",
  },
  {
    title: "Baby feeding log",
    description:
      "Keep track of feeds throughout the day in one simple printable sheet.",
    category: "Trackers",
    age: "Baby",
    type: "Printable",
    slug: "baby-feeding-log",
  },
  {
    title: "Nursery bag checklist",
    description:
      "A handy checklist for everything you may need to pack for nursery.",
    category: "Checklists",
    age: "Baby",
    type: "Checklist",
    slug: "nursery-bag-checklist",
  },
  {
    title: "Weekly meal planner",
    description:
      "Plan breakfasts, lunches, dinners and snacks for the week ahead.",
    category: "Parent tools",
    age: "All ages",
    type: "Template",
    slug: "weekly-meal-planner",
  },
  {
    title: "Toddler activity planner",
    description:
      "Plan simple activities across the week and keep a balance of play, learning and downtime.",
    category: "Activity sheets",
    age: "Toddler",
    type: "Planner",
    slug: "toddler-activity-planner",
  },
  {
    title: "Bedtime routine chart",
    description:
      "A visual routine chart to help make bedtime more predictable and consistent.",
    category: "Routines & schedules",
    age: "Toddler",
    type: "Printable",
    slug: "bedtime-routine-chart",
  },
];

const categories = [
  "All",
  "Routines & schedules",
  "Checklists",
  "Activity sheets",
  "Trackers",
  "Parent tools",
];

const ages = ["All", "Baby", "Toddler", "Preschool", "School age"];

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        resource.title.toLowerCase().includes(searchText) ||
        resource.description.toLowerCase().includes(searchText) ||
        resource.category.toLowerCase().includes(searchText) ||
        resource.age.toLowerCase().includes(searchText) ||
        resource.type.toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "All" || resource.category === categoryFilter;

      const matchesAge =
        ageFilter === "All" ||
        resource.age === ageFilter ||
        resource.age === "All ages";

      return matchesSearch && matchesCategory && matchesAge;
    });
  }, [search, categoryFilter, ageFilter]);

  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Resources
          </p>

          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
            Helpful tools for everyday family life
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#5f675f]">
            Browse practical templates, checklists, planners and printable
            resources created to make everyday childcare a little easier.
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
          <p className="mb-3 font-semibold">Filter by category</p>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
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
          <p className="mb-3 font-semibold">Filter by age</p>

          <div className="flex flex-wrap gap-3">
            {ages.map((age) => (
              <button
                key={age}
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

        <div className="mt-12">
          <p className="mb-6 text-sm text-[#6b746b]">
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "resource" : "resources"} found
          </p>

          {filteredResources.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <article
                  key={resource.slug}
                  className="flex flex-col rounded-3xl bg-white p-7 shadow-sm"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8F3E8] px-3 py-1 text-xs font-semibold text-[#527A5A]">
                      {resource.age}
                    </span>

                    <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-xs font-semibold">
                      {resource.category}
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                    {resource.type}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">{resource.title}</h2>

                  <p className="mt-3 flex-grow leading-7 text-[#636b63]">
                    {resource.description}
                  </p>

                  <Link
                    href={`/resources/${resource.slug}`}
                    className="mt-6 font-semibold text-[#527A5A] hover:underline"
                  >
                    View resource →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold">No resources found</h2>
              <p className="mt-3 text-[#636b63]">
                Try a different keyword or change the filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}