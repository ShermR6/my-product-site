import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from "resend";
import * as React from "react";
import { ShippingNotification } from "@/emails/ShippingNotification";

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

  const firstName = customerName ? customerName.split(" ")[0] : "there";

  await resend.emails.send({
    from: "FinalPing <noreply@finalpingapp.com>",
    to: email,
    subject: "Your FinalPing order has shipped!",
    react: React.createElement(ShippingNotification, { firstName, trackingNumber }),
  });

  return NextResponse.json({ success: true });
}
