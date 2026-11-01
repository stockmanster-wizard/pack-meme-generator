/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SendMemeEmailParams {
  accessToken: string;
  toRecipients: string[];
  ccRecipient?: string;
  bccRecipients?: string[];
  subject: string;
  rawBase64Png: string;
  templateTitle?: string;
  isDebraCare?: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

function chunkBase64(base64: string, lineLength: number = 76): string {
  const chunks = base64.match(new RegExp(`.{1,${lineLength}}`, 'g'));
  return chunks ? chunks.join('\r\n') : base64;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendPackMemeEmail(params: SendMemeEmailParams): Promise<SendResult> {
  const boundary = `----=_Part_PackMeme_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const contentId = 'pack_meme_cid_1';

  const toHeader = params.toRecipients.filter(Boolean).join(', ');
  const ccHeader = params.ccRecipient ? params.ccRecipient.trim() : '';
  const bccHeader = params.bccRecipients ? params.bccRecipients.map((e) => e.trim()).filter(Boolean).join(', ') : '';

  if (!toHeader) {
    throw new Error('No recipient email addresses provided.');
  }

  // HTML email body with embedded inline image referencing Content-ID
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(params.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0e14; color:#f8fafc; font-family:'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0e14; padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:640px; background-color:#161b22; border:2px solid ${params.isDebraCare ? '#ec4899' : '#ea580c'}; border-radius:12px; overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#0f141c; padding:20px 24px; border-bottom:2px solid ${params.isDebraCare ? '#ec4899' : '#ea580c'}; text-align:center;">
              <h1 style="margin:0; color:${params.isDebraCare ? '#f472b6' : '#f97316'}; font-size:24px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; font-family:Impact, 'Arial Black', sans-serif;">
                ${params.isDebraCare ? '♥ THE PACK: DEBRA HEALTH BULLETIN ♥' : '⚡ THE PACK: OFFICIAL DISPATCH ⚡'}
              </h1>
              <p style="margin:6px 0 0; color:#94a3b8; font-size:13px; font-weight:600; letter-spacing:0.5px;">
                ${params.isDebraCare ? 'FAMILY COMES FIRST AROOOOO!' : 'BEAMED DIRECTLY FROM THE HOG CRANKIN INNER SANCTUM'}
              </p>
            </td>
          </tr>

          <!-- Embedded Inline Meme Image -->
          <tr>
            <td align="center" style="padding:24px 20px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; width:100%;">
                <tr>
                  <td align="center">
                    <img 
                      src="cid:${contentId}" 
                      alt="The Pack Badass Daily Meme" 
                      width="580" 
                      style="width:100%; max-width:580px; height:auto; display:block; border-radius:8px; border:3px solid ${params.isDebraCare ? '#ec4899' : '#ea580c'};"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f141c; padding:14px 24px; text-align:center; border-top:1px solid #2d3748;">
              <p style="margin:0; color:#f1f5f9; font-size:16px; font-weight:bold; font-family:Impact, sans-serif; letter-spacing:1px;">
                AROOOOOOOOOOOO!
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Assemble RFC 2822 multipart/related raw message
  let mimeMessage = '';
  mimeMessage += `To: ${toHeader}\r\n`;
  if (ccHeader) {
    mimeMessage += `Cc: ${ccHeader}\r\n`;
  }
  if (bccHeader) {
    mimeMessage += `Bcc: ${bccHeader}\r\n`;
  }
  mimeMessage += `Subject: ${params.subject}\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;
  mimeMessage += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;

  // HTML Body Part
  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n`;
  mimeMessage += `Content-Transfer-Encoding: 8bit\r\n\r\n`;
  mimeMessage += `${htmlBody}\r\n\r\n`;

  // Inline Image Part with Content-ID
  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: image/png; name="pack_meme.png"\r\n`;
  mimeMessage += `Content-Transfer-Encoding: base64\r\n`;
  mimeMessage += `Content-ID: <${contentId}>\r\n`;
  mimeMessage += `Content-Disposition: inline; filename="pack_meme.png"\r\n\r\n`;
  mimeMessage += `${chunkBase64(params.rawBase64Png)}\r\n\r\n`;

  // End Boundary
  mimeMessage += `--${boundary}--\r\n`;

  const base64UrlPayload = base64UrlEncode(mimeMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlPayload,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gmail API send failed: ${message}`);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    threadId: result.threadId,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
