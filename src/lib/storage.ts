import { Pool, PoolClient } from 'pg';
import { Card, Board, BoardComment } from '@/types';
import { logger } from './logger';
import publicBoardCovers from '@/config/public-board-covers.json';

// Database row types (snake_case from DB)
type CardRow = {
    id: string;
    board_id: string;
    label: string;
    image_url: string;
    audio_url: string;
    color?: string;
    order?: number;
    type?: string; // Maps to 'category' in the app - optional free-text field
    template_key?: string;
    source_board_id?: string; // If set, this card was inherited from a public board template
    created_at?: string;
    updated_at?: string;
};

type BoardRow = {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    is_public?: boolean;
    creator_name?: string;
    creator_image_url?: string;
    owner_email?: string;
    email_notifications_enabled?: boolean;
    cover_image_url?: string;
};

export interface BoardWithStats {
    board?: Board;
    cardCount: number;
    existingLabels: Set<string>;
    maxCardsSetting: string | null;
}

// Create a connection pool for better performance
// Pool reuses connections instead of creating new ones for each query
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL but uses a private CA
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if unable to get a connection
});

// Helper function to get a database client from the pool
async function getDbClient(): Promise<PoolClient> {
    const startTime = Date.now();
    try {
        const client = await pool.connect();
        const connectionTime = Date.now() - startTime;
        logger.debug('DB Client acquired', {
            duration_ms: connectionTime,
            pool: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount
            }
        });
        return client;
    } catch (error) {
        const connectionTime = Date.now() - startTime;
        logger.error('Failed to acquire DB client', error, { duration_ms: connectionTime });
        throw error;
    }
}

// --- Starter Content ---

const STARTER_BOARDS: Board[] = [
    {
        id: 'starter-template',
        userId: 'system',
        name: 'Starter Template',
        description: 'Essential everyday phrases and objects.',
        createdAt: '2024-01-01T00:00:00.000Z',
        isPublic: true,
        creatorName: 'My Voice Board',
        creatorImageUrl: '/logo.svg',
        // Designed cover assets to be added later (e.g. '/prebuilt/covers/starter-template.webp');
        // until then board tiles fall back to the first starter card's image.
        coverImageUrl: (publicBoardCovers as Record<string, string | null>)['starter-template'] || undefined,
        cardCount: 37
    },
    {
        id: 'starter-school-classroom',
        userId: 'system',
        name: 'School & Classroom',
        description: 'Communication cards for school, teachers, classmates, and classroom activities.',
        createdAt: '2024-01-02T00:00:00.000Z',
        isPublic: true,
        creatorName: 'My Voice Board',
        creatorImageUrl: '/logo.svg',
        // Designed cover assets to be added later (e.g. '/prebuilt/covers/starter-template.webp');
        // until then board tiles fall back to the first starter card's image.
        coverImageUrl: (publicBoardCovers as Record<string, string | null>)['starter-school-classroom'] || undefined,
        cardCount: 12
    },
    {
        id: 'starter-health-medical',
        userId: 'system',
        name: 'Health & Medical',
        description: 'Communication cards for describing pain, sickness, physical needs, and requesting help.',
        createdAt: '2024-01-03T00:00:00.000Z',
        isPublic: true,
        creatorName: 'My Voice Board',
        creatorImageUrl: '/logo.svg',
        // Designed cover assets to be added later (e.g. '/prebuilt/covers/starter-template.webp');
        // until then board tiles fall back to the first starter card's image.
        coverImageUrl: (publicBoardCovers as Record<string, string | null>)['starter-health-medical'] || undefined,
        cardCount: 12
    },
    {
        id: 'starter-dining-out',
        userId: 'system',
        name: 'Dining Out & Restaurants',
        description: 'Communication cards for ordering food, describing tastes, and interacting at a restaurant.',
        createdAt: '2024-01-04T00:00:00.000Z',
        isPublic: true,
        creatorName: 'My Voice Board',
        creatorImageUrl: '/logo.svg',
        // Designed cover assets to be added later (e.g. '/prebuilt/covers/starter-template.webp');
        // until then board tiles fall back to the first starter card's image.
        coverImageUrl: (publicBoardCovers as Record<string, string | null>)['starter-dining-out'] || undefined,
        cardCount: 12
    },
    {
        id: 'starter-park-playground',
        userId: 'system',
        name: 'Park & Playground',
        description: 'Communication cards for playing games, sharing turns, and outdoor playground activities.',
        createdAt: '2024-01-05T00:00:00.000Z',
        isPublic: true,
        creatorName: 'My Voice Board',
        creatorImageUrl: '/logo.svg',
        // Designed cover assets to be added later (e.g. '/prebuilt/covers/starter-template.webp');
        // until then board tiles fall back to the first starter card's image.
        coverImageUrl: (publicBoardCovers as Record<string, string | null>)['starter-park-playground'] || undefined,
        cardCount: 12
    }
];

