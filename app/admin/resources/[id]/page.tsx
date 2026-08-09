"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FeaturedImageUpload from "@/components/FeaturedImageUpload";
import ResourceFileUpload from "@/components/ResourceFileUpload";

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
  status: "draft" | "published";
  access_level: string;
  published_at: string | null;
};

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();

  const resourceId = Number(params.id);

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingResource, setLoadingResource] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [resourceType, setResourceType] = useState("link");
  const [externalUrl, setExternalUrl] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    checkAdminAndLoadResource();
  }, []);

  async function checkAdminAndLoadResource() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCheckingAdmin(false);
      setLoadingResource(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      setCheckingAdmin(false);
      setLoadingResource(false);
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);

    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select(
        "id, title, slug, description, category, age_group, resource_type, image_url, external_url, file_url, status, access_level, published_at"
      )
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      setMessage("Resource not found.");
      setLoadingResource(false);
      return;
    }

    const typedResource = resource as Resource;

    setTitle(typedResource.title);
    setDescription(typedResource.description || "");
    setCategory(typedResource.category || "");
    setAgeGroup(typedResource.age_group || "");
    setResourceType(typedResource.resource_type);
    setExternalUrl(typedResource.external_url || "");
    setFileUrl(typedResource.file_url || "");
    setFeaturedImage(typedResource.image_url || "");
    setStatus(typedResource.status);

    setLoadingResource(false);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function saveResource(newStatus: "draft" | "published") {
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

    const updateData = {
      title: title.trim(),
      slug,
      description: description.trim() || null,
      category: category || null,
      age_group: ageGroup || null,
      resource_type: resourceType,
      image_url: featuredImage || null,
      external_url: externalUrl.trim() || null,
      file_url: fileUrl || null,
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
      .from("resources")
      .update(updateData)
      .eq("id", resourceId);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setMessage(
          "Another resource already uses this URL. Try changing the title slightly."
        );
      } else {
        setMessage("Something went wrong while saving the resource.");
      }

      setSaving(false);
      return;
    }

    setStatus(newStatus);

    setMessage(
      newStatus === "published"
        ? "Resource published successfully."
        : "Resource saved as a draft."
    );

    setSaving(false);
  }

  async function deleteResource() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this resource?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("");

    if (featuredImage) {
      const marker = "/storage/v1/object/public/article-images/";

      if (featuredImage.includes(marker)) {
        const filePath = decodeURIComponent(
          featuredImage.split(marker)[1]
        );

        const { error: storageError } = await supabase.storage
          .from("article-images")
          .remove([filePath]);

        if (storageError) {
          console.error(storageError);
        }
      }
    }

    if (fileUrl) {
      const fileMarker =
        "/storage/v1/object/public/resource-files/";

      if (fileUrl.includes(fileMarker)) {
        const filePath = decodeURIComponent(
          fileUrl.split(fileMarker)[1]
        );

        const { error: fileStorageError } = await supabase.storage
          .from("resource-files")
          .remove([filePath]);

        if (fileStorageError) {
          console.error(fileStorageError);
        }
      }
    }

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (error) {
      console.error(error);
      setMessage("Something went wrong while deleting the resource.");
      setDeleting(false);
      return;
    }

    router.push("/admin");
  }

  if (checkingAdmin || loadingResource) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading resource...
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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Admin
            </p>

            <h1 className="mt-2 text-4xl font-bold md:text-5xl">
              Edit Resource
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

        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10">
          <div className="space-y-7">
            <div>
              <label className="mb-2 block font-semibold">
                Resource title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div>
              <label className="mb-2 block font-semibold">
                Short description
              </label>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3"
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

              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3"
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
              <label className="mb-2 block font-semibold">
                Resource type
              </label>

              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3"
              >
                <option value="link">Useful website / link</option>
                <option value="product">Recommended product</option>
                <option value="guide">Guide</option>
                <option value="download">Download</option>
              </select>
            </div>

            {resourceType !== "download" && (
              <div>
                <label className="mb-2 block font-semibold">
                  Link
                </label>

                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3"
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

          <div className="mt-8 flex flex-col gap-3 border-t border-black/10 pt-8 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveResource("draft")}
              className="rounded-full border border-[#527A5A] px-6 py-3 font-semibold text-[#527A5A]"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveResource("published")}
              className="rounded-full bg-[#527A5A] px-7 py-3 font-semibold text-white disabled:opacity-50"
            >
              Publish Resource
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={deleteResource}
              className="rounded-full border border-red-300 px-6 py-3 font-semibold text-red-700 sm:ml-auto"
            >
              {deleting ? "Deleting..." : "Delete Resource"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}