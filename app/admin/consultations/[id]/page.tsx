"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Consultation = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_pence: number;
  location_type: string;
  is_active: boolean;
  sort_order: number;
};

export default function EditConsultationPage() {
  const router = useRouter();
  const params = useParams();

  const consultationId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [price, setPrice] = useState("");
  const [locationType, setLocationType] = useState("online");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/admin");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      router.push("/admin");
      return;
    }

    const { data, error } = await supabase
      .from("consultation_types")
      .select(
        "id, name, description, duration_minutes, price_pence, location_type, is_active, sort_order"
      )
      .eq("id", consultationId)
      .single();

    if (error || !data) {
      console.error(error);
      setMessage("Consultation not found.");
      setLoading(false);
      return;
    }

    const consultation = data as Consultation;

    setName(consultation.name);
    setDescription(consultation.description || "");
    setDurationMinutes(String(consultation.duration_minutes));
    setPrice((consultation.price_pence / 100).toFixed(2));
    setLocationType(consultation.location_type);
    setIsActive(consultation.is_active);
    setSortOrder(String(consultation.sort_order));

    setLoading(false);
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const trimmedName = name.trim();
    const parsedDuration = Number(durationMinutes);
    const parsedPrice = Number(price);
    const parsedSortOrder = Number(sortOrder);

    if (!trimmedName) {
      setMessage("Please enter a consultation name.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      setMessage("Please enter a valid duration.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setMessage("Please enter a valid price.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("consultation_types")
      .update({
        name: trimmedName,
        slug: createSlug(trimmedName),
        description: description.trim() || null,
        duration_minutes: parsedDuration,
        price_pence: Math.round(parsedPrice * 100),
        location_type: locationType,
        is_active: isActive,
        sort_order:
          Number.isFinite(parsedSortOrder) && parsedSortOrder >= 0
            ? parsedSortOrder
            : 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        setMessage(
          "A consultation with this name already exists. Please use a different name."
        );
      } else {
        setMessage("Something went wrong while saving your changes.");
      }

      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const { error } = await supabase
      .from("consultation_types")
      .delete()
      .eq("id", consultationId);

    if (error) {
      console.error(error);

      if (error.code === "23503") {
        setMessage(
          "This consultation has bookings attached to it, so it can't be deleted. Make it inactive instead."
        );
      } else {
        setMessage("Something went wrong while deleting the consultation.");
      }

      setDeleting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading consultation...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Consultations
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Edit Consultation
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-[#527A5A] px-5 py-3 text-center font-semibold text-[#527A5A] transition hover:bg-white"
          >
            Back to dashboard
          </Link>
        </div>

        {message === "Consultation not found." ? (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
            <p>{message}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6 rounded-3xl bg-white p-8 shadow-sm"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold"
              >
                Consultation name
              </label>

              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold"
              >
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-semibold"
                >
                  Duration
                </label>

                <select
                  id="duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#527A5A]"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-semibold"
                >
                  Price (£)
                </label>

                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="locationType"
                className="mb-2 block text-sm font-semibold"
              >
                Consultation type
              </label>

              <select
                id="locationType"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#527A5A]"
              >
                <option value="online">Online</option>
                <option value="in_person">In person</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sortOrder"
                className="mb-2 block text-sm font-semibold"
              >
                Display order
              </label>

              <input
                id="sortOrder"
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
              />

              <p className="mt-2 text-sm text-[#6b746b]">
                Lower numbers appear first on the booking page.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5"
              />

              <span>
                <span className="block font-semibold">Active</span>
                <span className="text-sm text-[#6b746b]">
                  Inactive consultations won't be available for new bookings.
                </span>
              </span>
            </label>

            {message && (
              <p className="rounded-2xl bg-[#F4DDD2] px-4 py-3 text-sm">
                {message}
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <Link
                  href="/admin"
                  className="rounded-full border border-black/10 px-6 py-3 text-center font-semibold transition hover:bg-[#E8F3E8]"
                >
                  Cancel
                </Link>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="rounded-full border border-red-300 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Consultation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}