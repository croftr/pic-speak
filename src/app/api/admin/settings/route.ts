import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAppSettings, updateAppSetting } from '@/lib/storage';

const ALLOWED_SETTINGS: Record<string, { label: string; type: 'number'; min: number; max: number }> = {
    max_boards_per_user: { label: 'Max boards per user', type: 'number', min: 1, max: 1000 },
    max_cards_per_board: { label: 'Max cards per board', type: 'number', min: 1, max: 10000 },
};

export async function GET() {
    if (!(await isAdmin())) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    const settings = await getAppSettings();
    return NextResponse.json({ settings, schema: ALLOWED_SETTINGS });
}

export async function PUT(request: Request) {
    if (!(await isAdmin())) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined || value === null) {
            return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
        }

        const schema = ALLOWED_SETTINGS[key];
        if (!schema) {
            return NextResponse.json({ error: `Unknown setting: ${key}` }, { status: 400 });
        }

        const numValue = Number(value);
        if (schema.type === 'number') {
            if (isNaN(numValue) || !Number.isInteger(numValue)) {
                return NextResponse.json({ error: `${schema.label} must be a whole number` }, { status: 400 });
            }
            if (numValue < schema.min || numValue > schema.max) {
                return NextResponse.json({ error: `${schema.label} must be between ${schema.min} and ${schema.max}` }, { status: 400 });
            }
        }

        await updateAppSetting(key, String(numValue));

        return NextResponse.json({ success: true, key, value: String(numValue) });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