// Template card definitions - these are referenced by templateKey and never stored in DB
const TEMPLATE_CARDS_REGISTRY: Record<string, Omit<Card, 'id' | 'boardId' | 'order'>> = {
    // Core
    'tpl-yes': { label: 'Yes', imageUrl: '/prebuilt/yes.webp', audioUrl: '/prebuilt/yes.mp3', category: 'Core', templateKey: 'tpl-yes' },
    'tpl-no': { label: 'No', imageUrl: '/prebuilt/no.webp', audioUrl: '/prebuilt/no.mp3', category: 'Core', templateKey: 'tpl-no' },
    'tpl-hello': { label: 'Hello', imageUrl: '/prebuilt/hello.webp', audioUrl: '/prebuilt/hello.mp3', category: 'Core', templateKey: 'tpl-hello' },
    'tpl-bye': { label: 'Goodbye', imageUrl: '/prebuilt/bye.webp', audioUrl: '/prebuilt/bye.mp3', category: 'Core', templateKey: 'tpl-bye' },
    'tpl-thank-you': { label: 'Thank You', imageUrl: '/prebuilt/thank_you.webp', audioUrl: '/prebuilt/thank_you.mp3', category: 'Core', templateKey: 'tpl-thank-you' },
    'tpl-please': { label: 'Please', imageUrl: '/prebuilt/please.webp', audioUrl: '/prebuilt/please.mp3', category: 'Core', templateKey: 'tpl-please' },
    // People
    'tpl-teacher': { label: 'Teacher', imageUrl: '/prebuilt/teacher.webp', audioUrl: '/prebuilt/teacher.wav', category: 'People', templateKey: 'tpl-teacher' },
    'tpl-friend': { label: 'Friend', imageUrl: '/prebuilt/friend.webp', audioUrl: '/prebuilt/friend.wav', category: 'People', templateKey: 'tpl-friend' },
    'tpl-doctor': { label: 'Doctor', imageUrl: '/prebuilt/doctor.webp', audioUrl: '/prebuilt/doctor.wav', category: 'People', templateKey: 'tpl-doctor' },
    'tpl-nurse': { label: 'Nurse', imageUrl: '/prebuilt/nurse.webp', audioUrl: '/prebuilt/nurse.wav', category: 'People', templateKey: 'tpl-nurse' },
    // Activities
    'tpl-computer': { label: 'Computer', imageUrl: '/prebuilt/computer.webp', audioUrl: '/prebuilt/computer.mp3', category: 'Activities', templateKey: 'tpl-computer' },
    'tpl-tablet': { label: 'Tablet', imageUrl: '/prebuilt/tablet.webp', audioUrl: '/prebuilt/tablet.mp3', category: 'Activities', templateKey: 'tpl-tablet' },
    'tpl-mobile-phone': { label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.webp', audioUrl: '/prebuilt/mobile_phone.mp3', category: 'Activities', templateKey: 'tpl-mobile-phone' },
    'tpl-toilet': { label: 'Toilet', imageUrl: '/prebuilt/toilet.webp', audioUrl: '/prebuilt/toilet.mp3', category: 'Activities', templateKey: 'tpl-toilet' },
    'tpl-brush-teeth': { label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.webp', audioUrl: '/prebuilt/brush_teeth.mp3', category: 'Activities', templateKey: 'tpl-brush-teeth' },
    'tpl-car': { label: 'Car', imageUrl: '/prebuilt/car.webp', audioUrl: '/prebuilt/car.wav', category: 'Activities', templateKey: 'tpl-car' },
    'tpl-tv': { label: 'TV', imageUrl: '/prebuilt/tv.webp', audioUrl: '/prebuilt/tv.wav', category: 'Activities', templateKey: 'tpl-tv' },
    'tpl-wash-hands': { label: 'Wash Hands', imageUrl: '/prebuilt/wash_hands.webp', audioUrl: '/prebuilt/wash_hands.wav', category: 'Activities', templateKey: 'tpl-wash-hands' },
    'tpl-book': { label: 'Book', imageUrl: '/prebuilt/book.webp', audioUrl: '/prebuilt/book.wav', category: 'Activities', templateKey: 'tpl-book' },
    'tpl-pencil': { label: 'Pencil', imageUrl: '/prebuilt/pencil.webp', audioUrl: '/prebuilt/pencil.wav', category: 'Activities', templateKey: 'tpl-pencil' },
    'tpl-paper': { label: 'Paper', imageUrl: '/prebuilt/paper.webp', audioUrl: '/prebuilt/paper.wav', category: 'Activities', templateKey: 'tpl-paper' },
    'tpl-write': { label: 'Write', imageUrl: '/prebuilt/write.webp', audioUrl: '/prebuilt/write.wav', category: 'Activities', templateKey: 'tpl-write' },
    'tpl-draw': { label: 'Draw', imageUrl: '/prebuilt/draw.webp', audioUrl: '/prebuilt/draw.wav', category: 'Activities', templateKey: 'tpl-draw' },
    'tpl-medicine': { label: 'Medicine', imageUrl: '/prebuilt/medicine.webp', audioUrl: '/prebuilt/medicine.wav', category: 'Activities', templateKey: 'tpl-medicine' },
    'tpl-bandage': { label: 'Bandage', imageUrl: '/prebuilt/bandage.webp', audioUrl: '/prebuilt/bandage.wav', category: 'Activities', templateKey: 'tpl-bandage' },
    'tpl-order': { label: 'I want to order', imageUrl: '/prebuilt/order.webp', audioUrl: '/prebuilt/order.wav', category: 'Activities', templateKey: 'tpl-order' },
    'tpl-bill': { label: 'Check please', imageUrl: '/prebuilt/bill.webp', audioUrl: '/prebuilt/bill.wav', category: 'Activities', templateKey: 'tpl-bill' },
    'tpl-menu': { label: 'Menu', imageUrl: '/prebuilt/menu.webp', audioUrl: '/prebuilt/menu.wav', category: 'Activities', templateKey: 'tpl-menu' },
    'tpl-napkin': { label: 'Napkin', imageUrl: '/prebuilt/napkin.webp', audioUrl: '/prebuilt/napkin.wav', category: 'Activities', templateKey: 'tpl-napkin' },
    'tpl-play': { label: 'Play', imageUrl: '/prebuilt/play.webp', audioUrl: '/prebuilt/play.wav', category: 'Activities', templateKey: 'tpl-play' },
    'tpl-slide': { label: 'Slide', imageUrl: '/prebuilt/slide.webp', audioUrl: '/prebuilt/slide.wav', category: 'Activities', templateKey: 'tpl-slide' },
    'tpl-swing': { label: 'Swing', imageUrl: '/prebuilt/swing.webp', audioUrl: '/prebuilt/swing.wav', category: 'Activities', templateKey: 'tpl-swing' },
    'tpl-ball': { label: 'Ball', imageUrl: '/prebuilt/ball.webp', audioUrl: '/prebuilt/ball.wav', category: 'Activities', templateKey: 'tpl-ball' },
    'tpl-bike': { label: 'Bike', imageUrl: '/prebuilt/bike.webp', audioUrl: '/prebuilt/bike.wav', category: 'Activities', templateKey: 'tpl-bike' },
    'tpl-run': { label: 'Run', imageUrl: '/prebuilt/run.webp', audioUrl: '/prebuilt/run.wav', category: 'Activities', templateKey: 'tpl-run' },
    'tpl-jump': { label: 'Jump', imageUrl: '/prebuilt/jump.webp', audioUrl: '/prebuilt/jump.wav', category: 'Activities', templateKey: 'tpl-jump' },
    'tpl-my-turn': { label: 'My turn', imageUrl: '/prebuilt/my_turn.webp', audioUrl: '/prebuilt/my_turn.wav', category: 'Activities', templateKey: 'tpl-my-turn' },
    'tpl-your-turn': { label: 'Your turn', imageUrl: '/prebuilt/your_turn.webp', audioUrl: '/prebuilt/your_turn.wav', category: 'Activities', templateKey: 'tpl-your-turn' },
    // Places
    'tpl-bed': { label: 'Bed', imageUrl: '/prebuilt/bed.webp', audioUrl: '/prebuilt/bed.mp3', category: 'Places', templateKey: 'tpl-bed' },
    'tpl-school': { label: 'School', imageUrl: '/prebuilt/school.webp', audioUrl: '/prebuilt/school.wav', category: 'Places', templateKey: 'tpl-school' },
    'tpl-classroom': { label: 'Classroom', imageUrl: '/prebuilt/classroom.webp', audioUrl: '/prebuilt/classroom.wav', category: 'Places', templateKey: 'tpl-classroom' },
    'tpl-playground': { label: 'Playground', imageUrl: '/prebuilt/playground.webp', audioUrl: '/prebuilt/playground.wav', category: 'Places', templateKey: 'tpl-playground' },
    'tpl-bathroom': { label: 'Bathroom', imageUrl: '/prebuilt/bathroom.webp', audioUrl: '/prebuilt/bathroom.wav', category: 'Places', templateKey: 'tpl-bathroom' },
    // Food
    'tpl-juice': { label: 'Juice', imageUrl: '/prebuilt/juice.webp', audioUrl: '/prebuilt/juice.wav', category: 'Food', templateKey: 'tpl-juice' },
    'tpl-chocolate': { label: 'Chocolate', imageUrl: '/prebuilt/chocolate.webp', audioUrl: '/prebuilt/chocolate.wav', category: 'Food', templateKey: 'tpl-chocolate' },
    'tpl-sweets': { label: 'Sweets', imageUrl: '/prebuilt/sweets.webp', audioUrl: '/prebuilt/sweets.wav', category: 'Food', templateKey: 'tpl-sweets' },
    'tpl-cake': { label: 'Cake', imageUrl: '/prebuilt/cake.webp', audioUrl: '/prebuilt/cake.wav', category: 'Food', templateKey: 'tpl-cake' },
    'tpl-apple': { label: 'Apple', imageUrl: '/prebuilt/apple.webp', audioUrl: '/prebuilt/apple.wav', category: 'Food', templateKey: 'tpl-apple' },
    'tpl-water': { label: 'Water', imageUrl: '/prebuilt/water.webp', audioUrl: '/prebuilt/water.wav', category: 'Food', templateKey: 'tpl-water' },
    'tpl-milk': { label: 'Milk', imageUrl: '/prebuilt/milk.webp', audioUrl: '/prebuilt/milk.wav', category: 'Food', templateKey: 'tpl-milk' },
    'tpl-banana': { label: 'Banana', imageUrl: '/prebuilt/banana.webp', audioUrl: '/prebuilt/banana.wav', category: 'Food', templateKey: 'tpl-banana' },
    'tpl-bread': { label: 'Bread', imageUrl: '/prebuilt/bread.webp', audioUrl: '/prebuilt/bread.wav', category: 'Food', templateKey: 'tpl-bread' },
    'tpl-pizza': { label: 'Pizza', imageUrl: '/prebuilt/pizza.webp', audioUrl: '/prebuilt/pizza.wav', category: 'Food', templateKey: 'tpl-pizza' },
    'tpl-burger': { label: 'Burger', imageUrl: '/prebuilt/burger.webp', audioUrl: '/prebuilt/burger.wav', category: 'Food', templateKey: 'tpl-burger' },
    'tpl-fries': { label: 'Fries', imageUrl: '/prebuilt/fries.webp', audioUrl: '/prebuilt/fries.wav', category: 'Food', templateKey: 'tpl-fries' },
    // Core - New
    'tpl-help': { label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', templateKey: 'tpl-help' },
    'tpl-start': { label: 'Start', imageUrl: '/prebuilt/start.webp', audioUrl: '/prebuilt/start.wav', category: 'Core', templateKey: 'tpl-start' },
    'tpl-stop': { label: 'Stop', imageUrl: '/prebuilt/stop.webp', audioUrl: '/prebuilt/stop.wav', category: 'Core', templateKey: 'tpl-stop' },
    'tpl-more': { label: 'More', imageUrl: '/prebuilt/more.webp', audioUrl: '/prebuilt/more.wav', category: 'Core', templateKey: 'tpl-more' },
    // Feelings
    'tpl-hungry': { label: 'Hungry', imageUrl: '/prebuilt/hungry.webp', audioUrl: '/prebuilt/hungry.wav', category: 'Feelings', templateKey: 'tpl-hungry' },
    'tpl-tired': { label: 'Tired', imageUrl: '/prebuilt/tired.webp', audioUrl: '/prebuilt/tired.wav', category: 'Feelings', templateKey: 'tpl-tired' },
    'tpl-happy': { label: 'Happy', imageUrl: '/prebuilt/happy.webp', audioUrl: '/prebuilt/happy.wav', category: 'Feelings', templateKey: 'tpl-happy' },
    'tpl-sad': { label: 'Sad', imageUrl: '/prebuilt/sad.webp', audioUrl: '/prebuilt/sad.wav', category: 'Feelings', templateKey: 'tpl-sad' },
    'tpl-hurt': { label: 'Hurt', imageUrl: '/prebuilt/hurt.webp', audioUrl: '/prebuilt/hurt.wav', category: 'Feelings', templateKey: 'tpl-hurt' },
    'tpl-sick': { label: 'Sick', imageUrl: '/prebuilt/sick.webp', audioUrl: '/prebuilt/sick.wav', category: 'Feelings', templateKey: 'tpl-sick' },
    'tpl-thirsty': { label: 'Thirsty', imageUrl: '/prebuilt/thirsty.webp', audioUrl: '/prebuilt/thirsty.wav', category: 'Feelings', templateKey: 'tpl-thirsty' },
    'tpl-yummy': { label: 'Yummy', imageUrl: '/prebuilt/yummy.webp', audioUrl: '/prebuilt/yummy.wav', category: 'Feelings', templateKey: 'tpl-yummy' },
    'tpl-yuck': { label: 'Yuck', imageUrl: '/prebuilt/yuck.webp', audioUrl: '/prebuilt/yuck.wav', category: 'Feelings', templateKey: 'tpl-yuck' },
    // Animals
    'tpl-dog': { label: 'Dog', imageUrl: '/prebuilt/dog.webp', audioUrl: '/prebuilt/dog.wav', category: 'Animals', templateKey: 'tpl-dog' },
    'tpl-cat': { label: 'Cat', imageUrl: '/prebuilt/cat.webp', audioUrl: '/prebuilt/cat.wav', category: 'Animals', templateKey: 'tpl-cat' },
    'tpl-fish': { label: 'Fish', imageUrl: '/prebuilt/fish.webp', audioUrl: '/prebuilt/fish.wav', category: 'Animals', templateKey: 'tpl-fish' },
};

// Export for use in other modules
export function getTemplateCard(templateKey: string): Omit<Card, 'id' | 'boardId' | 'order'> | undefined {
    return TEMPLATE_CARDS_REGISTRY[templateKey];
}

// Resolve a board's first-card image for tile cover fallbacks. Template cards
// store no image_url in the DB, so resolve their image via the registry.
function resolveFirstCardImage(imageUrl?: string | null, templateKey?: string | null): string | undefined {
    if (templateKey && TEMPLATE_CARDS_REGISTRY[templateKey]) {
        return TEMPLATE_CARDS_REGISTRY[templateKey].imageUrl;
    }
    return imageUrl || undefined;
}

const STARTER_CARDS: Record<string, Card[]> = {
    'starter-template': [
        // Core
        { id: 'sbp-1', boardId: 'starter-template', label: 'Yes', imageUrl: '/prebuilt/yes.webp', audioUrl: '/prebuilt/yes.mp3', category: 'Core', order: 0, templateKey: 'tpl-yes' },
        { id: 'sbp-2', boardId: 'starter-template', label: 'No', imageUrl: '/prebuilt/no.webp', audioUrl: '/prebuilt/no.mp3', category: 'Core', order: 1, templateKey: 'tpl-no' },
        { id: 'sbp-3', boardId: 'starter-template', label: 'Hello', imageUrl: '/prebuilt/hello.webp', audioUrl: '/prebuilt/hello.mp3', category: 'Core', order: 2, templateKey: 'tpl-hello' },
        { id: 'sbp-4', boardId: 'starter-template', label: 'Goodbye', imageUrl: '/prebuilt/bye.webp', audioUrl: '/prebuilt/bye.mp3', category: 'Core', order: 3, templateKey: 'tpl-bye' },
        { id: 'sbp-5', boardId: 'starter-template', label: 'Thank You', imageUrl: '/prebuilt/thank_you.webp', audioUrl: '/prebuilt/thank_you.mp3', category: 'Core', order: 4, templateKey: 'tpl-thank-you' },
        { id: 'sbp-6', boardId: 'starter-template', label: 'Please', imageUrl: '/prebuilt/please.webp', audioUrl: '/prebuilt/please.mp3', category: 'Core', order: 5, templateKey: 'tpl-please' },
        // Activities
        { id: 'sbp-7', boardId: 'starter-template', label: 'Computer', imageUrl: '/prebuilt/computer.webp', audioUrl: '/prebuilt/computer.mp3', category: 'Activities', order: 6, templateKey: 'tpl-computer' },
        { id: 'sbp-8', boardId: 'starter-template', label: 'Tablet', imageUrl: '/prebuilt/tablet.webp', audioUrl: '/prebuilt/tablet.mp3', category: 'Activities', order: 7, templateKey: 'tpl-tablet' },
        { id: 'sbp-9', boardId: 'starter-template', label: 'Mobile Phone', imageUrl: '/prebuilt/mobile_phone.webp', audioUrl: '/prebuilt/mobile_phone.mp3', category: 'Activities', order: 8, templateKey: 'tpl-mobile-phone' },
        { id: 'sbp-10', boardId: 'starter-template', label: 'Toilet', imageUrl: '/prebuilt/toilet.webp', audioUrl: '/prebuilt/toilet.mp3', category: 'Activities', order: 9, templateKey: 'tpl-toilet' },
        { id: 'sbp-11', boardId: 'starter-template', label: 'Brush Teeth', imageUrl: '/prebuilt/brush_teeth.webp', audioUrl: '/prebuilt/brush_teeth.mp3', category: 'Activities', order: 10, templateKey: 'tpl-brush-teeth' },
        { id: 'sbp-30', boardId: 'starter-template', label: 'Car', imageUrl: '/prebuilt/car.webp', audioUrl: '/prebuilt/car.wav', category: 'Activities', order: 11, templateKey: 'tpl-car' },
        { id: 'sbp-35', boardId: 'starter-template', label: 'TV', imageUrl: '/prebuilt/tv.webp', audioUrl: '/prebuilt/tv.wav', category: 'Activities', order: 12, templateKey: 'tpl-tv' },
        { id: 'sbp-36', boardId: 'starter-template', label: 'Wash Hands', imageUrl: '/prebuilt/wash_hands.webp', audioUrl: '/prebuilt/wash_hands.wav', category: 'Activities', order: 13, templateKey: 'tpl-wash-hands' },
        { id: 'sbp-37', boardId: 'starter-template', label: 'Book', imageUrl: '/prebuilt/book.webp', audioUrl: '/prebuilt/book.wav', category: 'Activities', order: 14, templateKey: 'tpl-book' },
        // Places
        { id: 'sbp-12', boardId: 'starter-template', label: 'Bed', imageUrl: '/prebuilt/bed.webp', audioUrl: '/prebuilt/bed.mp3', category: 'Places', order: 15, templateKey: 'tpl-bed' },
        { id: 'sbp-13', boardId: 'starter-template', label: 'School', imageUrl: '/prebuilt/school.webp', audioUrl: '/prebuilt/school.wav', category: 'Places', order: 16, templateKey: 'tpl-school' },
        // Food
        { id: 'sbp-14', boardId: 'starter-template', label: 'Juice', imageUrl: '/prebuilt/juice.webp', audioUrl: '/prebuilt/juice.wav', category: 'Food', order: 17, templateKey: 'tpl-juice' },
        { id: 'sbp-15', boardId: 'starter-template', label: 'Chocolate', imageUrl: '/prebuilt/chocolate.webp', audioUrl: '/prebuilt/chocolate.wav', category: 'Food', order: 18, templateKey: 'tpl-chocolate' },
        { id: 'sbp-16', boardId: 'starter-template', label: 'Sweets', imageUrl: '/prebuilt/sweets.webp', audioUrl: '/prebuilt/sweets.wav', category: 'Food', order: 19, templateKey: 'tpl-sweets' },
        { id: 'sbp-17', boardId: 'starter-template', label: 'Cake', imageUrl: '/prebuilt/cake.webp', audioUrl: '/prebuilt/cake.wav', category: 'Food', order: 20, templateKey: 'tpl-cake' },
        { id: 'sbp-18', boardId: 'starter-template', label: 'Apple', imageUrl: '/prebuilt/apple.webp', audioUrl: '/prebuilt/apple.wav', category: 'Food', order: 21, templateKey: 'tpl-apple' },
        { id: 'sbp-31', boardId: 'starter-template', label: 'Water', imageUrl: '/prebuilt/water.webp', audioUrl: '/prebuilt/water.wav', category: 'Food', order: 22, templateKey: 'tpl-water' },
        { id: 'sbp-32', boardId: 'starter-template', label: 'Milk', imageUrl: '/prebuilt/milk.webp', audioUrl: '/prebuilt/milk.wav', category: 'Food', order: 23, templateKey: 'tpl-milk' },
        { id: 'sbp-33', boardId: 'starter-template', label: 'Banana', imageUrl: '/prebuilt/banana.webp', audioUrl: '/prebuilt/banana.wav', category: 'Food', order: 24, templateKey: 'tpl-banana' },
        { id: 'sbp-34', boardId: 'starter-template', label: 'Bread', imageUrl: '/prebuilt/bread.webp', audioUrl: '/prebuilt/bread.wav', category: 'Food', order: 25, templateKey: 'tpl-bread' },
        // Core - New
        { id: 'sbp-19', boardId: 'starter-template', label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 26, templateKey: 'tpl-help' },
        { id: 'sbp-20', boardId: 'starter-template', label: 'Start', imageUrl: '/prebuilt/start.webp', audioUrl: '/prebuilt/start.wav', category: 'Core', order: 27, templateKey: 'tpl-start' },
        { id: 'sbp-21', boardId: 'starter-template', label: 'Stop', imageUrl: '/prebuilt/stop.webp', audioUrl: '/prebuilt/stop.wav', category: 'Core', order: 28, templateKey: 'tpl-stop' },
        { id: 'sbp-22', boardId: 'starter-template', label: 'More', imageUrl: '/prebuilt/more.webp', audioUrl: '/prebuilt/more.wav', category: 'Core', order: 29, templateKey: 'tpl-more' },
        // Feelings
        { id: 'sbp-23', boardId: 'starter-template', label: 'Hungry', imageUrl: '/prebuilt/hungry.webp', audioUrl: '/prebuilt/hungry.wav', category: 'Feelings', order: 30, templateKey: 'tpl-hungry' },
        { id: 'sbp-24', boardId: 'starter-template', label: 'Tired', imageUrl: '/prebuilt/tired.webp', audioUrl: '/prebuilt/tired.wav', category: 'Feelings', order: 31, templateKey: 'tpl-tired' },
        { id: 'sbp-25', boardId: 'starter-template', label: 'Happy', imageUrl: '/prebuilt/happy.webp', audioUrl: '/prebuilt/happy.wav', category: 'Feelings', order: 32, templateKey: 'tpl-happy' },
        { id: 'sbp-26', boardId: 'starter-template', label: 'Sad', imageUrl: '/prebuilt/sad.webp', audioUrl: '/prebuilt/sad.wav', category: 'Feelings', order: 33, templateKey: 'tpl-sad' },
        // Animals
        { id: 'sbp-27', boardId: 'starter-template', label: 'Dog', imageUrl: '/prebuilt/dog.webp', audioUrl: '/prebuilt/dog.wav', category: 'Animals', order: 34, templateKey: 'tpl-dog' },
        { id: 'sbp-28', boardId: 'starter-template', label: 'Cat', imageUrl: '/prebuilt/cat.webp', audioUrl: '/prebuilt/cat.wav', category: 'Animals', order: 35, templateKey: 'tpl-cat' },
        { id: 'sbp-29', boardId: 'starter-template', label: 'Fish', imageUrl: '/prebuilt/fish.webp', audioUrl: '/prebuilt/fish.wav', category: 'Animals', order: 36, templateKey: 'tpl-fish' },
    ],
    'starter-school-classroom': [
        { id: 'sbp-school-1', boardId: 'starter-school-classroom', label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 0, templateKey: 'tpl-help' },
        { id: 'sbp-school-2', boardId: 'starter-school-classroom', label: 'Teacher', imageUrl: '/prebuilt/teacher.webp', audioUrl: '/prebuilt/teacher.wav', category: 'People', order: 1, templateKey: 'tpl-teacher' },
        { id: 'sbp-school-3', boardId: 'starter-school-classroom', label: 'Friend', imageUrl: '/prebuilt/friend.webp', audioUrl: '/prebuilt/friend.wav', category: 'People', order: 2, templateKey: 'tpl-friend' },
        { id: 'sbp-school-4', boardId: 'starter-school-classroom', label: 'Classroom', imageUrl: '/prebuilt/classroom.webp', audioUrl: '/prebuilt/classroom.wav', category: 'Places', order: 3, templateKey: 'tpl-classroom' },
        { id: 'sbp-school-5', boardId: 'starter-school-classroom', label: 'School', imageUrl: '/prebuilt/school.webp', audioUrl: '/prebuilt/school.wav', category: 'Places', order: 4, templateKey: 'tpl-school' },
        { id: 'sbp-school-6', boardId: 'starter-school-classroom', label: 'Playground', imageUrl: '/prebuilt/playground.webp', audioUrl: '/prebuilt/playground.wav', category: 'Places', order: 5, templateKey: 'tpl-playground' },
        { id: 'sbp-school-7', boardId: 'starter-school-classroom', label: 'Bathroom', imageUrl: '/prebuilt/bathroom.webp', audioUrl: '/prebuilt/bathroom.wav', category: 'Places', order: 6, templateKey: 'tpl-bathroom' },
        { id: 'sbp-school-8', boardId: 'starter-school-classroom', label: 'Pencil', imageUrl: '/prebuilt/pencil.webp', audioUrl: '/prebuilt/pencil.wav', category: 'Activities', order: 7, templateKey: 'tpl-pencil' },
        { id: 'sbp-school-9', boardId: 'starter-school-classroom', label: 'Paper', imageUrl: '/prebuilt/paper.webp', audioUrl: '/prebuilt/paper.wav', category: 'Activities', order: 8, templateKey: 'tpl-paper' },
        { id: 'sbp-school-10', boardId: 'starter-school-classroom', label: 'Book', imageUrl: '/prebuilt/book.webp', audioUrl: '/prebuilt/book.wav', category: 'Activities', order: 9, templateKey: 'tpl-book' },
        { id: 'sbp-school-11', boardId: 'starter-school-classroom', label: 'Write', imageUrl: '/prebuilt/write.webp', audioUrl: '/prebuilt/write.wav', category: 'Activities', order: 10, templateKey: 'tpl-write' },
        { id: 'sbp-school-12', boardId: 'starter-school-classroom', label: 'Draw', imageUrl: '/prebuilt/draw.webp', audioUrl: '/prebuilt/draw.wav', category: 'Activities', order: 11, templateKey: 'tpl-draw' },
    ],
    'starter-health-medical': [
        { id: 'sbp-health-1', boardId: 'starter-health-medical', label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 0, templateKey: 'tpl-help' },
        { id: 'sbp-health-2', boardId: 'starter-health-medical', label: 'Hurt', imageUrl: '/prebuilt/hurt.webp', audioUrl: '/prebuilt/hurt.wav', category: 'Feelings', order: 1, templateKey: 'tpl-hurt' },
        { id: 'sbp-health-3', boardId: 'starter-health-medical', label: 'Sick', imageUrl: '/prebuilt/sick.webp', audioUrl: '/prebuilt/sick.wav', category: 'Feelings', order: 2, templateKey: 'tpl-sick' },
        { id: 'sbp-health-4', boardId: 'starter-health-medical', label: 'Thirsty', imageUrl: '/prebuilt/thirsty.webp', audioUrl: '/prebuilt/thirsty.wav', category: 'Feelings', order: 3, templateKey: 'tpl-thirsty' },
        { id: 'sbp-health-5', boardId: 'starter-health-medical', label: 'Hungry', imageUrl: '/prebuilt/hungry.webp', audioUrl: '/prebuilt/hungry.wav', category: 'Feelings', order: 4, templateKey: 'tpl-hungry' },
        { id: 'sbp-health-6', boardId: 'starter-health-medical', label: 'Tired', imageUrl: '/prebuilt/tired.webp', audioUrl: '/prebuilt/tired.wav', category: 'Feelings', order: 5, templateKey: 'tpl-tired' },
        { id: 'sbp-health-7', boardId: 'starter-health-medical', label: 'Doctor', imageUrl: '/prebuilt/doctor.webp', audioUrl: '/prebuilt/doctor.wav', category: 'People', order: 6, templateKey: 'tpl-doctor' },
        { id: 'sbp-health-8', boardId: 'starter-health-medical', label: 'Nurse', imageUrl: '/prebuilt/nurse.webp', audioUrl: '/prebuilt/nurse.wav', category: 'People', order: 7, templateKey: 'tpl-nurse' },
        { id: 'sbp-health-9', boardId: 'starter-health-medical', label: 'Medicine', imageUrl: '/prebuilt/medicine.webp', audioUrl: '/prebuilt/medicine.wav', category: 'Activities', order: 8, templateKey: 'tpl-medicine' },
        { id: 'sbp-health-10', boardId: 'starter-health-medical', label: 'Bandage', imageUrl: '/prebuilt/bandage.webp', audioUrl: '/prebuilt/bandage.wav', category: 'Activities', order: 9, templateKey: 'tpl-bandage' },
        { id: 'sbp-health-11', boardId: 'starter-health-medical', label: 'Water', imageUrl: '/prebuilt/water.webp', audioUrl: '/prebuilt/water.wav', category: 'Food', order: 10, templateKey: 'tpl-water' },
        { id: 'sbp-health-12', boardId: 'starter-health-medical', label: 'Bed', imageUrl: '/prebuilt/bed.webp', audioUrl: '/prebuilt/bed.mp3', category: 'Places', order: 11, templateKey: 'tpl-bed' },
    ],
    'starter-dining-out': [
        { id: 'sbp-dining-1', boardId: 'starter-dining-out', label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 0, templateKey: 'tpl-help' },
        { id: 'sbp-dining-2', boardId: 'starter-dining-out', label: 'More', imageUrl: '/prebuilt/more.webp', audioUrl: '/prebuilt/more.wav', category: 'Core', order: 1, templateKey: 'tpl-more' },
        { id: 'sbp-dining-3', boardId: 'starter-dining-out', label: 'I want to order', imageUrl: '/prebuilt/order.webp', audioUrl: '/prebuilt/order.wav', category: 'Activities', order: 2, templateKey: 'tpl-order' },
        { id: 'sbp-dining-4', boardId: 'starter-dining-out', label: 'Check please', imageUrl: '/prebuilt/bill.webp', audioUrl: '/prebuilt/bill.wav', category: 'Activities', order: 3, templateKey: 'tpl-bill' },
        { id: 'sbp-dining-5', boardId: 'starter-dining-out', label: 'Menu', imageUrl: '/prebuilt/menu.webp', audioUrl: '/prebuilt/menu.wav', category: 'Activities', order: 4, templateKey: 'tpl-menu' },
        { id: 'sbp-dining-6', boardId: 'starter-dining-out', label: 'Napkin', imageUrl: '/prebuilt/napkin.webp', audioUrl: '/prebuilt/napkin.wav', category: 'Activities', order: 5, templateKey: 'tpl-napkin' },
        { id: 'sbp-dining-7', boardId: 'starter-dining-out', label: 'Water', imageUrl: '/prebuilt/water.webp', audioUrl: '/prebuilt/water.wav', category: 'Food', order: 6, templateKey: 'tpl-water' },
        { id: 'sbp-dining-8', boardId: 'starter-dining-out', label: 'Pizza', imageUrl: '/prebuilt/pizza.webp', audioUrl: '/prebuilt/pizza.wav', category: 'Food', order: 7, templateKey: 'tpl-pizza' },
        { id: 'sbp-dining-9', boardId: 'starter-dining-out', label: 'Burger', imageUrl: '/prebuilt/burger.webp', audioUrl: '/prebuilt/burger.wav', category: 'Food', order: 8, templateKey: 'tpl-burger' },
        { id: 'sbp-dining-10', boardId: 'starter-dining-out', label: 'Fries', imageUrl: '/prebuilt/fries.webp', audioUrl: '/prebuilt/fries.wav', category: 'Food', order: 9, templateKey: 'tpl-fries' },
        { id: 'sbp-dining-11', boardId: 'starter-dining-out', label: 'Yummy', imageUrl: '/prebuilt/yummy.webp', audioUrl: '/prebuilt/yummy.wav', category: 'Feelings', order: 10, templateKey: 'tpl-yummy' },
        { id: 'sbp-dining-12', boardId: 'starter-dining-out', label: 'Yuck', imageUrl: '/prebuilt/yuck.webp', audioUrl: '/prebuilt/yuck.wav', category: 'Feelings', order: 11, templateKey: 'tpl-yuck' },
    ],
    'starter-park-playground': [
        { id: 'sbp-park-1', boardId: 'starter-park-playground', label: 'Help', imageUrl: '/prebuilt/help.webp', audioUrl: '/prebuilt/help.wav', category: 'Core', order: 0, templateKey: 'tpl-help' },
        { id: 'sbp-park-2', boardId: 'starter-park-playground', label: 'Stop', imageUrl: '/prebuilt/stop.webp', audioUrl: '/prebuilt/stop.wav', category: 'Core', order: 1, templateKey: 'tpl-stop' },
        { id: 'sbp-park-3', boardId: 'starter-park-playground', label: 'Play', imageUrl: '/prebuilt/play.webp', audioUrl: '/prebuilt/play.wav', category: 'Activities', order: 2, templateKey: 'tpl-play' },
        { id: 'sbp-park-4', boardId: 'starter-park-playground', label: 'Slide', imageUrl: '/prebuilt/slide.webp', audioUrl: '/prebuilt/slide.wav', category: 'Activities', order: 3, templateKey: 'tpl-slide' },
        { id: 'sbp-park-5', boardId: 'starter-park-playground', label: 'Swing', imageUrl: '/prebuilt/swing.webp', audioUrl: '/prebuilt/swing.wav', category: 'Activities', order: 4, templateKey: 'tpl-swing' },
        { id: 'sbp-park-6', boardId: 'starter-park-playground', label: 'Ball', imageUrl: '/prebuilt/ball.webp', audioUrl: '/prebuilt/ball.wav', category: 'Activities', order: 5, templateKey: 'tpl-ball' },
        { id: 'sbp-park-7', boardId: 'starter-park-playground', label: 'Bike', imageUrl: '/prebuilt/bike.webp', audioUrl: '/prebuilt/bike.wav', category: 'Activities', order: 6, templateKey: 'tpl-bike' },
        { id: 'sbp-park-8', boardId: 'starter-park-playground', label: 'Run', imageUrl: '/prebuilt/run.webp', audioUrl: '/prebuilt/run.wav', category: 'Activities', order: 7, templateKey: 'tpl-run' },
        { id: 'sbp-park-9', boardId: 'starter-park-playground', label: 'Jump', imageUrl: '/prebuilt/jump.webp', audioUrl: '/prebuilt/jump.wav', category: 'Activities', order: 8, templateKey: 'tpl-jump' },
        { id: 'sbp-park-10', boardId: 'starter-park-playground', label: 'Playground', imageUrl: '/prebuilt/playground.webp', audioUrl: '/prebuilt/playground.wav', category: 'Places', order: 9, templateKey: 'tpl-playground' },
        { id: 'sbp-park-11', boardId: 'starter-park-playground', label: 'My turn', imageUrl: '/prebuilt/my_turn.webp', audioUrl: '/prebuilt/my_turn.wav', category: 'Activities', order: 10, templateKey: 'tpl-my-turn' },
        { id: 'sbp-park-12', boardId: 'starter-park-playground', label: 'Your turn', imageUrl: '/prebuilt/your_turn.webp', audioUrl: '/prebuilt/your_turn.wav', category: 'Activities', order: 11, templateKey: 'tpl-your-turn' },
    ]
};

// --- Cards ---

export async function getCardCount(boardId: string): Promise<number> {
    // Check starter boards first
    if (STARTER_CARDS[boardId]) {
        return STARTER_CARDS[boardId].length;
    }

    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM cards WHERE board_id = $1',
            [boardId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        logger.error('Error counting cards', error, { boardId });
        return 0;
    } finally {
        client.release();
    }
}

export async function getCard(id: string): Promise<Card | undefined> {
    const client = await getDbClient();
    try {
        const result = await client.query<CardRow>(
            'SELECT * FROM cards WHERE id = $1 LIMIT 1',
            [id]
        );

        if (result.rows.length === 0) return undefined;

        const row = result.rows[0];

        // If this card has a template key, get data from the template registry
        if (row.template_key && TEMPLATE_CARDS_REGISTRY[row.template_key]) {
            const template = TEMPLATE_CARDS_REGISTRY[row.template_key];
            return {
                id: row.id,
                boardId: row.board_id,
                label: template.label,
                imageUrl: template.imageUrl,
                audioUrl: template.audioUrl,
                color: row.color,
                order: row.order,
                category: template.category,
                templateKey: row.template_key
            };
        }

        return {
            id: row.id,
            boardId: row.board_id,
            label: row.label,
            imageUrl: row.image_url,
            audioUrl: row.audio_url,
            color: row.color,
            order: row.order,
            category: row.type || undefined,
            sourceBoardId: row.source_board_id || undefined
        };
    } catch (error) {
        logger.error('Error getting card', error, { cardId: id });
        return undefined;
    } finally {
        client.release();
    }
}

export async function getCards(boardId?: string): Promise<Card[]> {
    if (boardId && STARTER_CARDS[boardId]) {
        return STARTER_CARDS[boardId];
    }

    const client = await getDbClient();
    try {
        let result;
        if (boardId) {
            result = await client.query<CardRow>(
                'SELECT * FROM cards WHERE board_id = $1 ORDER BY "order" ASC, created_at ASC',
                [boardId]
            );
        } else {
            result = await client.query<CardRow>(
                'SELECT * FROM cards ORDER BY created_at ASC'
            );
        }

        return result.rows.map(row => {
            // If this card has a template key, get data from the template registry
            if (row.template_key && TEMPLATE_CARDS_REGISTRY[row.template_key]) {
                const template = TEMPLATE_CARDS_REGISTRY[row.template_key];
                return {
                    id: row.id,
                    boardId: row.board_id,
                    label: template.label,
                    imageUrl: template.imageUrl,
                    audioUrl: template.audioUrl,
                    color: row.color,
                    order: row.order,
                    category: template.category,
                    templateKey: row.template_key
                };
            }

            // Regular user-created card - map 'type' column to 'category'
            return {
                id: row.id,
                boardId: row.board_id,
                label: row.label,
                imageUrl: row.image_url,
                audioUrl: row.audio_url,
                color: row.color,
                order: row.order,
                category: row.type || undefined, // DB column is 'type', app uses 'category'
                sourceBoardId: row.source_board_id || undefined
            };
        });
    } catch (error) {
        logger.error('Error getting cards', error, { boardId });
        return [];
    } finally {
        client.release();
    }
}

export async function getCardLabels(boardId: string): Promise<Set<string>> {
    const client = await getDbClient();
    try {
        const result = await client.query<{ label: string }>(
            'SELECT LOWER(TRIM(label)) as label FROM cards WHERE board_id = $1 AND label != \'\'',
            [boardId]
        );
        const labels = new Set(result.rows.map(row => row.label));

        // Also include labels from starter cards if applicable
        if (STARTER_CARDS[boardId]) {
            for (const card of STARTER_CARDS[boardId]) {
                const normalized = card.label.trim().toLowerCase();
                if (normalized) labels.add(normalized);
            }
        }

        return labels;
    } finally {
        client.release();
    }
}

/**
 * Optimized function to fetch everything needed for card creation in a single query.
 * Returns board details, current card count, existing labels, and max cards setting.
 */
export async function getBoardForCardCreation(boardId: string): Promise<BoardWithStats> {
    const startTime = Date.now();

    // 1. Check if it's a starter board (fast path, no DB needed)
    const starterBoard = STARTER_BOARDS.find(b => b.id === boardId);
    if (starterBoard) {
        const labels = new Set<string>();
        if (STARTER_CARDS[boardId]) {
            for (const card of STARTER_CARDS[boardId]) {
                const normalized = card.label.trim().toLowerCase();
                if (normalized) labels.add(normalized);
            }
        }
        return {
            board: starterBoard,
            cardCount: starterBoard.cardCount || 0,
            existingLabels: labels,
            maxCardsSetting: null
        };
    }

    // 2. DB Query - consolidated for performance
    const client = await getDbClient();
    try {
        const queryStart = Date.now();

        const result = await client.query(`
            WITH board_info AS (
                SELECT * FROM boards WHERE id = $1 LIMIT 1
            ),
            card_stats AS (
                SELECT
                    COUNT(*) as count,
                    COALESCE(ARRAY_AGG(LOWER(TRIM(label))) FILTER (WHERE label != ''), '{}') as labels
                FROM cards
                WHERE board_id = $1
            ),
            settings AS (
                SELECT value FROM app_settings WHERE key = 'max_cards_per_board'
            )
            SELECT
                b.*,
                s.count::int as card_count,
                s.labels::text[] as existing_labels,
                st.value as max_cards_setting
            FROM board_info b
            CROSS JOIN card_stats s
            LEFT JOIN settings st ON true
        `, [boardId]);

        const queryTime = Date.now() - queryStart;
        const totalTime = Date.now() - startTime;

        if (result.rows.length === 0) {
            logger.info('Board not found during card creation check', { boardId, query_duration_ms: queryTime });
            return {
                board: undefined,
                cardCount: 0,
                existingLabels: new Set(),
                maxCardsSetting: null
            };
        }

        const row = result.rows[0];

        logger.debug('Board stats retrieved', {
            boardId,
            cardCount: row.card_count,
            labelCount: row.existing_labels.length,
            duration_ms: totalTime
        });

        const board: Board = {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            coverImageUrl: row.cover_image_url || undefined
        };

        return {
            board,
            cardCount: row.card_count,
            existingLabels: new Set(row.existing_labels),
            maxCardsSetting: row.max_cards_setting
        };
    } catch (error) {
        logger.error('Error getting board for card creation', error, { boardId });
        // Fallback to empty if critical failure, though route handler will handle missing board
        return {
            board: undefined,
            cardCount: 0,
            existingLabels: new Set(),
            maxCardsSetting: null
        };
    } finally {
        client.release();
    }
}

export async function addCard(card: Card): Promise<void> {
    const startTime = Date.now();
    logger.info('Adding card', { cardId: card.id, boardId: card.boardId });

    const client = await getDbClient();
    try {
        // If this is a template card, only store the template key and minimal data
        if (card.templateKey) {
            // For template cards, we still do the 2-step process as they are rare and logic is different
            const minResult = await client.query(
                'SELECT COALESCE(MIN("order"), 0) - 1 AS new_order FROM cards WHERE board_id = $1',
                [card.boardId]
            );
            const newOrder = minResult.rows[0].new_order;

            logger.debug('Inserting template card', { templateKey: card.templateKey, cardId: card.id });
            await client.query(
                'INSERT INTO cards (id, board_id, template_key, "order", color) VALUES ($1, $2, $3, $4, $5)',
                [card.id, card.boardId, card.templateKey, newOrder, card.color || '#6366f1']
            );
        } else {
            // Regular user card - Optimized to single query
            // Note: 'category' maps to 'type' column in database (NOT NULL with default 'Thing')
            logger.debug('Inserting user card', {
                label: card.label,
                imageUrl: card.imageUrl,
                audioUrl: card.audioUrl,
                cardId: card.id
            });

            // This INSERT uses a subquery to calculate the 'order' field atomically
            await client.query(
                `INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type, source_board_id)
                 VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MIN("order"), 0) - 1 FROM cards WHERE board_id = $2), $7, $8)`,
                [card.id, card.boardId, card.label, card.imageUrl, card.audioUrl, card.color || '#6366f1', card.category || 'Thing', card.sourceBoardId || null]
            );
        }

        const totalTime = Date.now() - startTime;
        logger.info('Card added successfully', {
            cardId: card.id,
            total_duration_ms: totalTime
        });
    } catch (error) {
        const totalTime = Date.now() - startTime;
        logger.error('Failed to add card', error, {
            cardId: card.id,
            boardId: card.boardId,
            duration_ms: totalTime,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db_error_code: (error as any)?.code,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db_error_detail: (error as any)?.detail
        });
        throw error;
    } finally {
        client.release();
    }
}

export async function batchAddCards(cards: Card[], preserveOrder: boolean = false): Promise<void> {
    if (cards.length === 0) return;

    const client = await getDbClient();
    try {
        await client.query('BEGIN');

        // Get the boardId from the first card (all cards should be for the same board)
        const boardId = cards[0].boardId;

        // Get the current minimum order so we can insert below it without shifting existing cards
        let baseOrder = 0;
        if (!preserveOrder) {
            const minResult = await client.query(
                'SELECT COALESCE(MIN("order"), 0) AS min_order FROM cards WHERE board_id = $1',
                [boardId]
            );
            // New cards get orders: min-N, min-N+1, ..., min-1 (newest batch at top, preserving batch internal order)
            baseOrder = minResult.rows[0].min_order - cards.length;
        }

        // Separate template cards from regular cards
        const templateCards = cards.filter(c => c.templateKey);
        const regularCards = cards.filter(c => !c.templateKey);

        // Batch insert template cards if any
        if (templateCards.length > 0) {
            const templateValues: (string | number | null)[] = [];
            const templatePlaceholders: string[] = [];
            let paramIndex = 1;

            templateCards.forEach((card, index) => {
                const order = preserveOrder ? (card.order || 0) : (baseOrder + index);
                templateValues.push(
                    card.id,
                    card.boardId,
                    card.templateKey || null,
                    order,
                    card.color || '#6366f1'
                );
                templatePlaceholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`
                );
                paramIndex += 5;
            });

            await client.query(
                `INSERT INTO cards (id, board_id, template_key, "order", color) VALUES ${templatePlaceholders.join(',')}`,
                templateValues
            );
        }

        // Batch insert regular cards if any
        if (regularCards.length > 0) {
            const regularValues: (string | number | null)[] = [];
            const regularPlaceholders: string[] = [];
            let paramIndex = 1;

            // Regular cards continue the sequence after template cards
            const templateCount = preserveOrder ? 0 : templateCards.length;

            regularCards.forEach((card, index) => {
                const order = preserveOrder ? (card.order || 0) : (baseOrder + templateCount + index);
                regularValues.push(
                    card.id,
                    card.boardId,
                    card.label,
                    card.imageUrl,
                    card.audioUrl,
                    card.color || '#6366f1',
                    order,
                    card.category || 'Thing', // 'category' maps to 'type' column in DB (NOT NULL)
                    card.sourceBoardId || null // Track inherited cards from public boards
                );
                regularPlaceholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`
                );
                paramIndex += 9;
            });

            await client.query(
                `INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order", type, source_board_id) VALUES ${regularPlaceholders.join(',')}`,
                regularValues
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error batch adding cards', error, { cardCount: cards.length });
        throw error;
    } finally {
        client.release();
    }
}

export async function updateCard(updatedCard: Card): Promise<void> {
    const client = await getDbClient();
    try {
        logger.debug('Updating card', {
            cardId: updatedCard.id,
            label: updatedCard.label,
            imageUrl: updatedCard.imageUrl,
            audioUrl: updatedCard.audioUrl
        });

        // Note: 'category' maps to 'type' column in database (NOT NULL with default 'Thing')
        await client.query(
            'UPDATE cards SET label = $1, image_url = $2, audio_url = $3, color = $4, type = $5, board_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
            [updatedCard.label, updatedCard.imageUrl, updatedCard.audioUrl, updatedCard.color || '#6366f1', updatedCard.category || 'Thing', updatedCard.boardId, updatedCard.id]
        );
    } catch (error) {
        logger.error('Error updating card', error, { cardId: updatedCard.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteCard(id: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query('DELETE FROM cards WHERE id = $1', [id]);
        logger.debug('Card deleted', { cardId: id });
    } catch (error) {
        logger.error('Error deleting card', error, { cardId: id });
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get blob URLs for all cards in a board. Used for cleanup when deleting a board.
 * Only returns Vercel Blob URLs (https://*.blob.vercel-storage.com), not local/prebuilt URLs.
 */
export async function getBoardCardBlobUrls(boardId: string): Promise<string[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<{ image_url: string; audio_url: string }>(
            `SELECT image_url, audio_url FROM cards WHERE board_id = $1`,
            [boardId]
        );

        const urls: string[] = [];
        for (const row of result.rows) {
            if (row.image_url && row.image_url.includes('.blob.vercel-storage.com')) {
                urls.push(row.image_url);
            }
            if (row.audio_url && row.audio_url.includes('.blob.vercel-storage.com')) {
                urls.push(row.audio_url);
            }
        }
        return urls;
    } catch (error) {
        logger.error('Error getting board card blob URLs', error, { boardId });
        return [];
    } finally {
        client.release();
    }
}

/**
 * Check whether any card (in any board) still references an image URL.
 * Used before deleting a replaced board cover blob, since a cover can be
 * picked directly from a card's image. Returns true on error so callers
 * never delete a blob that might still be in use.
 */
export async function isImageUrlUsedByAnyCard(url: string): Promise<boolean> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT 1 FROM cards WHERE image_url = $1 LIMIT 1',
            [url]
        );
        return result.rows.length > 0;
    } catch (error) {
        logger.error('Error checking card image URL usage', error, { url });
        return true;
    } finally {
        client.release();
    }
}

export async function updateCardOrders(boardId: string, cardOrders: { id: string; order: number }[]): Promise<void> {
    if (cardOrders.length === 0) return;

    const client = await getDbClient();
    try {
        // Build a single UPDATE using unnest() to batch all order changes in one query
        const ids: string[] = [];
        const orders: number[] = [];
        for (const { id, order } of cardOrders) {
            ids.push(id);
            orders.push(order);
        }

        await client.query(
            `UPDATE cards SET "order" = v.new_order, updated_at = CURRENT_TIMESTAMP
             FROM unnest($1::text[], $2::int[]) AS v(card_id, new_order)
             WHERE cards.id = v.card_id AND cards.board_id = $3`,
            [ids, orders, boardId]
        );

        logger.debug('Card orders updated', { boardId, count: cardOrders.length });
    } catch (error) {
        logger.error('Error updating card orders', error, { boardId });
        throw error;
    } finally {
        client.release();
    }
}

// --- Boards ---

export async function getBoardCount(userId: string): Promise<number> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM boards WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        logger.error('Error counting boards', error, { userId });
        return 0;
    } finally {
        client.release();
    }
}

export async function getBoards(userId: string): Promise<Board[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<BoardRow & { card_count: string; first_card_image_url?: string; first_card_template_key?: string }>(
            `SELECT b.*, COUNT(c.id) as card_count,
                    fc.image_url as first_card_image_url,
                    fc.template_key as first_card_template_key
             FROM boards b
             LEFT JOIN cards c ON c.board_id = b.id
             LEFT JOIN LATERAL (
                 SELECT image_url, template_key FROM cards
                 WHERE board_id = b.id
                 ORDER BY "order" ASC, created_at ASC
                 LIMIT 1
             ) fc ON true
             WHERE b.user_id = $1
             GROUP BY b.id, fc.image_url, fc.template_key
             ORDER BY b.created_at DESC`,
            [userId]
        );

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            coverImageUrl: row.cover_image_url || undefined,
            fallbackCoverImageUrl: resolveFirstCardImage(row.first_card_image_url, row.first_card_template_key),
            cardCount: parseInt(row.card_count || '0')
        }));
    } catch (error) {
        logger.error('Error getting boards', error, { userId });
        return [];
    } finally {
        client.release();
    }
}

