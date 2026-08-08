"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError(
        "Sorry, your message couldn't be sent. Please try again or email Anna directly."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#E8F3E8] text-[#2f2f2f]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-start">

          {/* Intro */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#527A5A]">
              Contact
            </p>

            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
              Get in touch
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#5f675f]">
              Have a childcare question, want to know more about NannyAnna, or
              interested in one-to-one support? Feel free to get in touch.
            </p>

            <div className="mt-10 rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#527A5A]">
                Email
              </p>

              <a
                href="mailto:hello@nannyanna.co.uk"
                className="mt-2 block text-xl font-semibold hover:underline"
              >
                hello@nannyanna.co.uk
              </a>

              <p className="mt-4 leading-7 text-[#636b63]">
                Anna will aim to reply as soon as possible.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="rounded-3xl bg-white p-7 shadow-sm md:p-9">
            <h2 className="text-2xl font-bold">Send a message</h2>

            <p className="mt-2 text-[#636b63]">
              Fill in the form below and your message will be sent directly to
              Anna.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none transition focus:border-[#527A5A]"
                />
              </div>

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
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none transition focus:border-[#527A5A]"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can Anna help?"
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#FAFCFA] px-4 py-3 outline-none transition focus:border-[#527A5A]"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-[#527A5A] px-6 py-3 font-semibold text-white transition hover:bg-[#45694D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send message"}
              </button>

              {success && (
                <div className="rounded-2xl bg-[#E8F3E8] p-4 text-center font-medium text-[#3E6848]">
                  Thanks! Your message has been sent to Anna.
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-center text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}