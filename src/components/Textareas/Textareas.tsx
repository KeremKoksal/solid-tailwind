// src/components/Textareas/Textareas.tsx
import { Component, createSignal, For, Show } from 'solid-js';
import { FaSolidUser, FaSolidTag, FaSolidCalendar, FaSolidPaperclip } from 'solid-icons/fa';

type ActionType = 'atama' | 'etiket' | 'son-tarih' | 'dosya';

interface Action {
    type: ActionType;
    label: string;
    options?: { text: string; value: string }[];
    selected?: string;
    onSelect: (value: string) => void;
}

interface TextareasProps {
    onSubmit?: (data: {
        baslik: string;
        aciklama: string;
        atanan?: string;
        etiket?: string;
        sonTarih?: string;
        dosya?: string
    }) => void;
}

const Textareas: Component<TextareasProps> = (props) => {
    const [baslik, setBaslik] = createSignal('');
    const [aciklama, setAciklama] = createSignal('');
    const [activeDropdown, setActiveDropdown] = createSignal<ActionType | null>(null);
    const [dosya, setDosya] = createSignal<string | null>(null);
    const [atanan, setAtanan] = createSignal<string | undefined>();
    const [etiket, setEtiket] = createSignal<string | undefined>();
    const [sonTarih, setSonTarih] = createSignal<string | undefined>();
    const [hata, setHata] = createSignal('');
    const [basariMesaji, setBasariMesaji] = createSignal('');

    // Yurt arızaları için özel seçenekler
    const getActions = (): Action[] => [
        {
            type: 'atama',
            label: 'Atama Yap',
            options: [
                { text: 'Bakım Ekibi', value: 'bakim' },
                { text: 'Elektrikçi', value: 'elektrik' },
                { text: 'Su Tesisatçısı', value: 'tesisat' },
                { text: 'Temizlik Görevlisi', value: 'temizlik' },
                { text: 'Yurt Müdürü', value: 'mudur' },
                { text: 'Kantin Sorumlusu', value: 'kantin' },
                { text: 'Güvenlik', value: 'guvenlik' }
            ],
            selected: atanan(),
            onSelect: (value) => {
                setAtanan(value);
                setActiveDropdown(null);
            }
        },
        {
            type: 'etiket',
            label: 'Etiket Ekle',
            options: [
                { text: 'Acil Onarım', value: 'acil' },
                { text: 'Elektrik Arızası', value: 'elektrik' },
                { text: 'Su Kaçağı', value: 'su' },
                { text: 'Isınma Problemi', value: 'isinma' },
                { text: 'Temizlik', value: 'temizlik' },
                { text: 'Diğer', value: 'diger' },
                { text: 'Kritik', value: 'kritik' }
            ],
            selected: etiket(),
            onSelect: (value) => {
                setEtiket(value);
                setActiveDropdown(null);
            }
        },
        {
            type: 'son-tarih',
            label: 'Son Tarih',
            options: [
                { text: 'Bugün 18:00', value: 'bugun' },
                { text: 'Yarın Sabah', value: 'yarin-sabah' },
                { text: 'Yarın Akşam', value: 'yarin-aksam' },
                { text: '3 Gün İçinde', value: '3-gun' },
                { text: 'Bu Hafta', value: 'hafta' },
                { text: 'Gelecek Hafta', value: 'gelecek-hafta' }
            ],
            selected: sonTarih(),
            onSelect: (value) => {
                setSonTarih(value);
                setActiveDropdown(null);
            }
        },
        {
            type: 'dosya',
            label: 'Dosya Ekle',
            onSelect: () => {}
        }
    ];

    const handleSubmit = () => {
        if (!baslik().trim()) {
            setHata('Başlık girmelisiniz!');
            setBasariMesaji('');
            return;
        }
        if (!aciklama().trim()) {
            setHata('Açıklama girmelisiniz!');
            setBasariMesaji('');
            return;
        }

        setHata('');

        const formData = {
            baslik: baslik(),
            aciklama: aciklama(),
            atanan: atanan(),
            etiket: etiket(),
            sonTarih: sonTarih(),
            dosya: dosya() || undefined
        };

        // onSubmit prop'u varsa çağır, yoksa console'da göster
        if (props.onSubmit && typeof props.onSubmit === 'function') {
            props.onSubmit(formData);
        } else {
            console.log('Form Data:', formData);
        }

        // Başarı mesajı göster
        setBasariMesaji('Arıza raporu başarıyla gönderildi!');

        // Formu temizle
        setBaslik('');
        setAciklama('');
        setAtanan(undefined);
        setEtiket(undefined);
        setSonTarih(undefined);
        setDosya(null);

        // Başarı mesajını 3 saniye sonra gizle
        setTimeout(() => {
            setBasariMesaji('');
        }, 3000);
    };

    const handleFileChange = (e: Event) => {
        const selectedFile = (e.target as HTMLInputElement).files?.[0];
        if (selectedFile) setDosya(selectedFile.name);
    };

    return (
        <div class="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible relative">
            {/* Başlık ve Yazı Alanı */}
            <div class="p-4 space-y-4">
                <input
                    type="text"
                    class="w-full p-3 border-b border-gray-200 focus:border-blue-500 focus:outline-none text-lg font-medium"
                    placeholder="Arıza Başlığı (Örn: 305 No'lu Oda Su Kaçağı)"
                    value={baslik()}
                    onInput={(e) => setBaslik(e.currentTarget.value)}
                />

                <textarea
                    rows={5}
                    class="w-full p-3 border-0 focus:ring-0 resize-none text-gray-700 placeholder-gray-400"
                    placeholder="Arıza detaylarını buraya yazın..."
                    value={aciklama()}
                    onInput={(e) => setAciklama(e.currentTarget.value)}
                />
            </div>

            {/* Hata Mesajı */}
            <Show when={hata()}>
                <div class="px-4 py-2 bg-red-100 text-red-700 text-sm">
                    {hata()}
                </div>
            </Show>

            {/* Başarı Mesajı */}
            <Show when={basariMesaji()}>
                <div class="px-4 py-2 bg-green-100 text-green-700 text-sm">
                    {basariMesaji()}
                </div>
            </Show>

            {/* Özellikler */}
            <div class="flex flex-wrap justify-between items-center p-3 bg-gray-50 border-t gap-2 relative">
                <div class="flex flex-wrap gap-2">
                    <For each={getActions()}>
                        {(action) => (
                            <div class="relative">
                                {action.type === 'dosya' ? (
                                    <label class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm cursor-pointer border border-gray-300 hover:bg-gray-100">
                                        <FaSolidPaperclip class="text-gray-500" size={14} />
                                        {dosya() || action.label}
                                        <input
                                            type="file"
                                            class="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdown(
                                                    activeDropdown() === action.type ? null : action.type
                                                );
                                            }}
                                            class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm border border-gray-300 hover:bg-gray-100"
                                        >
                                            {action.type === 'atama' && (
                                                <FaSolidUser class="text-gray-500" size={14} />
                                            )}
                                            {action.type === 'etiket' && (
                                                <FaSolidTag class="text-gray-500" size={14} />
                                            )}
                                            {action.type === 'son-tarih' && (
                                                <FaSolidCalendar class="text-gray-500" size={14} />
                                            )}
                                            {action.selected
                                                ? `${action.label}: ${action.options?.find(o => o.value === action.selected)?.text}`
                                                : action.label
                                            }
                                        </button>

                                        <Show when={activeDropdown() === action.type}>
                                            <div
                                                class="absolute z-50 top-full mt-1 left-0 bg-white shadow-lg rounded-lg p-2 w-48 border border-gray-200 max-h-60 overflow-y-auto"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <For each={action.options}>
                                                    {(option) => (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                action.onSelect(option.value);
                                                            }}
                                                            class="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                                                        >
                                                            {option.text}
                                                        </button>
                                                    )}
                                                </For>
                                            </div>
                                        </Show>
                                    </>
                                )}
                            </div>
                        )}
                    </For>
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    class="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                    <span>Gönder</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Document click handler */}
            <Show when={activeDropdown()}>
                <div
                    class="fixed inset-0 z-40"
                    onClick={() => setActiveDropdown(null)}
                    style={{ "background": "transparent" }}
                />
            </Show>
        </div>
    );
};

export default Textareas;