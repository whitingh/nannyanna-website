"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Article = {
  id: number;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  published_at: string | null;
};

type Resource = {
  id: number;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  resource_type: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setMessage("This account does not have admin access.");
      setLoading(false);
      return;
    }

    setIsAdmin(true);
setLoading(false);

await Promise.all([
  loadArticles(),
  loadResources(),
]);
  }

  async function loadArticles() {
    setLoadingArticles(true);

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, slug, status, updated_at, published_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoadingArticles(false);
      return;
    }

    setArticles(data || []);
    setLoadingArticles(false);
  }

  async function loadResources() {
  setLoadingResources(true);

  const { data, error } = await supabase
    .from("resources")
    .select(
      "id, title, slug, status, updated_at, published_at, resource_type"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    setLoadingResources(false);
    return;
  }

  setResources(data || []);
  setLoadingResources(false);
}

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSigningIn(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Login failed. Check your email and password.");
      setSigningIn(false);
      return;
    }

    await checkUser();
    setSigningIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setArticles([]);
    setEmail("");
    setPassword("");
  }

  const drafts = articles.filter((article) => article.status === "draft");
  const published = articles.filter(
    (article) => article.status === "published"
  );

  const resourceDrafts = resources.filter(
  (resource) => resource.status === "draft"
);

const publishedResources = resources.filter(
  (resource) => resource.status === "published"
);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">Loading admin...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16 text-[#2f2f2f]">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">NannyAnna Admin</h1>

          <p className="mt-3 text-[#636b63]">
            Sign in to manage NannyAnna articles and content.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-60"
            >
              {signingIn ? "Signing in..." : "Sign in"}
            </button>

            {message && (
              <p className="text-center text-sm text-[#636b63]">{message}</p>
            )}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold">NannyAnna Dashboard</h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="rounded-full border border-[#527A5A] px-5 py-3 font-semibold text-[#527A5A] transition hover:bg-white"
            >
              Log out
            </button>
          </div>
        </div>

        <section className="mt-10">
        <div className="flex items-center justify-between">
        <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
                Articles
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Manage articles
              </h2>
         </div>
         <Link
              href="/admin/articles/new"
              className="rounded-full bg-[#527A5A] px-5 py-3 font-semibold text-white"
            >
              New Article
        </Link>
        </div>
         </section>

        <section className="mt-10">
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
              Total
            </p>
            <p className="mt-2 text-4xl font-bold">{articles.length}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#B08D57]">
              Drafts
            </p>
            <p className="mt-2 text-4xl font-bold">{drafts.length}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
              Published
            </p>
            <p className="mt-2 text-4xl font-bold">{published.length}</p>
          </div>
        </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Draft articles</h2>
            <span className="text-sm text-[#6b746b]">
              {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {loadingArticles ? (
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                Loading articles...
              </div>
            ) : drafts.length > 0 ? (
              drafts.map((article) => (
                <div
                  key={article.id}
                  className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#B08D57]">
                      Draft
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{article.title}</h3>
                  </div>

                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="rounded-full border border-[#527A5A] px-5 py-2 text-center font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8]"
                  >
                    Edit
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-6 text-[#636b63] shadow-sm">
                No draft articles yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Published articles</h2>
            <span className="text-sm text-[#6b746b]">
              {published.length}{" "}
              {published.length === 1 ? "article" : "articles"}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {published.length > 0 ? (
              published.map((article) => (
                <div
                  key={article.id}
                  className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
                      Published
                    </p>
                    <h3 className="mt-1 text-xl font-bold">{article.title}</h3>
                  </div>

                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="rounded-full border border-[#527A5A] px-5 py-2 text-center font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8]"
                  >
                    Edit
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-6 text-[#636b63] shadow-sm">
                No published articles yet.
              </div>
            )}
          </div>
        </section>
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
                Resources
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Manage resources
              </h2>
            </div>

            <Link
              href="/admin/resources/new"
              className="rounded-full bg-[#527A5A] px-5 py-3 font-semibold text-white"
            >
              New Resource
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
                Total
              </p>

              <p className="mt-2 text-4xl font-bold">
                {resources.length}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#B08D57]">
                Drafts
              </p>

              <p className="mt-2 text-4xl font-bold">
                {resourceDrafts.length}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
                Published
              </p>

              <p className="mt-2 text-4xl font-bold">
                {publishedResources.length}
              </p>
            </div>
          </div>
        {loadingResources ? (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            Loading resources...
          </div>
        ) : (
          <>
            {/* Draft resources */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  Draft resources
                </h3>

                <span className="text-sm text-[#6b746b]">
                  {resourceDrafts.length}{" "}
                  {resourceDrafts.length === 1 ? "draft" : "drafts"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {resourceDrafts.length > 0 ? (
                  resourceDrafts.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#B08D57]">
                          Draft
                        </p>

                        <h4 className="mt-1 text-xl font-bold">
                          {resource.title}
                        </h4>
                      </div>

                      <Link
                        href={`/admin/resources/${resource.id}`}
                        className="rounded-full border border-[#527A5A] px-5 py-2 text-center font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8]"
                      >
                        Edit
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-white p-6 text-[#636b63] shadow-sm">
                    No draft resources yet.
                  </div>
                )}
              </div>
            </div>

            {/* Published resources */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">
                  Published resources
                </h3>

                <span className="text-sm text-[#6b746b]">
                  {publishedResources.length}{" "}
                  {publishedResources.length === 1
                    ? "resource"
                    : "resources"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {publishedResources.length > 0 ? (
                  publishedResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#527A5A]">
                          Published
                        </p>

                        <h4 className="mt-1 text-xl font-bold">
                          {resource.title}
                        </h4>
                      </div>

                      <Link
                        href={`/admin/resources/${resource.id}`}
                        className="rounded-full border border-[#527A5A] px-5 py-2 text-center font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8]"
                      >
                        Edit
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-white p-6 text-[#636b63] shadow-sm">
                    No published resources yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
          
        </section>
      </div>
    </main>
  );
}