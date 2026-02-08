import { currentUser } from '@clerk/nextjs/server';

const HARDCODED_ADMIN_EMAILS = [
    'angelajanecroft@gmail.com',
];

function getAdminEmails(): string[] {
    const envAdmins = process.env.ADMIN_EMAILS;
    const envList = envAdmins
        ? envAdmins.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
        : [];
    return [...HARDCODED_ADMIN_EMAILS, ...envList];
}

export async function isAdmin(): Promise<boolean> {
    const user = await currentUser();
    if (!user) return false;

    const adminEmails = getAdminEmails();
    const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());

    return userEmails.some(email => adminEmails.includes(email));
}

/** @deprecated Use isAdmin() instead */
export const checkIsAdmin = isAdmin;
