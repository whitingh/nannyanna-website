"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  topic: string | null;
  age_group: string | null;
  image_url: string | null;
  published_at: string | null;
};

const ages = ["All", "Newborn", "Baby", "Toddler", "Preschool", "School age", "All ages"];

export default function AdvicePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, slug, summary, topic, age_group, image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setArticles(data || []);
    setLoading(false);
  }

  const topics = useMemo(() => {
    const uniqueTopics = Array.from(
      new Set(
        articles
          .map((article) => article.topic)
          .filter((topic): topic is string => Boolean(topic))
      )
    );

    return ["All", ...uniqueTopics];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        article.title.toLowerCase().includes(searchText) ||
        (article.summary || "").toLowerCase().includes(searchText) ||
        (article.topic || "").toLowerCase().includes(searchText) ||
        (article.age_group || "").toLowerCase().includes(searchText);

      const matchesAge =
        ageFilter === "All" ||
        article.age_group === ageFilter ||
        article.age_group === "All ages";

      const matchesTopic =
        topicFilter === "All" || article.topic === topicFilter;

      return matchesSearch && matchesAge && matchesTopic;
    });
  }, [articles, search, ageFilter, topicFilter]);

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
            guidance for everyday childcare.
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
          {loading ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              Loading advice...
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-[#6b746b]">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "article" : "articles"} found
              </p>

              {filteredArticles.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredArticles.map((article) => (
                    <article
  key={article.id}
  className="flex h-auto min-h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm"
>
  {article.image_url ? (
    <img
      src={article.image_url}
      alt={article.title}
      className="h-48 w-full shrink-0 object-cover"
    />
  ) : (
    <div className="h-48 w-full shrink-0 bg-[#DCEBDD]" />
  )}

  <div className="flex flex-1 flex-col px-7 py-7">
    <div className="flex flex-wrap gap-2">
      {article.age_group && (
        <span className="rounded-full bg-[#E8F3E8] px-3 py-1 text-xs font-semibold text-[#527A5A]">
          {article.age_group}
        </span>
      )}

      {article.topic && (
        <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-xs font-semibold">
          {article.topic}
        </span>
      )}
    </div>

    <h2 className="mt-5 break-words text-2xl font-bold leading-tight">
      {article.title}
    </h2>

    {article.summary && (
      <p className="mt-4 break-words leading-7 text-[#636b63]">
        {article.summary}
      </p>
    )}

    <div className="mt-auto pt-8">
      <Link
        href={`/advice/${article.slug}`}
        scroll={true}
        className="inline-flex items-center font-semibold text-[#527A5A] hover:underline"
      >
        Read advice →
      </Link>
    </div>
  </div>
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}