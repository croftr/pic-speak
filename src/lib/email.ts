import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Initialize Resend client (will be null if API key not configured)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Get the from email address, fallback to a default
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'My Voice Board <notifications@myvoiceboard.com>';

// Get the app URL for links in emails
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myvoiceboard.com';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
    const log = logger.withContext({ to: options.to, subject: options.subject });

    if (!resend) {
        log.debug('Resend not configured, skipping email send');
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            log.error('Failed to send email', error);
            return false;
        }

        log.info('Email sent successfully');
        return true;
    } catch (error) {
        log.error('Error sending email', error);
        return false;
    }
}

// Email template wrapper
function emailWrapper(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Voice Board</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">My Voice Board</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">PECS Board Builder</p>
    </div>
    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
        ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>You're receiving this because you have a public board on My Voice Board.</p>
        <p>To stop receiving these notifications, edit your board settings.</p>
    </div>
</body>
</html>
    `;
}

// Send notification when someone likes a board
export async function sendLikeNotification(
    ownerEmail: string,
    boardName: string,
    boardId: string,
    likerName: string,
    totalLikes: number
): Promise<boolean> {
    const boardUrl = `${APP_URL}/board/${boardId}`;

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">❤️</div>
            <h2 style="margin: 0; color: #1f2937;">Someone liked your board!</h2>
        </div>

        <p style="font-size: 16px; color: #4b5563;">
            <strong>${likerName}</strong> just liked your board <strong>"${boardName}"</strong>
        </p>

        <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Total likes</p>
            <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #ef4444;">${totalLikes}</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <a href="${boardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Your Board
            </a>
        </div>
    `;

    return sendEmail({
        to: ownerEmail,
        subject: `❤️ ${likerName} liked your board "${boardName}"`,
        html: emailWrapper(content),
    });
}

// Send notification when someone comments on a board
export async function sendCommentNotification(
    ownerEmail: string,
    boardName: string,
    boardId: string,
    commenterName: string,
    commentPreview: string,
    totalComments: number
): Promise<boolean> {
    const boardUrl = `${APP_URL}/board/${boardId}`;

    // Truncate comment preview if too long
    const truncatedComment = commentPreview.length > 150
        ? commentPreview.slice(0, 150) + '...'
        : commentPreview;

    const content = `
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
            <h2 style="margin: 0; color: #1f2937;">New comment on your board!</h2>
        </div>

        <p style="font-size: 16px; color: #4b5563;">
            <strong>${commenterName}</strong> commented on your board <strong>"${boardName}"</strong>
        </p>

        <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #4b5563; font-style: italic; font-size: 15px;">
                "${truncatedComment}"
            </p>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                Your board now has <strong>${totalComments} comment${totalComments !== 1 ? 's' : ''}</strong>
            </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <a href="${boardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Comment
            </a>
        </div>
    `;

    return sendEmail({
        to: ownerEmail,
        subject: `💬 ${commenterName} commented on "${boardName}"`,
        html: emailWrapper(content),
    });
}

// Check if email sending is available
export function isEmailConfigured(): boolean {
    return !!resend;
}
