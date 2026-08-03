const { getTransporter } = require('../config/email');

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'B2B Task Tracker';

const sendMail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[email] Skipped — EMAIL_USER / EMAIL_APP_PASSWORD not configured');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('[email] Send failed:', error.message);
  }
};

const sendReportSubmittedEmail = async ({ to, recipientName, rmName, reportDate, totalTasksCount }) => {
  const dateStr = new Date(reportDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  await sendMail({
    to,
    subject: `Daily Report Submitted — ${rmName} (${dateStr})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #2563eb; margin-bottom: 4px;">New Daily Report Submitted</h2>
        <p style="color: #6b7280; margin-top: 0;">Hi ${recipientName || ''},</p>
        <p><strong>${rmName}</strong> just submitted their daily report for <strong>${dateStr}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Total Applications</td>
            <td style="padding: 8px 0; font-weight: bold;">${totalTasksCount ?? 0}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 13px;">Log in to the B2B Task Tracker to view the full report.</p>
      </div>
    `,
  });
};

module.exports = { sendMail, sendReportSubmittedEmail };
