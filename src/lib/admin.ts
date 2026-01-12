import { currentUser } from '@clerk/nextjs/server';

export async function checkIsAdmin() {
    const user = await currentUser();
    if (!user) return false;

    const adminId = process.env.ADMIN_USERNAME;
    if (!adminId) return false;

    // Check username
    if (user.username === adminId) return true;

    // Check primary email or all emails
    const emails = user.emailAddresses.map(e => e.emailAddress);
    if (emails.includes(adminId)) return true;

    return false;
}
