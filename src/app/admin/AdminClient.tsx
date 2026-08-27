'use client';

import { useState, useMemo } from 'react';
import { Settings, Save, Loader2, Shield, LayoutGrid, Users, Lock, Globe, Image as ImageIcon, Heart, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Board } from '@/types';

interface SettingConfig {
    key: string;
    label: string;
    description: string;
    min: number;
    max: number;
    defaultValue: string;
}

const SETTINGS_CONFIG: SettingConfig[] = [
    {
        key: 'max_boards_per_user',
        label: 'Max Boards Per User',
        description: 'The maximum number of boards each user can create.',
        min: 1,
        max: 1000,
        defaultValue: '5',
    },
    {
        key: 'max_cards_per_board',
        label: 'Max Cards Per Board',
        description: 'The maximum number of cards allowed on a single board.',
        min: 1,
        max: 10000,
        defaultValue: '100',
    },
];

interface AdminClientProps {
    initialSettings: Record<string, string>;
    boards: Board[];
}

export default function AdminClient({ initialSettings, boards }: AdminClientProps) {
    const [activeTab, setActiveTab] = useState<'boards' | 'settings'>('boards');
    const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
    const [saving, setSaving] = useState<string | null>(null);

    const handleSave = async (key: string, value: string) => {
        const config = SETTINGS_CONFIG.find(s => s.key === key);
        if (!config) return;

        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < config.min || numValue > config.max) {
            toast.error(`${config.label} must be between ${config.min} and ${config.max}`);
            return;
        }

        setSaving(key);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: numValue }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || 'Failed to save');
                return;
            }

            setSettings(prev => ({ ...prev, [key]: String(numValue) }));
            toast.success(`${config.label} updated to ${numValue}`);
        } catch {
            toast.error('Failed to save setting');
        } finally {
            setSaving(null);
        }
    };

    // Group boards by user ID/email
    const boardsByUser = useMemo(() => {
        const grouped = boards.reduce((acc, board) => {
            const userKey = board.userId || 'Unknown';
            if (!acc[userKey]) {
                acc[userKey] = {
                    creatorName: board.creatorName || 'Unknown User',
                    ownerEmail: board.ownerEmail || 'No Email',
                    boards: [],
                    totalCards: 0,
                };
            } else {
                if (board.ownerEmail && acc[userKey].ownerEmail === 'No Email') {
                    acc[userKey].ownerEmail = board.ownerEmail;
                }
                if (board.creatorName && acc[userKey].creatorName === 'Unknown User') {
                    acc[userKey].creatorName = board.creatorName;
                }
            }
            acc[userKey].boards.push(board);
            acc[userKey].totalCards += (board.cardCount || 0);
            return acc;
        }, {} as Record<string, { creatorName: string; ownerEmail: string; boards: Board[]; totalCards: number }>);
        return Object.entries(grouped);
    }, [boards]);

    const totalUsers = boardsByUser.length;
    const totalBoards = boards.length;
    const totalCards = boards.reduce((sum, b) => sum + (b.cardCount || 0), 0);
    const publicBoards = boards.filter(b => b.isPublic).length;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Manage application settings and view content</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-muted mb-8">
                    <button
                        onClick={() => setActiveTab('boards')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'boards'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            All Boards
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'settings'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Settings
                        </div>
                    </button>
                </div>

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="rounded-xl border border-muted bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold text-card-foreground">Usage Limits</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            These limits apply to all users. Changes take effect immediately.
                        </p>

                        <div className="space-y-6">
                            {SETTINGS_CONFIG.map(config => {
                                const currentValue = settings[config.key] || config.defaultValue;
                                return (
                                    <SettingRow
                                        key={config.key}
                                        config={config}
                                        value={currentValue}
                                        isSaving={saving === config.key}
                                        onSave={(value) => handleSave(config.key, value)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Boards Tab */}
                {activeTab === 'boards' && (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="rounded-xl border border-muted bg-card p-4 flex flex-col">
                                <span className="text-sm font-medium text-muted-foreground mb-1">Total Users</span>
                                <span className="text-2xl font-bold text-foreground">{totalUsers}</span>
                            </div>
                            <div className="rounded-xl border border-muted bg-card p-4 flex flex-col">
                                <span className="text-sm font-medium text-muted-foreground mb-1">Total Boards</span>
                                <span className="text-2xl font-bold text-foreground">{totalBoards}</span>
                            </div>
                            <div className="rounded-xl border border-muted bg-card p-4 flex flex-col">
                                <span className="text-sm font-medium text-muted-foreground mb-1">Total Cards</span>
                                <span className="text-2xl font-bold text-foreground">{totalCards}</span>
                            </div>
                            <div className="rounded-xl border border-muted bg-card p-4 flex flex-col">
                                <span className="text-sm font-medium text-muted-foreground mb-1">Public Boards</span>
                                <span className="text-2xl font-bold text-foreground">{publicBoards}</span>
                            </div>
                        </div>

                        {/* List of Users & Boards */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    User Content Overview
                                </h2>
                            </div>

                            {boardsByUser.map(([userId, userGroup]) => (
                                <div key={userId} className="rounded-xl border border-muted bg-card overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-3 border-b border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="font-medium text-card-foreground">{userGroup.creatorName}</h3>
                                            <p className="text-xs text-muted-foreground">{userGroup.ownerEmail} • ID: {userId}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="text-xs font-medium bg-background px-3 py-1 rounded-full border border-muted w-fit">
                                                {userGroup.boards.length} board{userGroup.boards.length !== 1 && 's'}
                                            </div>
                                            <div className="text-xs font-medium bg-background px-3 py-1 rounded-full border border-muted w-fit">
                                                {userGroup.totalCards} card{userGroup.totalCards !== 1 && 's'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-muted">
                                        {userGroup.boards.map(board => {
                                            const coverImage = board.coverImageUrl || board.fallbackCoverImageUrl;
                                            return (
                                                <div key={board.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                                                    <div className="flex items-start gap-4 overflow-hidden">
                                                        {/* Thumbnail */}
                                                        <div className="w-12 h-12 shrink-0 rounded-lg bg-muted border border-muted flex items-center justify-center overflow-hidden">
                                                            {coverImage ? (
                                                                <img src={coverImage} alt={board.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* Details */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                {board.isPublic ? (
                                                                    <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                ) : (
                                                                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                                )}
                                                                <h4 className="font-medium text-sm text-card-foreground truncate">{board.name}</h4>
                                                            </div>
                                                            {board.description && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-md mb-2">{board.description}</p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Created: {formatDate(board.createdAt)}
                                                                </span>
                                                                {board.updatedAt && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        Updated: {formatDate(board.updatedAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Metrics Pill */}
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-muted/50 shrink-0 self-start sm:self-center">
                                                        <div className="flex items-center gap-1.5" title="Total Cards">
                                                            <ImageIcon className="w-3.5 h-3.5" />
                                                            <span className="font-medium">{board.cardCount || 0}</span>
                                                        </div>
                                                        {board.isPublic && (
                                                            <>
                                                                <div className="w-px h-3 bg-border" />
                                                                <div className="flex items-center gap-1.5" title="Likes">
                                                                    <Heart className="w-3.5 h-3.5" />
                                                                    <span className="font-medium">{board.likeCount || 0}</span>
                                                                </div>
                                                                <div className="w-px h-3 bg-border" />
                                                                <div className="flex items-center gap-1.5" title="Comments">
                                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                                    <span className="font-medium">{board.commentCount || 0}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {boardsByUser.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-muted rounded-xl">
                                    No boards found in the system.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingRow({
    config,
    value,
    isSaving,
    onSave,
}: {
    config: SettingConfig;
    value: string;
    isSaving: boolean;
    onSave: (value: string) => void;
}) {
    const [editValue, setEditValue] = useState(value);
    const hasChanged = editValue !== value;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
                <label className="text-sm font-medium text-card-foreground">
                    {config.label}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {config.description}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 px-3 py-2 text-sm rounded-lg border border-muted bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                    onClick={() => onSave(editValue)}
                    disabled={!hasChanged || isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save
                </button>
            </div>
        </div>
    );
}
