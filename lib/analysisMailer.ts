import { transporter } from "@/lib/mailer";

export interface AnalysisEmailOptions {
  toEmail: string;
  userName?: string;
  actionTitle: string;
  actionDescription: string;
  summaryHighlights: { label: string; value: string | number }[];
  detailHtml: string;
}

export async function sendInstantAnalysisEmail(options: AnalysisEmailOptions) {
  try {
    if (!options.toEmail || !options.toEmail.includes("@")) {
      console.warn("[AnalysisMailer] Skipping email: invalid recipient", options.toEmail);
      return;
    }

    const {
      toEmail,
      userName = "Valued User",
      actionTitle,
      actionDescription,
      summaryHighlights,
      detailHtml,
    } = options;

    const highlightsHtml = summaryHighlights
      .map(
        (h) => `
        <td style="padding: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">${h.label}</div>
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 4px;">${h.value}</div>
        </td>`
      )
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${actionTitle}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 2px solid #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background: #0369a1; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">MedChainify</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 500; opacity: 0.9;">Unified Clinical Vault & Automated Health Intelligence</p>
          </td>
        </tr>

        <!-- Action Banner -->
        <tr>
          <td style="padding: 20px 24px 10px 24px;">
            <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
              ⚡ Instant Action Performed: ${actionTitle}
            </div>
            <h2 style="margin: 12px 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a;">Hello, ${userName}</h2>
            <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">${actionDescription}</p>
          </td>
        </tr>

        <!-- Summary Highlights Grid -->
        ${
          summaryHighlights && summaryHighlights.length > 0
            ? `
        <tr>
          <td style="padding: 10px 24px 20px 24px;">
            <table width="100%" border="0" cellspacing="8" cellpadding="0">
              <tr>${highlightsHtml}</tr>
            </table>
          </td>
        </tr>`
            : ""
        }

        <!-- Detailed Breakdown -->
        <tr>
          <td style="padding: 0 24px 24px 24px;">
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
              <h3 style="margin-top: 0; color: #0f172a; border-b: 2px solid #e2e8f0; pb: 8px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Detailed Analysis & Action Results</h3>
              ${detailHtml}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0; font-weight: 600;">🔒 MedChainify Confidential Medical Intelligence</p>
            <p style="margin: 0;">This email was automatically generated and sent to <strong>${toEmail}</strong> immediately upon action generation.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"MedChainify Health Dispatch" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `[MedChainify] ${actionTitle} - Full Analysis & Action Details`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("[AnalysisMailer] Error dispatching instant analysis email:", error);
  }
}
