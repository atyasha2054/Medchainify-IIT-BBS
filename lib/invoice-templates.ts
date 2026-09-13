import { transporter } from "@/lib/mailer";

interface InvoiceData {
  invoiceNumber: string;
  transactionId: string;
  stripePaymentIntentId?: string;
  paymentDate: string;
  customerName: string;
  customerEmail: string;
  campaignName: string;
  campaignDate: string;
  campaignTime: string;
  campaignVenue: string;
  hostNgoName: string;
  amount: number;
  currency?: string;
  status: string;
}

/**
 * Generates a pure Black & White Monospace HTML invoice
 */
export function generateMonospaceInvoiceHtml(data: InvoiceData): string {
  const currencySymbol = data.currency === "INR" || !data.currency ? "INR " : `${data.currency} `;
  const formattedAmount = `${currencySymbol}${Number(data.amount).toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.4;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 2px solid #000000; padding: 24px;">
    
    <!-- HEADER BOX -->
    <pre style="margin: 0 0 16px 0; font-family: 'Courier New', Courier, monospace; font-weight: bold; text-align: center; border-bottom: 2px dashed #000000; padding-bottom: 12px;">
================================================================
           MEDCHAINIFY HEALTHCARE CAMPAIGN NETWORK             
                           
================================================================
    </pre>

    <!-- INVOICE METADATA -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
      <tr>
        <td style="padding: 4px 0; vertical-align: top; width: 50%;">
          <strong>INVOICE NO   :</strong> ${data.invoiceNumber}<br>
          <strong>DATE & TIME  :</strong> ${data.paymentDate}<br>
          <strong>PAYMENT MODE :</strong> STRIPE DIGITAL SECURE<br>
          <strong>PAY STATUS   :</strong> [ PAID - CONFIRMED ]
        </td>
        <td style="padding: 4px 0; vertical-align: top; width: 50%;">
          <strong>TRANSACTION ID:</strong><br>
          <span style="font-size: 11px; word-break: break-all;">${data.transactionId}</span><br>
          ${data.stripePaymentIntentId ? `<strong>GATEWAY REF   :</strong><br><span style="font-size: 11px; word-break: break-all;">${data.stripePaymentIntentId}</span>` : ""}
        </td>
      </tr>
    </table>

    <div style="border-top: 1px solid #000000; margin: 12px 0;"></div>

    <!-- BILLED TO & ORGANIZER -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
      <tr>
        <td style="padding: 4px 0; vertical-align: top; width: 50%;">
          <strong style="text-decoration: underline;">BILLED TO (ATTENDEE):</strong><br>
          NAME  : ${data.customerName}<br>
          EMAIL : ${data.customerEmail}
        </td>
        <td style="padding: 4px 0; vertical-align: top; width: 50%;">
          <strong style="text-decoration: underline;">ORGANIZING NGO / HOST:</strong><br>
          NAME  : ${data.hostNgoName || "MedChainify Verified NGO"}<br>
          EVENT : ${data.campaignName}
        </td>
      </tr>
    </table>

    <div style="border-top: 1px solid #000000; margin: 12px 0;"></div>

    <!-- EVENT DETAILS -->
    <div style="margin-bottom: 16px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
      <strong style="text-decoration: underline;">EVENT REGISTRATION PARTICULARS:</strong><br>
      • EVENT NAME  : ${data.campaignName}<br>
      • DATE        : ${data.campaignDate}<br>
      • TIME SLOT   : ${data.campaignTime}<br>
      • VENUE       : ${data.campaignVenue}
    </div>

    <!-- ITEMIZED TABLE -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 16px; font-family: 'Courier New', Courier, monospace; font-size: 12px;">
      <thead>
        <tr style="border-bottom: 1px solid #000000; background-color: #ffffff;">
          <th style="padding: 8px 6px; text-align: left; border-right: 1px solid #000000;">NO.</th>
          <th style="padding: 8px 6px; text-align: left; border-right: 1px solid #000000;">DESCRIPTION</th>
          <th style="padding: 8px 6px; text-align: center; border-right: 1px solid #000000;">QTY</th>
          <th style="padding: 8px 6px; text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #000000;">
          <td style="padding: 8px 6px; border-right: 1px solid #000000; vertical-align: top;">01</td>
          <td style="padding: 8px 6px; border-right: 1px solid #000000; vertical-align: top;">
            Healthcare Campaign Registration Pass<br>
            <span style="font-size: 11px;">Attendee: ${data.customerName}</span>
          </td>
          <td style="padding: 8px 6px; text-align: center; border-right: 1px solid #000000; vertical-align: top;">1</td>
          <td style="padding: 8px 6px; text-align: right; vertical-align: top;">${formattedAmount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000000;">
          <td colspan="3" style="padding: 6px; text-align: right; border-right: 1px solid #000000;">SUBTOTAL:</td>
          <td style="padding: 6px; text-align: right;">${formattedAmount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000000;">
          <td colspan="3" style="padding: 6px; text-align: right; border-right: 1px solid #000000;">TAXES & CONVENIENCE (0%):</td>
          <td style="padding: 6px; text-align: right;">${currencySymbol}0.00</td>
        </tr>
        <tr style="font-weight: bold;">
          <td colspan="3" style="padding: 8px 6px; text-align: right; border-right: 1px solid #000000;">TOTAL AMOUNT PAID:</td>
          <td style="padding: 8px 6px; text-align: right;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <!-- CANCELLATION & REFUND POLICY NOTICE -->
    <div style="margin-top: 14px; border: 1px dashed #000000; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.4;">
      <strong>IMPORTANT CANCELLATION & REFUND POLICY:</strong><br>
      • This pass is non-transferable and valid only for the registered attendee.<br>
      • IF YOU CANCEL YOUR REGISTRATION AFTER PAYMENT, NO REFUND WILL BE ISSUED.<br>
      • All registration fees paid are strictly non-refundable upon cancellation.
    </div>

    <!-- FOOTER / AUDIT TRAIL -->
    <pre style="margin: 16px 0 0 0; font-family: 'Courier New', Courier, monospace; font-size: 11px; text-align: center; border-top: 2px dashed #000000; padding-top: 12px;">
----------------------------------------------------------------
This is a computer-generated black-and-white electronic invoice.
Retain this receipt for admission and verification at the camp.
MedChainify • Decentralized Healthcare Infrastructure
----------------------------------------------------------------
    </pre>

  </div>
</body>
</html>
  `;
}

