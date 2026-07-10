import { auth } from '@clerk/nextjs/server';
import HomeClient from '@/components/HomeClient';

// The hero swaps between a visitor pitch and a signed-in launcher. Deciding
// that branch on the server puts the right variant in the initial HTML, so
// clerk-js loading client-side doesn't swap the hero after first paint (CLS).
export default async function Home() {
    const { userId } = await auth();
    return <HomeClient initialSignedIn={!!userId} />;
}
