"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ArticleEditor from "@/components/ArticleEditor";
import FeaturedImageUpload from "@/components/FeaturedImageUpload";

export default function NewArticlePage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCheckingAdmin(false);
      setIsAdmin(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      setCheckingAdmin(false);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function saveArticle(
    event: FormEvent<HTMLFormElement>,
    status: "draft" | "published"
  ) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage("Please add a title and article content.");
      return;
    }

    setSaving(true);
    setMessage("");

    const slug = createSlug(title);

    if (!slug) {
      setMessage("Please use a valid article title.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("articles").insert({
      title: title.trim(),
      slug,
      summary: summary.trim() || null,
      topic: topic || null,
      age_group: ageGroup || null,
      content: content.trim(),
      image_url: featuredImage || null,
      status,
      published_at:
        status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setMessage(
          "An article with this URL already exists. Try changing the title slightly."
        );
      } else {
        setMessage("Something went wrong while saving the article.");
      }

      setSaving(false);
      return;
    }

    setMessage(
      status === "published"
        ? "Article published successfully!"
        : "Draft saved successfully!"
    );

    setSaving(false);

    setTimeout(() => {
      router.push("/admin");
    }, 800);
  }

  if (checkingAdmin) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Checking admin access...
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
            You need to be signed in as a NannyAnna administrator to create
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

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            New Article
          </h1>

          <p className="mt-3 text-[#636b63]">
            Create a new childcare advice article for NannyAnna.
          </p>
        </div>

        <form
          onSubmit={(event) => saveArticle(event, "draft")}
          className="rounded-3xl bg-white p-7 shadow-sm md:p-10"
        >
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
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Creating a calm bedtime routine"
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
    placeholder="A short description shown on the Advice page..."
    className="w-full resize-none rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
  />
</div>

            <div>
              <label
                htmlFor="summary"
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

            </div>
            
<div>
  <FeaturedImageUpload
    value={featuredImage}
    onChange={setFeaturedImage}
  />
</div>
          </div>

          {message && (
            <div className="mt-7 rounded-2xl bg-[#E8F3E8] p-4 text-center font-medium text-[#3E6848]">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">

            <button
              type="submit"
              disabled={saving}
              className="rounded-full border border-[#527A5A] px-6 py-3 font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={(event) => {
                const form = event.currentTarget.form;

                if (form) {
                  saveArticle(
                    {
                      preventDefault: () => {},
                    } as FormEvent<HTMLFormElement>,
                    "published"
                  );
                }
              }}
              className="rounded-full bg-[#527A5A] px-7 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Publish Article"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}