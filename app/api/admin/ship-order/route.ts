import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, trackingNumber, customerName } = await req.json();

  if (!email || !trackingNumber) {
    return NextResponse.json({ error: "Email and tracking number required" }, { status: 400 });
  }

  const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  const firstName = customerName ? customerName.split(" ")[0] : "there";

  await resend.emails.send({
    from: "FinalPing <noreply@finalpingapp.com>",
    to: email,
    subject: "Your FinalPing order has shipped!",
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0b0b0b;color:#fff;border-radius:12px;">
      <div style="font-size:22px;font-weight:700;margin-bottom:4px;">FinalPing</div>
      <div style="font-size:13px;color:#bdbdbd;margin-bottom:28px;">Aircraft Alerts</div>
      <p style="font-size:15px;font-weight:700;margin-bottom:4px;">Your order is on its way!</p>
      <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">Hey ${firstName}, your ground station hardware has shipped via USPS.</p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:18px;margin-bottom:20px;text-align:center;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#666;margin-bottom:8px;">Tracking Number</div>
        <div style="font-size:18px;font-weight:900;letter-spacing:0.06em;color:#f5b400;margin-bottom:12px;">${trackingNumber}</div>
        <a href="${trackingUrl}" style="display:inline-block;padding:10px 22px;background:#f5b400;color:#000;font-weight:700;border-radius:999px;text-decoration:none;font-size:13px;">Track Package →</a>
      </div>
      <p style="font-size:13px;color:#bdbdbd;margin-bottom:20px;">While you wait, check out the setup guide so you're ready to plug in and go the moment it arrives.</p>
      <a href="https://finalpingapp.com/groundstationsetup" style="display:inline-block;padding:12px 24px;background:transparent;color:#f5b400;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px;border:1px solid #f5b400;">View Setup Guide →</a>
      <p style="font-size:12px;color:#555;margin-top:28px;">Questions? Reply to this email or visit <a href="https://finalpingapp.com/contact" style="color:#f5b400;">finalpingapp.com/contact</a></p>
    </div>`,
  });

  return NextResponse.json({ success: true });
}
