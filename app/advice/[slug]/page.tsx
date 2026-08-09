"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Article = {
  title: string;
  summary: string | null;
  content: string;
  topic: string | null;
  age_group: string | null;
  image_url: string | null;
  published_at: string | null;
};

export default function AdviceArticlePage() {
  const params = useParams();
  const slug = String(params.slug);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });
}, [slug]);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  async function loadArticle() {
    setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("title, summary, content, topic, age_group, image_url, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      setArticle(null);
      setLoading(false);
      return;
    }

    setArticle(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading article...
        </p>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-bold">
            Article not found
          </h1>

          <p className="mt-3 text-[#636b63]">
            This article may have been removed or is not currently published.
          </p>

          <Link
            href="/advice"
            className="mt-6 inline-block rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white"
          >
            Back to Advice
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <article className="mx-auto max-w-4xl px-6 py-16 md:px-12 md:py-24">
        <Link
          href="/advice"
          className="font-semibold text-[#527A5A] hover:underline"
        >
          ← Back to Advice
        </Link>

        <div className="mt-8 flex flex-wrap gap-2">
          {article.age_group && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#527A5A]">
              {article.age_group}
            </span>
          )}

          {article.topic && (
            <span className="rounded-full bg-[#F4DDD2] px-3 py-1 text-xs font-semibold">
              {article.topic}
            </span>
          )}
        </div>

        <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
          {article.title}
        </h1>

        {article.summary && (
          <p className="mt-6 text-xl leading-8 text-[#5f675f]">
            {article.summary}
          </p>
        )}

        {article.image_url && (
  <img
    src={article.image_url}
    alt={article.title}
    className="mt-10 h-[240px] w-full rounded-3xl object-cover shadow-sm md:h-[300px]"
  />
)}

        <div className="mt-10 rounded-3xl bg-white p-7 shadow-sm md:p-10">
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </article>
    </main>
  );
}