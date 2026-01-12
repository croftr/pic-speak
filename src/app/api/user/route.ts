import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkIsAdmin } from '@/lib/admin';

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ userId: null, isAdmin: false });
    }

    const isAdmin = await checkIsAdmin();

    return NextResponse.json({ userId, isAdmin });
}
