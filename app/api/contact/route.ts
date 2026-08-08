import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please complete all fields." },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "NannyAnna Website <hello@nannyanna.co.uk>",
      to: ["hello@nannyanna.co.uk"],
      replyTo: email,
      subject: `New NannyAnna enquiry from ${name}`,
      text: `
New enquiry through nannyanna.co.uk

Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Something went wrong sending your message." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong sending your message." },
      { status: 500 }
    );
  }
}