export async function addBoard(board: Board): Promise<void> {
    const client = await getDbClient();
    try {
        logger.info('Adding board', { boardId: board.id, userId: board.userId });
        await client.query(
            'INSERT INTO boards (id, user_id, name, description, created_at, is_public, creator_name, creator_image_url, owner_email, email_notifications_enabled, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [board.id, board.userId, board.name, board.description || '', board.createdAt, board.isPublic || false, board.creatorName, board.creatorImageUrl, board.ownerEmail || null, board.emailNotificationsEnabled ?? true, board.coverImageUrl || null]
        );
    } catch (error) {
        logger.error('Error adding board', error, { boardId: board.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function getBoard(id: string, retryOnNotFound: boolean = false): Promise<Board | undefined> {
    const startTime = Date.now();

    const starterBoard = STARTER_BOARDS.find(b => b.id === id);
    if (starterBoard) {
        return starterBoard;
    }

    const client = await getDbClient();
    try {
        const queryStart = Date.now();
        let result = await client.query<BoardRow>(
            'SELECT * FROM boards WHERE id = $1 LIMIT 1',
            [id]
        );
        let queryTime = Date.now() - queryStart;

        // If not found and retry is enabled, wait briefly and try again
        // This handles Postgres read replica lag on Vercel
        if (result.rows.length === 0 && retryOnNotFound) {
            logger.warn('Board not found on first attempt, retrying...', { boardId: id });
            await new Promise(resolve => setTimeout(resolve, 500));

            const retryStart = Date.now();
            result = await client.query<BoardRow>(
                'SELECT * FROM boards WHERE id = $1 LIMIT 1',
                [id]
            );
            queryTime += Date.now() - retryStart;
            logger.info('Retry completed', { boardId: id, found: result.rows.length > 0 });
        }

        if (result.rows.length === 0) {
            logger.info('Board not found', { boardId: id, query_duration_ms: queryTime });
            return undefined;
        }

        const row = result.rows[0];
        const totalTime = Date.now() - startTime;

        logger.debug('Board retrieved', {
            boardId: id,
            name: row.name,
            query_duration_ms: queryTime,
            total_duration_ms: totalTime
        });

        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            coverImageUrl: row.cover_image_url || undefined
        };
    } catch (error) {
        const totalTime = Date.now() - startTime;
        logger.error('Failed to get board', error, { boardId: id, duration_ms: totalTime });
        return undefined;
    } finally {
        client.release();
    }
}

export async function updateBoard(updatedBoard: Board): Promise<void> {
    const client = await getDbClient();
    try {
        logger.debug('Updating board', { boardId: updatedBoard.id });
        await client.query(
            'UPDATE boards SET name = $1, description = $2, is_public = $3, creator_name = $4, creator_image_url = $5, owner_email = $6, email_notifications_enabled = $7, cover_image_url = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9',
            [updatedBoard.name, updatedBoard.description || '', updatedBoard.isPublic || false, updatedBoard.creatorName, updatedBoard.creatorImageUrl, updatedBoard.ownerEmail || null, updatedBoard.emailNotificationsEnabled ?? true, updatedBoard.coverImageUrl || null, updatedBoard.id]
        );
    } catch (error) {
        logger.error('Error updating board', error, { boardId: updatedBoard.id });
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteBoard(id: string): Promise<void> {
    const client = await getDbClient();
    try {
        // Cards will be automatically deleted due to CASCADE
        await client.query('DELETE FROM boards WHERE id = $1', [id]);
        logger.info('Board deleted', { boardId: id });
    } catch (error) {
        logger.error('Error deleting board', error, { boardId: id });
        throw error;
    } finally {
        client.release();
    }
}

export async function getPublicBoards(): Promise<Board[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<BoardRow & { card_count: string; first_card_image_url?: string; first_card_template_key?: string }>(
            `SELECT b.*, COUNT(c.id) as card_count,
                    fc.image_url as first_card_image_url,
                    fc.template_key as first_card_template_key
             FROM boards b
             LEFT JOIN cards c ON c.board_id = b.id
             LEFT JOIN LATERAL (
                 SELECT image_url, template_key FROM cards
                 WHERE board_id = b.id
                 ORDER BY "order" ASC, created_at ASC
                 LIMIT 1
             ) fc ON true
             WHERE b.is_public = true
             GROUP BY b.id, fc.image_url, fc.template_key
             ORDER BY b.created_at DESC`
        );

        const dbBoards = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            coverImageUrl: row.cover_image_url || undefined,
            fallbackCoverImageUrl: resolveFirstCardImage(row.first_card_image_url, row.first_card_template_key),
            cardCount: parseInt(row.card_count || '0')
        }));

        const starterBoards = STARTER_BOARDS.map(b => ({
            ...b,
            fallbackCoverImageUrl: STARTER_CARDS[b.id]?.[0]?.imageUrl
        }));

        return [...starterBoards, ...dbBoards];
    } catch (error) {
        logger.error('Error getting public boards', error);
        return [];
    } finally {
        client.release();
    }
}

export async function getPublicBoardsWithInteractions(userId?: string): Promise<(Board & { likeCount: number, commentCount: number, isLikedByUser: boolean })[]> {
    const client = await getDbClient();
    try {
        // Fetch DB boards with counts using LEFT JOINs + GROUP BY
        const params: string[] = [];
        let userLikeJoin = '';
        let userLikeSelect = 'false as is_liked_by_user';

        if (userId) {
            params.push(userId);
            userLikeJoin = `LEFT JOIN board_likes ul ON ul.board_id = b.id AND ul.user_id = $1`;
            userLikeSelect = '(ul.id IS NOT NULL) as is_liked_by_user';
        }

        const result = await client.query(
            `SELECT
                b.id, b.user_id, b.name, b.description, b.created_at, b.is_public,
                b.creator_name, b.creator_image_url, b.owner_email, b.email_notifications_enabled,
                b.cover_image_url,
                fc.image_url as first_card_image_url,
                fc.template_key as first_card_template_key,
                (SELECT COUNT(*) FROM board_likes bl WHERE bl.board_id = b.id) as like_count,
                (SELECT COUNT(*) FROM board_comments bc WHERE bc.board_id = b.id) as comment_count,
                (SELECT COUNT(*) FROM cards c WHERE c.board_id = b.id) as card_count,
                ${userLikeSelect}
            FROM boards b
            LEFT JOIN LATERAL (
                SELECT image_url, template_key FROM cards
                WHERE board_id = b.id
                ORDER BY "order" ASC, created_at ASC
                LIMIT 1
            ) fc ON true
            ${userLikeJoin}
            WHERE b.is_public = true
            ORDER BY b.created_at DESC`,
            params
        );

        const dbBoards = result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            createdAt: row.created_at,
            isPublic: row.is_public || false,
            creatorName: row.creator_name,
            creatorImageUrl: row.creator_image_url,
            ownerEmail: row.owner_email,
            emailNotificationsEnabled: row.email_notifications_enabled ?? true,
            coverImageUrl: row.cover_image_url || undefined,
            fallbackCoverImageUrl: resolveFirstCardImage(row.first_card_image_url, row.first_card_template_key),
            likeCount: parseInt(row.like_count),
            commentCount: parseInt(row.comment_count),
            cardCount: parseInt(row.card_count || '0'),
            isLikedByUser: row.is_liked_by_user
        }));

        // Enrich starter boards with interaction counts in a single query
        const starterIds = STARTER_BOARDS.map(b => b.id);
        const starterParams: (string | string[])[] = [starterIds];
        let starterUserLikeJoin = '';
        let starterUserLikeSelect = 'false as is_liked_by_user';

        if (userId) {
            starterParams.push(userId);
            starterUserLikeJoin = `LEFT JOIN board_likes ul ON ul.board_id = bl.board_id AND ul.user_id = $2`;
            starterUserLikeSelect = '(ul.id IS NOT NULL) as is_liked_by_user';
        }

        const starterResult = await client.query(
            `SELECT
                bl.board_id,
                COUNT(DISTINCT bl.id) as like_count,
                COUNT(DISTINCT bc.id) as comment_count,
                ${starterUserLikeSelect}
            FROM (SELECT unnest($1::text[]) as board_id) ids
            LEFT JOIN board_likes bl ON bl.board_id = ids.board_id
            LEFT JOIN board_comments bc ON bc.board_id = ids.board_id
            ${starterUserLikeJoin}
            GROUP BY bl.board_id${userId ? ', ul.id' : ''}`,
            starterParams
        );

        const starterInteractions = new Map<string, { likeCount: number, commentCount: number, isLikedByUser: boolean }>();
        starterResult.rows.forEach(row => {
            if (row.board_id) {
                starterInteractions.set(row.board_id, {
                    likeCount: parseInt(row.like_count),
                    commentCount: parseInt(row.comment_count),
                    isLikedByUser: row.is_liked_by_user
                });
            }
        });

        const enrichedStarterBoards = STARTER_BOARDS.map(b => ({
            ...b,
            fallbackCoverImageUrl: STARTER_CARDS[b.id]?.[0]?.imageUrl,
            likeCount: starterInteractions.get(b.id)?.likeCount ?? 0,
            commentCount: starterInteractions.get(b.id)?.commentCount ?? 0,
            isLikedByUser: starterInteractions.get(b.id)?.isLikedByUser ?? false
        }));

        return [...enrichedStarterBoards, ...dbBoards];
    } catch (error) {
        logger.error('Error getting public boards with interactions', error, { userId });
        throw error;
    } finally {
        client.release();
    }
}

