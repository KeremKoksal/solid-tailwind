
import { createSignal, For } from 'solid-js';

export default function BadgeExample() {
    const [badges, setBadges] = createSignal([
        { text: 'Varsayılan', color: 'gray' },
        { text: 'Başarılı', color: 'green' },
        { text: 'Uyarı', color: 'yellow' },
        { text: 'Hata', color: 'red' },
        { text: 'Bilgi', color: 'blue' },
        { text: 'Mor', color: 'purple' },
        { text: 'Çivit', color: 'indigo' },
        { text: 'Pembe', color: 'pink' }
    ]);

    const [newBadgeText, setNewBadgeText] = createSignal('');
    const [newBadgeColor, setNewBadgeColor] = createSignal('gray');

    const colorClasses = {
        gray: 'bg-white text-gray-900 ring-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700',
        red: 'bg-white text-red-700 ring-red-300 dark:bg-gray-900 dark:text-red-400 dark:ring-red-800',
        yellow: 'bg-white text-yellow-800 ring-yellow-300 dark:bg-gray-900 dark:text-yellow-400 dark:ring-yellow-800',
        green: 'bg-white text-green-700 ring-green-300 dark:bg-gray-900 dark:text-green-400 dark:ring-green-800',
        blue: 'bg-white text-blue-700 ring-blue-300 dark:bg-gray-900 dark:text-blue-400 dark:ring-blue-800',
        indigo: 'bg-white text-indigo-700 ring-indigo-300 dark:bg-gray-900 dark:text-indigo-400 dark:ring-indigo-800',
        purple: 'bg-white text-purple-700 ring-purple-300 dark:bg-gray-900 dark:text-purple-400 dark:ring-purple-800',
        pink: 'bg-white text-pink-700 ring-pink-300 dark:bg-gray-900 dark:text-pink-400 dark:ring-pink-800'
    };

    const colorMap = {
        gray: 'bg-gray-200 dark:bg-gray-700',
        red: 'bg-red-200 dark:bg-red-700',
        yellow: 'bg-yellow-200 dark:bg-yellow-700',
        green: 'bg-green-200 dark:bg-green-700',
        blue: 'bg-blue-200 dark:bg-blue-700',
        indigo: 'bg-indigo-200 dark:bg-indigo-700',
        purple: 'bg-purple-200 dark:bg-purple-700',
        pink: 'bg-pink-200 dark:bg-pink-700'
    };

    const addBadge = () => {
        if (newBadgeText().trim()) {
            setBadges([...badges(), { text: newBadgeText().trim(), color: newBadgeColor() }]);
            setNewBadgeText('');
        }
    };

    const removeBadge = (index: number) => {
        setBadges(badges().filter((_, i) => i !== index));
    };

    const updateBadgeText = (index: number, newText: string) => {
        const updatedBadges = badges().map((badge, i) =>
            i === index ? { ...badge, text: newText } : badge
        );
        setBadges(updatedBadges);
    };

    const updateBadgeColor = (index: number, newColor: string) => {
        const updatedBadges = badges().map((badge, i) =>
            i === index ? { ...badge, color: newColor } : badge
        );
        setBadges(updatedBadges);
    };

    return (
        <div class="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300 max-w-2xl mx-auto">
            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rozet Metni
                        </label>
                        <input
                            type="text"
                            value={newBadgeText()}
                            onInput={(e) => setNewBadgeText((e.target as HTMLInputElement).value)}
                            placeholder="Rozet metni girin..."
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rozet Rengi
                        </label>
                        <div class="relative">
                            <select
                                value={newBadgeColor()}
                                onChange={(e) => setNewBadgeColor((e.target as HTMLSelectElement).value)}
                                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {Object.keys(colorClasses).map((color) => (
                                    <option value={color}>
                                        {color.charAt(0).toUpperCase() + color.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <div class={`absolute inset-y-0 right-3 flex items-center pr-2 pointer-events-none`}>
                                <span class={`w-4 h-4 rounded-full ${colorMap[(newBadgeColor() as keyof typeof colorMap)] || 'bg-gray-200 dark:bg-gray-700'} border border-gray-400 dark:border-gray-500`}></span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            onClick={addBadge}
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-full sm:w-auto"
                        >
                            Rozet Ekle
                        </button>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Eklenen Rozetler
                </h3>

                <div class="flex flex-wrap gap-3">
                    <For each={badges()}>
                        {(badge, index) => (
                            <div class="group relative inline-block">
                <span
                    class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-all
                    ${colorClasses[(badge.color as keyof typeof colorClasses)]}
                  `}
                >
                  {badge.text}
                </span>


                                <div class="absolute -top-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-700 rounded-md shadow-lg border border-gray-600 p-1 gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto whitespace-nowrap">
                                    <input
                                        type="text"
                                        value={badge.text}
                                        onInput={(e) => updateBadgeText(index(), (e.target as HTMLInputElement).value)}
                                        class="w-20 px-1 py-0.5 text-xs border border-gray-500 rounded bg-gray-800 text-gray-100 focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                                    />
                                    <select
                                        value={badge.color}
                                        onChange={(e) => updateBadgeColor(index(), (e.target as HTMLSelectElement).value)}
                                        class="px-1 py-0.5 text-xs border border-gray-500 rounded bg-gray-800 text-gray-100 focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        {Object.keys(colorClasses).map((color) => (
                                            <option value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => removeBadge(index())}
                                        class="px-1 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
}