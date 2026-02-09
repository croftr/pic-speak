'use client';

import { useState } from 'react';
import { Settings, Save, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function AdminClient({ initialSettings }: AdminClientProps) {
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

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Admin</h1>
                        <p className="text-sm text-muted-foreground">Manage application settings</p>
                    </div>
                </div>

                {/* Usage Limits Section */}
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