// ============= LIKES =============

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function likeBoardByUser(boardId: string, userId: string, userName: string): Promise<void> {
    const client = await getDbClient();
    try {
        const id = crypto.randomUUID();
        await client.query(
            'INSERT INTO board_likes (id, user_id, board_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, board_id) DO NOTHING',
            [id, userId, boardId]
        );
    } finally {
        client.release();
    }
}

export async function unlikeBoardByUser(boardId: string, userId: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            'DELETE FROM board_likes WHERE user_id = $1 AND board_id = $2',
            [userId, boardId]
        );
    } finally {
        client.release();
    }
}

export async function getBoardLikeCount(boardId: string): Promise<number> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM board_likes WHERE board_id = $1',
            [boardId]
        );
        return parseInt(result.rows[0].count);
    } finally {
        client.release();
    }
}

export async function isUserLikedBoard(boardId: string, userId: string): Promise<boolean> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT 1 FROM board_likes WHERE user_id = $1 AND board_id = $2',
            [userId, boardId]
        );
        return result.rows.length > 0;
    } finally {
        client.release();
    }
}

// ============= COMMENTS =============

interface CommentRow {
    id: string;
    user_id: string;
    board_id: string;
    content: string;
    commenter_name: string;
    commenter_image_url: string | null;
    created_at: Date;
    updated_at: Date;
    is_edited: boolean;
}

