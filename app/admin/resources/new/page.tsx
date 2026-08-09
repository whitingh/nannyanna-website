"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FeaturedImageUpload from "@/components/FeaturedImageUpload";
import ResourceFileUpload from "@/components/ResourceFileUpload";

export default function NewResourcePage() {
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [externalUrl, setExternalUrl] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCheckingAdmin(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      setCheckingAdmin(false);
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

  async function saveResource(status: "draft" | "published") {
    if (!title.trim()) {
      setMessage("Please add a resource title.");
      return;
    }

    if (resourceType === "download" && !fileUrl) {
      setMessage("Please upload a downloadable file.");
      return;
    }

    if (
      ["link", "product", "guide"].includes(resourceType) &&
      !externalUrl.trim()
    ) {
      setMessage("Please add the resource link.");
      return;
    }

    setSaving(true);
    setMessage("");

    const slug = createSlug(title);

    const { error } = await supabase.from("resources").insert({
      title: title.trim(),
      slug,
      description: description.trim() || null,
      category: category || null,
      age_group: ageGroup || null,
      resource_type: resourceType,
      image_url: featuredImage || null,
      external_url: externalUrl.trim() || null,
      file_url: fileUrl || null,
      status,
      access_level: "free",
      published_at:
        status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setMessage(
          "A resource with this URL already exists. Try changing the title slightly."
        );
      } else {
        setMessage("Something went wrong while saving the resource.");
      }

      setSaving(false);
      return;
    }

    setMessage(
      status === "published"
        ? "Resource published successfully!"
        : "Draft saved successfully!"
    );

    setSaving(false);

    setTimeout(() => {
      router.push("/admin");
    }, 700);
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
            resources.
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
        <Link
          href="/admin"
          className="font-semibold text-[#527A5A] hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-bold md:text-5xl">
            New Resource
          </h1>

          <p className="mt-3 text-[#636b63]">
            Add a useful product, guide, download or website to NannyAnna.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10">
          <div className="space-y-7">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block font-semibold"
              >
                Resource title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Recommended baby monitor"
                className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              />

              {title && (
                <p className="mt-2 text-sm text-[#7a827a]">
                  Resource URL: /resources/{createSlug(title)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block font-semibold"
              >
                Short description
              </label>

              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description shown on the Resources page..."
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block font-semibold"
                >
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
                >
                  <option value="">Choose a category</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Feeding">Feeding</option>
                  <option value="Play">Play</option>
                  <option value="Development">Development</option>
                  <option value="Safety">Safety</option>
                  <option value="Travel">Travel</option>
                  <option value="Parenting">Parenting</option>
                  <option value="Childcare">Childcare</option>
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
              <label
                htmlFor="resourceType"
                className="mb-2 block font-semibold"
              >
                Resource type
              </label>

              <select
                id="resourceType"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              >
                <option value="link">Useful website / link</option>
                <option value="product">Recommended product</option>
                <option value="guide">Guide</option>
                <option value="download">Download</option>
              </select>
            </div>

            {resourceType !== "download" && (
              <div>
                <label
                  htmlFor="externalUrl"
                  className="mb-2 block font-semibold"
                >
                  Link
                </label>

                <input
                  id="externalUrl"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
                />
              </div>
            )}

            {resourceType === "download" && (
              <ResourceFileUpload
                value={fileUrl}
                onChange={setFileUrl}
              />
            )}

            <FeaturedImageUpload
              value={featuredImage}
              onChange={setFeaturedImage}
            />
          </div>

          {message && (
            <div className="mt-7 rounded-2xl bg-[#E8F3E8] p-4 text-center font-medium text-[#3E6848]">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveResource("draft")}
              className="rounded-full border border-[#527A5A] px-6 py-3 font-semibold text-[#527A5A] transition hover:bg-[#E8F3E8] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveResource("published")}
              className="rounded-full bg-[#527A5A] px-7 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Publish Resource"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}