/**
 * Sends Registration Confirmation Email for Free or Waitlisted Registrations
 */
export async function sendRegistrationConfirmationEmail({
  registration,
  campaign,
  recipientEmail,
  recipientName,
}: {
  registration: any;
  campaign: any;
  recipientEmail: string;
  recipientName: string;
}) {
  try {
    const isWaitlist = registration.status === "waitlist";
    const statusTitle = isWaitlist
      ? `Registration Received - Waitlist Position #${registration.waitlistPosition}`
      : "Event Registration Confirmed!";

    const hostNgoName =
      typeof campaign.ngo === "object" && campaign.ngo?.name
        ? campaign.ngo.name
        : "Registered Healthcare NGO";

    const instructionsHtml =
      campaign.additionalInstructions && campaign.additionalInstructions.length > 0
        ? `
          <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 12px;">
              Important Instructions for Attendees:
            </p>
            <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px;">
              ${campaign.additionalInstructions.map((inst: string) => `<li style="margin-bottom: 5px;">${inst}</li>`).join("")}
            </ol>
          </div>
        `
        : "";

    const servicesHtml =
      campaign.services && campaign.services.length > 0
        ? `
          <div style="margin-top: 15px;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 12px;">
              Services & Facilities Available:
            </p>
            <p style="margin: 0; color: #334155; font-size: 13px;">
              ${campaign.services.join(" • ")}
            </p>
          </div>
        `
        : "";

    const mailOptions = {
      from: `"MedChainify Campaigns" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: isWaitlist
        ? `Waitlist Confirmation - ${campaign.name} (Position #${registration.waitlistPosition})`
        : `Registration Confirmed - ${campaign.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: ${isWaitlist ? "#b45309" : "#075985"}; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px;">${statusTitle}</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">${isWaitlist ? "Target capacity reached. You are on the priority waiting list." : "You are registered to attend this healthcare campaign."}</p>
          </div>

          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #0f172a; margin-top: 0;">Hello <strong>${recipientName}</strong>,</p>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              ${isWaitlist
          ? `Thank you for registering for <strong>${campaign.name}</strong>. The event is currently at maximum capacity, so you have been assigned <strong>Waitlist Position #${registration.waitlistPosition}</strong>. If a confirmed spot opens up due to a cancellation, you will be automatically promoted and notified immediately.`
          : `Your registration for <strong>${campaign.name}</strong> has been successfully confirmed. Below are the complete event details and schedule:`
        }
            </p>

            <!-- CAMPAIGN CARD -->
            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 16px;">${campaign.name}</h3>
              <p style="margin: 0 0 12px 0; color: #475569; font-style: italic; font-size: 13px;">${campaign.tagline}</p>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #1e293b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 120px;">Hosted By:</td>
                  <td style="padding: 4px 0;">${hostNgoName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Date:</td>
                  <td style="padding: 4px 0;">${campaign.startDate} to ${campaign.endDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Timings:</td>
                  <td style="padding: 4px 0;">${campaign.startTime} - ${campaign.endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; vertical-align: top;">Venue:</td>
                  <td style="padding: 4px 0;">${campaign.location?.address}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Entry Fee:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: ${campaign.feeType === "free" ? "#15803d" : "#075985"};">
                    ${campaign.feeType === "free" ? "Free Registration" : `₹${campaign.feeAmount}`}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Status:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: ${isWaitlist ? "#b45309" : "#15803d"};">
                    ${isWaitlist ? `WAITLIST (Position #${registration.waitlistPosition})` : "CONFIRMED"}
                  </td>
                </tr>
              </table>

              ${servicesHtml}
            </div>

            ${instructionsHtml}

            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/campaigns/${campaign._id}" style="display: inline-block; padding: 12px 24px; background-color: #075985; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px; text-transform: uppercase;">
                View Campaign on MedChainify
              </a>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">MedChainify Healthcare Platform • Decentralized Health Operations</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending registration confirmation email:", error);
  }
}

/**
 * Sends Monospace Black and White Invoice Email after Stripe Payment
 */
export async function sendPaidInvoiceEmail({
  registration,
  campaign,
  recipientEmail,
  recipientName,
  transactionId,
  invoiceNumber,
  stripePaymentIntentId,
  amount,
}: {
  registration: any;
  campaign: any;
  recipientEmail: string;
  recipientName: string;
  transactionId: string;
  invoiceNumber: string;
  stripePaymentIntentId?: string;
  amount: number;
}) {
  try {
    const hostNgoName =
      typeof campaign.ngo === "object" && campaign.ngo?.name
        ? campaign.ngo.name
        : "Healthcare NGO";

    const invoiceHtml = generateMonospaceInvoiceHtml({
      invoiceNumber,
      transactionId,
      stripePaymentIntentId,
      paymentDate: new Date().toUTCString(),
      customerName: recipientName,
      customerEmail: recipientEmail,
      campaignName: campaign.name,
      campaignDate: `${campaign.startDate} (${campaign.startTime} - ${campaign.endTime})`,
      campaignTime: `${campaign.startTime} - ${campaign.endTime}`,
      campaignVenue: campaign.location?.address || "Designated Campaign Venue",
      hostNgoName,
      amount,
      currency: "INR",
      status: "CONFIRMED",
    });

    const mailOptions = {
      from: `"MedChainify Billing" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Payment Invoice #${invoiceNumber} - ${campaign.name}`,
      html: invoiceHtml,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending paid invoice email:", error);
  }
}

/**
 * Sends notification when a waitlisted user is promoted to confirmed
 */
export async function sendWaitlistPromotionEmail({
  registration,
  campaign,
  recipientEmail,
  recipientName,
}: {
  registration: any;
  campaign: any;
  recipientEmail: string;
  recipientName: string;
}) {
  try {
    const mailOptions = {
      from: `"MedChainify Campaigns" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Good News! You are now Confirmed for ${campaign.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #15803d; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; text-transform: uppercase;">Spot Opened: Registration Confirmed!</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px;">You have been promoted from the waitlist to fully confirmed.</p>
          </div>

          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #0f172a; margin-top: 0;">Hello <strong>${recipientName}</strong>,</p>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">
              A spot has opened up for <strong>${campaign.name}</strong> due to a recent cancellation. Your registration status has been automatically updated to <strong>CONFIRMED</strong>!
            </p>

            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 16px;">${campaign.name}</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #1e293b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: bold; width: 100px;">Date:</td>
                  <td style="padding: 4px 0;">${campaign.startDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Timings:</td>
                  <td style="padding: 4px 0;">${campaign.startTime} - ${campaign.endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Venue:</td>
                  <td style="padding: 4px 0;">${campaign.location?.address}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: bold;">Status:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #15803d;">CONFIRMED</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 24px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/campaigns/${campaign._id}" style="display: inline-block; padding: 12px 24px; background-color: #075985; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px; text-transform: uppercase;">
                View Campaign Details
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending waitlist promotion email:", error);
  }
}
