/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OAuth2Client } from 'google-auth-library';
import nodemailer, { SendMailOptions } from 'nodemailer';

export interface ServerSendMemeEmailParams {
  accessToken?: string;
  toRecipients: string[];
  ccRecipient?: string;
  bccRecipients?: string[];
  subject: string;
  rawBase64Png: string;
  isDebraCare?: boolean;
}

export interface ServerSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

let cachedBrowserAccessToken: string | null = null;

export function setServerCachedAccessToken(token: string | null): void {
  if (token && token.trim()) {
    cachedBrowserAccessToken = token.trim();
  }
}

export function getServerCachedAccessToken(): string | null {
  return cachedBrowserAccessToken;
}

export function isServerEmailConfigured(): boolean {
  if (process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim()) {
    return true;
  }
  if (
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  ) {
    return true;
  }
  return Boolean(cachedBrowserAccessToken);
}

async function resolveGmailAccessToken(explicitToken?: string): Promise<string> {
  if (explicitToken && explicitToken.trim()) {
    return explicitToken.trim();
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new OAuth2Client(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const tokenResponse = await oauth2Client.getAccessToken();
    if (tokenResponse.token) {
      return tokenResponse.token;
    }
  }

  if (cachedBrowserAccessToken) {
    return cachedBrowserAccessToken;
  }

  throw new Error(
    'No Gmail OAuth2 credentials available. Configure GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN on the server, or sign in with Google in the browser to sync an active session token.'
  );
}

function chunkBase64(base64: string, lineLength: number = 76): string {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '');
  const chunks = clean.match(new RegExp(`.{1,${lineLength}}`, 'g'));
  return chunks ? chunks.join('\r\n') : clean;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendServerPackMemeEmail(
  params: ServerSendMemeEmailParams
): Promise<ServerSendResult> {
  const contentId = 'pack_meme_cid_1';
  const toList = params.toRecipients.filter(Boolean);
  const ccHeader = params.ccRecipient ? params.ccRecipient.trim() : '';
  const bccList = params.bccRecipients
    ? params.bccRecipients.map((e) => e.trim()).filter(Boolean)
    : [];

  if (toList.length === 0) {
    throw new Error('No recipient email addresses provided.');
  }

  const cleanBase64 = params.rawBase64Png.replace(/^data:image\/\w+;base64,/, '');

  // Identical RFC 2822 multipart/related HTML email body with inline CID image
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

  // PATH 1: Send via Nodemailer using Gmail App Password (if configured)
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const gmailUser = process.env.GMAIL_USER?.trim() || toList[0];

  if (appPassword) {
    const cleanAppPassword = appPassword.replace(/\s+/g, '');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: cleanAppPassword,
      },
    });

    const isJpeg = cleanBase64.startsWith('/9j/') || params.rawBase64Png.includes('image/jpeg');
    const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
    const filename = isJpeg ? 'pack_meme.jpg' : 'pack_meme.png';

    const mailOptions: SendMailOptions = {
      from: `"The Pack Meme Blaster" <${gmailUser}>`,
      to: toList,
      cc: ccHeader || undefined,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject: params.subject,
      html: htmlBody,
      attachments: [
        {
          filename,
          content: Buffer.from(cleanBase64, 'base64'),
          cid: contentId,
          contentType: mimeType,
          contentDisposition: 'inline',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  }

  // PATH 2: Fall back to Google OAuth2 API
  const accessToken = await resolveGmailAccessToken(params.accessToken);
  const boundary = `----=_Part_PackMeme_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  let mimeMessage = '';
  mimeMessage += `To: ${toList.join(', ')}\r\n`;
  if (ccHeader) {
    mimeMessage += `Cc: ${ccHeader}\r\n`;
  }
  if (bccList.length > 0) {
    mimeMessage += `Bcc: ${bccList.join(', ')}\r\n`;
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
  mimeMessage += `${chunkBase64(cleanBase64)}\r\n\r\n`;

  // End Boundary
  mimeMessage += `--${boundary}--\r\n`;

  const base64UrlPayload = base64UrlEncode(mimeMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlPayload,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Server Gmail API send failed: ${message}`);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    threadId: result.threadId,
  };
}
