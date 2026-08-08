"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const articles = [
  {
    title: "Creating a calm bedtime routine",
    summary:
      "A simple approach to building a consistent bedtime routine that feels manageable for both parents and children.",
    age: "Toddler",
    topic: "Sleep & routines",
    slug: "calm-bedtime-routine",
  },
  {
    title: "Helping with fussy eating",
    summary:
      "Practical ways to make mealtimes feel less stressful and encourage children to explore new foods.",
    age: "Toddler",
    topic: "Food & mealtimes",
    slug: "fussy-eating",
  },
  {
    title: "What to do when tantrums happen",
    summary:
      "Ideas for staying calm, setting boundaries and helping young children work through big emotions.",
    age: "Toddler",
    topic: "Behaviour",
    slug: "tantrums",
  },
  {
    title: "Building a simple baby nap routine",
    summary:
      "A flexible way to think about naps and daytime routines without making the day feel overly rigid.",
    age: "Baby",
    topic: "Sleep & routines",
    slug: "baby-nap-routine",
  },
  {
    title: "Preparing for nursery",
    summary:
      "Helpful ways to make the transition into nursery feel more familiar and reassuring.",
    age: "Preschool",
    topic: "Nursery & school",
    slug: "preparing-for-nursery",
  },
  {
    title: "Easy indoor activities for rainy days",
    summary:
      "Simple play ideas using things you may already have at home.",
    age: "All ages",
    topic: "Activities & play",
    slug: "rainy-day-activities",
  },
];

const ages = ["All", "Baby", "Toddler", "Preschool", "School age"];
const topics = [
  "All",
  "Sleep & routines",
  "Behaviour",
  "Food & mealtimes",
  "Activities & play",
  "Development",
  "Nursery & school",
  "Travel",
];

export default function AdvicePage() {
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        article.title.toLowerCase().includes(searchText) ||
        article.summary.toLowerCase().includes(searchText) ||
        article.topic.toLowerCase().includes(searchText) ||
        article.age.toLowerCase().includes(searchText);

      const matchesAge =
        ageFilter === "All" ||
        article.age === ageFilter ||
        article.age === "All ages";

      const matchesTopic =
        topicFilter === "All" || article.topic === topicFilter;

      return matchesSearch && matchesAge && matchesTopic;
    });
  }, [search, ageFilter, topicFilter]);

  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Childcare advice
          </p>

          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
            Practical advice for everyday family life
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#5f675f]">
            Browse Anna&apos;s advice by age, topic or keyword to find helpful
            guidance for the situations that come up in everyday childcare.
          </p>
        </div>

        <div className="mt-10">
          <input
            type="text"
            placeholder="Search childcare advice..."
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
          <p className="mb-3 font-semibold">Filter by topic</p>

          <div className="flex flex-wrap gap-3">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setTopicFilter(topic)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  topicFilter === topic
                    ? "bg-[#527A5A] text-white"
                    : "bg-white hover:bg-[#dcebdd]"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-6 text-sm text-[#6b746b]">
            {filteredArticles.length}{" "}
            {filteredArticles.length === 1 ? "article" : "articles"} found
          </p>

          {filteredArticles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <article
                  key={article.slug}
                  className="flex flex-col rounded-3xl bg-white p-7 shadow-sm"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8F3E8] px-3 py-1 text-xs font-semibold text-[#527A5A]">
                      {article.age}
                    </span>

                    <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-xs font-semibold">
                      {article.topic}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">{article.title}</h2>

                  <p className="mt-3 flex-grow leading-7 text-[#636b63]">
                    {article.summary}
                  </p>

                  <Link
                    href={`/advice/${article.slug}`}
                    className="mt-6 font-semibold text-[#527A5A] hover:underline"
                  >
                    Read advice →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold">No advice found</h2>
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