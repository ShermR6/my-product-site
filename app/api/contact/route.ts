import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required." },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "SkyPing Contact Form <support@skyping.xyz>",
      to: "andrew.p.sherman21@gmail.com",
      replyTo: email,
      subject: `[SkyPing] New message from ${name || "Anonymous"}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#111;">New Contact Form Submission</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;width:80px;vertical-align:top;">Name</td>
              <td style="padding:8px 12px;color:#111;">${name || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Email</td>
              <td style="padding:8px 12px;color:#111;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:600;color:#374151;vertical-align:top;">Message</td>
              <td style="padding:8px 12px;color:#111;white-space:pre-wrap;">${message}</td>
            </tr>
          </table>
          <div style="margin-top:20px;font-size:12px;color:#9ca3af;">Sent from the SkyPing contact form at skyping.xyz</div>
        </div>
      `,
    });

    // Send confirmation to the customer
    await resend.emails.send({
      from: "SkyPing <support@skyping.xyz>",
      to: email,
      subject: "We received your message — SkyPing",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">SkyPing</div>
          <div style="font-size:14px;color:#bdbdbd;margin-bottom:24px;">Real-time aircraft tracking</div>
          <p style="font-size:15px;margin-bottom:16px;">Hi${name ? ` ${name}` : ""},</p>
          <p style="font-size:15px;margin-bottom:16px;">Thanks for reaching out! We received your message and will get back to you within 1 business day.</p>
          <p style="font-size:13px;color:#999;margin-top:24px;">— The SkyPing Team</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