export async function addComment(
    boardId: string,
    userId: string,
    content: string,
    commenterName: string,
    commenterImageUrl?: string
): Promise<BoardComment> {
    const client = await getDbClient();
    try {
        const id = crypto.randomUUID();
        const result = await client.query<CommentRow>(
            `INSERT INTO board_comments (id, user_id, board_id, content, commenter_name, commenter_image_url)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, userId, boardId, content, commenterName, commenterImageUrl || null]
        );

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        };
    } finally {
        client.release();
    }
}

export async function updateComment(commentId: string, userId: string, content: string): Promise<BoardComment | null> {
    const client = await getDbClient();
    try {
        const result = await client.query<CommentRow>(
            `UPDATE board_comments
             SET content = $1, updated_at = NOW(), is_edited = true
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [content, commentId, userId]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        };
    } finally {
        client.release();
    }
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'DELETE FROM board_comments WHERE id = $1 AND user_id = $2',
            [commentId, userId]
        );
        return result.rowCount !== null && result.rowCount > 0;
    } finally {
        client.release();
    }
}

export async function getCommentsByBoard(boardId: string): Promise<BoardComment[]> {
    const client = await getDbClient();
    try {
        const result = await client.query<CommentRow>(
            'SELECT * FROM board_comments WHERE board_id = $1 ORDER BY created_at DESC',
            [boardId]
        );

        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            boardId: row.board_id,
            content: row.content,
            commenterName: row.commenter_name,
            commenterImageUrl: row.commenter_image_url || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            isEdited: row.is_edited
        }));
    } finally {
        client.release();
    }
}

