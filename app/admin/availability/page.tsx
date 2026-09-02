"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AvailabilityRule = {
  id: number;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityPage() {
  const router = useRouter();

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [onlineBufferMinutes, setOnlineBufferMinutes] = useState("15");
  const [inPersonBufferMinutes, setInPersonBufferMinutes] = useState("30");
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState("30");

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
      .from("availability_rules")
      .select("id, day_of_week, start_time, end_time, is_available")
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Could not load availability.");
      setLoading(false);
      return;
    }

    setRules(data || []);
    setLoading(false);

    const { data: settings, error: settingsError } = await supabase
  .from("booking_settings")
  .select("online_buffer_minutes, in_person_buffer_minutes, slot_interval_minutes")
  .limit(1)
  .single();

if (settingsError) {
  console.error(settingsError);
} else if (settings) {
  setOnlineBufferMinutes(String(settings.online_buffer_minutes));
  setInPersonBufferMinutes(String(settings.in_person_buffer_minutes));
  setSlotIntervalMinutes(String(settings.slot_interval_minutes));
}
  }

  function updateRule(
    id: number,
    field: keyof AvailabilityRule,
    value: string | boolean
  ) {
    setRules((current) =>
      current.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              [field]: value,
            }
          : rule
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const parsedOnlineBuffer = Number(onlineBufferMinutes);
const parsedInPersonBuffer = Number(inPersonBufferMinutes);
const parsedSlotInterval = Number(slotIntervalMinutes);

if (
  !Number.isInteger(parsedOnlineBuffer) ||
  parsedOnlineBuffer < 0 ||
  !Number.isInteger(parsedInPersonBuffer) ||
  parsedInPersonBuffer < 0 ||
  !Number.isInteger(parsedSlotInterval) ||
  parsedSlotInterval <= 0
) {
  setMessage("Please enter valid booking settings.");
  setSaving(false);
  return;
}

    for (const rule of rules) {
      if (
        rule.is_available &&
        (!rule.start_time || !rule.end_time)
      ) {
        setMessage(
          `Please choose a start and end time for ${days[rule.day_of_week]}.`
        );
        setSaving(false);
        return;
      }

      if (
        rule.is_available &&
        rule.start_time &&
        rule.end_time &&
        rule.end_time <= rule.start_time
      ) {
        setMessage(
          `The end time must be later than the start time for ${
            days[rule.day_of_week]
          }.`
        );
        setSaving(false);
        return;
      }
    }

    const updates = rules.map((rule) =>
      supabase
        .from("availability_rules")
        .update({
          is_available: rule.is_available,
          start_time: rule.is_available ? rule.start_time : null,
          end_time: rule.is_available ? rule.end_time : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rule.id)
    );

    const results = await Promise.all(updates);

    const failed = results.find((result) => result.error);

    if (failed?.error) {
      console.error(failed.error);
      setMessage("Something went wrong while saving availability.");
      setSaving(false);
      return;
    }

    const { error: settingsError } = await supabase
  .from("booking_settings")
  .update({
    online_buffer_minutes: parsedOnlineBuffer,
    in_person_buffer_minutes: parsedInPersonBuffer,
    slot_interval_minutes: parsedSlotInterval,
    updated_at: new Date().toISOString(),
  })
  .not("id", "is", null);

if (settingsError) {
  console.error(settingsError);
  setMessage(
    "Availability was saved, but the appointment buffers could not be saved."
  );
  setSaving(false);
  return;
}

    setMessage("Availability saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#E8F3E8] px-6 py-16">
        <p className="text-center text-[#527A5A]">
          Loading availability...
        </p>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-[#E8F3E8] px-6 py-12 text-[#2f2f2f]">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Bookings
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Weekly Availability
            </h1>

            <p className="mt-3 max-w-2xl text-[#636b63]">
              Set the times Anna is normally available for consultations each
              week.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-[#527A5A] px-5 py-3 text-center font-semibold text-[#527A5A] transition hover:bg-white"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Appointment buffers
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#636b63]">
            Choose how much time Anna should have between consultations.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Online consultations
              </label>

              <select
                value={onlineBufferMinutes}
                onChange={(e) => setOnlineBufferMinutes(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#527A5A]"
              >
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                In-person consultations
              </label>

              <select
                value={inPersonBufferMinutes}
                onChange={(e) => setInPersonBufferMinutes(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#527A5A]"
              >
                <option value="0">No buffer</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
          <div className="mt-6 max-w-sm">
            <label className="mb-2 block text-sm font-semibold">
              Appointment start times
            </label>

            <select
              value={slotIntervalMinutes}
              onChange={(e) => setSlotIntervalMinutes(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#527A5A]"
            >
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 60 minutes</option>
            </select>

            <p className="mt-2 text-sm leading-6 text-[#636b63]">
              Controls which start times customers can choose.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-3xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-32">
                  <p className="text-lg font-bold">
                    {days[rule.day_of_week]}
                  </p>

                  <label className="mt-2 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rule.is_available}
                      onChange={(e) =>
                        updateRule(
                          rule.id,
                          "is_available",
                          e.target.checked
                        )
                      }
                      className="h-5 w-5"
                    />

                    <span className="text-sm text-[#636b63]">
                      Available
                    </span>
                  </label>
                </div>

                {rule.is_available ? (
                  <div className="grid flex-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        From
                      </label>

                      <input
                        type="time"
                        value={rule.start_time?.slice(0, 5) || ""}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "start_time",
                            e.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Until
                      </label>

                      <input
                        type="time"
                        value={rule.end_time?.slice(0, 5) || ""}
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "end_time",
                            e.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[#527A5A]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 rounded-2xl bg-[#F7F8F5] px-4 py-3 text-[#777]">
                    Unavailable
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {message && (
          <p className="mt-6 rounded-2xl bg-white px-5 py-4 text-sm shadow-sm">
            {message}
          </p>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[#527A5A] px-7 py-4 font-semibold text-white transition hover:bg-[#45694D] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </div>
    </main>
  );
}