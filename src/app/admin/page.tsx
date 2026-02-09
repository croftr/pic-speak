import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getAppSettings } from '@/lib/storage';
import AdminClient from './AdminClient';

export default async function AdminPage() {
    const admin = await isAdmin();
    if (!admin) {
        redirect('/');
    }

    const settings = await getAppSettings();

    return <AdminClient initialSettings={settings} />;
}