export async function getBoardCommentCount(boardId: string): Promise<number> {
    const client = await getDbClient();
    try {
        const result = await client.query(
            'SELECT COUNT(*) FROM board_comments WHERE board_id = $1',
            [boardId]
        );
        return parseInt(result.rows[0].count);
    } finally {
        client.release();
    }
}

// ============= APP SETTINGS =============

export async function getAppSettings(): Promise<Record<string, string>> {
    const client = await getDbClient();
    try {
        const result = await client.query<{ key: string; value: string }>(
            'SELECT key, value FROM app_settings'
        );
        const settings: Record<string, string> = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }
        return settings;
    } catch (error) {
        logger.error('Error getting app settings', error);
        return {};
    } finally {
        client.release();
    }
}

export async function getAppSetting(key: string): Promise<string | null> {
    const client = await getDbClient();
    try {
        const result = await client.query<{ value: string }>(
            'SELECT value FROM app_settings WHERE key = $1',
            [key]
        );
        return result.rows.length > 0 ? result.rows[0].value : null;
    } catch (error) {
        logger.error('Error getting app setting', error, { key });
        return null;
    } finally {
        client.release();
    }
}

export async function updateAppSetting(key: string, value: string): Promise<void> {
    const client = await getDbClient();
    try {
        await client.query(
            `INSERT INTO app_settings (key, value, updated_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
        );
        logger.info('App setting updated', { key, value });
    } catch (error) {
        logger.error('Error updating app setting', error, { key });
        throw error;
    } finally {
        client.release();
    }
}
