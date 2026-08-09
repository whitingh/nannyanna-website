"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ArticleEditor from "@/components/ArticleEditor";
import FeaturedImageUpload from "@/components/FeaturedImageUpload";

type Article = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  topic: string | null;
  age_group: string | null;
  image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
};

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();

  const articleId = Number(params.id);

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(true);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featuredImage, setFeaturedImage] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoadArticle();
  }, []);

  async function checkAdminAndLoadArticle() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCheckingAdmin(false);
      setLoadingArticle(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      setCheckingAdmin(false);
      setLoadingArticle(false);
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select(
        "id, title, slug, summary, content, topic, age_group, image_url, status, published_at"
      )
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      setMessage("Article not found.");
      setLoadingArticle(false);
      return;
    }

    const typedArticle = article as Article;

    setTitle(typedArticle.title);
    setSummary(typedArticle.summary || "");
    setTopic(typedArticle.topic || "");
    setAgeGroup(typedArticle.age_group || "");
    setContent(typedArticle.content);
    setStatus(typedArticle.status);
    setFeaturedImage(typedArticle.image_url || "");

    setLoadingArticle(false);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function saveArticle(newStatus: "draft" | "published") {
    if (!title.trim() || !content.trim()) {
      setMessage("Please add a title and article content.");
      return;
    }

    setSaving(true);
    setMessage("");

    const slug = createSlug(title);

    const updateData = {
      title: title.trim(),
      slug,
      summary: summary.trim() || null,
      content: content.trim(),
      topic: topic || null,
      age_group: ageGroup || null,
      image_url: featuredImage || null,
      status: newStatus,
      published_at:
        newStatus === "published"
          ? status === "published"
            ? undefined
            : new Date().toISOString()
          : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", articleId);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setMessage(
          "Another article already uses this URL. Try changing the title slightly."
        );
      } else {
        setMessage("Something went wrong while saving the article.");
      }

      setSaving(false);
      return;
    }

    setStatus(newStatus);

    setMessage(
      newStatus === "published"
        ? "Article published successfully."
        : "Article saved as a draft."
    );

    setSaving(false);
  }

  async function deleteArticle() {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this article?"
  );

  if (!confirmed) return;

  setDeleting(true);
  setMessage("");

  // First load the article's stored image data
  const { data: articleToDelete, error: loadError } = await supabase
    .from("articles")
    .select("content, image_url")
    .eq("id", articleId)
    .single();

  if (loadError || !articleToDelete) {
    console.error(loadError);
    setMessage("Something went wrong while preparing to delete the article.");
    setDeleting(false);
    return;
  }

  const marker = "/storage/v1/object/public/article-images/";
  const filesToDelete: string[] = [];

  // Featured image
  if (
    articleToDelete.image_url &&
    articleToDelete.image_url.includes(marker)
  ) {
    filesToDelete.push(
      decodeURIComponent(articleToDelete.image_url.split(marker)[1])
    );
  }

  // Inline images inside the article HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(articleToDelete.content || "", "text/html");

  const inlineImages = Array.from(doc.querySelectorAll("img"));

  inlineImages.forEach((image) => {
    const src = image.getAttribute("src");

    if (src && src.includes(marker)) {
      filesToDelete.push(
        decodeURIComponent(src.split(marker)[1])
      );
    }
  });

  // Remove duplicates
  const uniqueFiles = [...new Set(filesToDelete)];

  if (uniqueFiles.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("article-images")
      .remove(uniqueFiles);

    if (storageError) {
      console.error(storageError);

      const continueAnyway = window.confirm(
        "The article images could not all be deleted from storage. Delete the article anyway?"
      );

      if (!continueAnyway) {
        setDeleting(false);
        return;
      }
    }
  }

  // Finally delete the database row
  const { error: deleteError } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (deleteError) {
    console.error(deleteError);
    setMessage("Something went wrong while deleting the article.");
    setDeleting(false);
    return;
  }

  router.push("/admin");
}

  if (checkingAdmin || loadingArticle) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading article...
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-[#2f2f2f]">
            Admin access required
          </h1>

          <p className="mt-3 text-[#636b63]">
            You need to be signed in as a NannyAnna administrator to edit
            articles.
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-block rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white"
          >
            Admin login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="font-semibold text-[#527A5A] hover:underline"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
                Admin
              </p>

              <h1 className="mt-2 text-4xl font-bold md:text-5xl">
                Edit Article
              </h1>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                status === "published"
                  ? "bg-[#527A5A] text-white"
                  : "bg-[#F4DDD2] text-[#6d5145]"
              }`}
            >
              {status === "published" ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm md:p-10">
          <div className="space-y-7">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block font-semibold"
              >
                Article title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              />

              {title && (
                <p className="mt-2 text-sm text-[#7a827a]">
                  Article URL: /advice/{createSlug(title)}
                </p>
              )}
            </div>

            <div>
  <label
    htmlFor="summary"
    className="mb-2 block font-semibold"
  >
    Short summary
  </label>

  <textarea
    id="summary"
    rows={3}
    value={summary}
    onChange={(e) => setSummary(e.target.value)}
    placeholder="A short introduction shown on the Advice page..."
    className="w-full resize-none rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
  />
</div>

<div>
  <label
    className="mb-2 block font-semibold"
  >
    Article
  </label>

  <ArticleEditor
    content={content}
    onChange={setContent}
  />
</div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="topic"
                  className="mb-2 block font-semibold"
                >
                  Topic
                </label>

                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
                >
                  <option value="">Choose a topic</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Routines">Routines</option>
                  <option value="Behaviour">Behaviour</option>
                  <option value="Development">Development</option>
                  <option value="Feeding">Feeding</option>
                  <option value="Play">Play</option>
                  <option value="Childcare">Childcare</option>
                  <option value="Parenting">Parenting</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ageGroup"
                  className="mb-2 block font-semibold"
                >
                  Age group
                </label>

                <select
                  id="ageGroup"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
                >
                  <option value="">Choose an age group</option>
                  <option value="Newborn">Newborn</option>
                  <option value="Baby">Baby</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Preschool">Preschool</option>
                  <option value="School age">School age</option>
                  <option value="All ages">All ages</option>
                </select>
              </div>
              <div>
  <FeaturedImageUpload
    value={featuredImage}
    onChange={setFeaturedImage}
  />
</div>
            </div>
          </div>

          {message && (
            <div className="mt-7 rounded-2xl bg-[#E8F3E8] p-4 text-center font-medium text-[#3E6848]">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-8 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveArticle("draft")}
              className="rounded-full border border-[#527A5A] px-6 py-3 font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveArticle("published")}
              className="rounded-full bg-[#527A5A] px-7 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Publish Article"}
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={deleteArticle}
              className="sm:ml-auto rounded-full border border-red-300 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Article"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}