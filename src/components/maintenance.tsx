import { Component, createSignal, For, Show, onMount } from 'solid-js';
import {
    FaSolidUser,
    FaSolidTag,
    FaSolidCalendar,
    FaSolidPaperclip,
    FaSolidExclamation,
    FaSolidPlus,
    FaSolidCheck,
    FaSolidX,
    FaSolidEdit,
    FaSolidTrash
} from 'solid-icons/fa';

// API Base URL
const API_BASE_URL = 'https://dema.cc.metu.edu.tr/api';

// Types
interface MaintenanceType {
    id: number;
    type_name: string;
    description: string;
    category: string;
    estimated_duration_hours: number;
    priority_level: string;
    requires_specialist: boolean;
    is_active: boolean;
}

interface MaintenanceRequest {
    id?: number;
    student_id: number;
    room_id: number;
    type_id: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    status?: string;
    created_at?: string;
    scheduled_date?: string;
    attachments?: File[];
}

interface MaintenanceStatus {
    id: number;
    name: string;
    description: string;
}

const Maintenance: Component = () => {
    // Form States
    const [baslik, setBaslik] = createSignal('');
    const [aciklama, setAciklama] = createSignal('');
    const [kategori, setKategori] = createSignal<number | null>(null);
    const [oncelik, setOncelik] = createSignal<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [tarih, setTarih] = createSignal('');
    const [dosyalar, setDosyalar] = createSignal<File[]>([]);

    // Student & Room Info (bu değerler normalde authentication'dan gelir)
    const [studentId] = createSignal(1001);
    const [roomId] = createSignal(1001);

    // Data States
    const [maintenanceTypes, setMaintenanceTypes] = createSignal<MaintenanceType[]>([]);
    const [previousRequests, setPreviousRequests] = createSignal<MaintenanceRequest[]>([]);
    const [maintenanceStatuses, setMaintenanceStatuses] = createSignal<MaintenanceStatus[]>([]);
    const [activeDropdown, setActiveDropdown] = createSignal<string | null>(null);

    // UI States
    const [isLoading, setIsLoading] = createSignal(false);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [hata, setHata] = createSignal('');
    const [basariMesaji, setBasariMesaji] = createSignal('');
    const [activeTab, setActiveTab] = createSignal<'new' | 'history'>('new');

    // Priority Options
    const priorityOptions = [
        { value: 'low', label: 'Düşük', color: 'text-green-600', bgColor: 'bg-green-100' },
        { value: 'medium', label: 'Orta', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { value: 'high', label: 'Yüksek', color: 'text-red-600', bgColor: 'bg-red-100' },
        { value: 'urgent', label: 'Acil', color: 'text-red-800', bgColor: 'bg-red-200' }
    ];

    // Status Options
    const statusOptions = {
        'pending': { label: 'Beklemede', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
        'in_progress': { label: 'Devam Ediyor', color: 'text-blue-800', bgColor: 'bg-blue-100' },
        'completed': { label: 'Tamamlandı', color: 'text-green-800', bgColor: 'bg-green-100' },
        'cancelled': { label: 'İptal Edildi', color: 'text-red-800', bgColor: 'bg-red-100' }
    };

    // API Functions
    const apiCall = async (method: string, params: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/rpc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method,
                    params
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'API hatası oluştu');
            }

            return data.result;
        } catch (error) {
            console.error('API Call Error:', error);
            throw error;
        }
    };

    // Load maintenance types and previous requests on component mount
    onMount(async () => {
        try {
            setIsLoading(true);

            // Load maintenance types
            const types = await apiCall('list_maintenance_types', {
                filters: {
                    is_active: { $eq: true }
                },
                list_options: {
                    limit: 100,
                    offset: 0,
                    order_by: 'category',
                    direction: 'asc'
                }
            });

            setMaintenanceTypes(types.data || []);

            // Load maintenance statuses
            const statuses = await apiCall('list_maintenance_status', {
                list_options: {
                    limit: 20,
                    offset: 0,
                    order_by: 'name',
                    direction: 'asc'
                }
            });

            setMaintenanceStatuses(statuses.data || []);

            // Load previous maintenance requests
            const requests = await apiCall('list_own_maintenances', {
                student_id: studentId(),
                list_options: {
                    limit: 20,
                    offset: 0,
                    order_by: 'created_at',
                    direction: 'desc'
                }
            });

            setPreviousRequests(requests.data || []);
        } catch (error) {
            setHata('Veriler yüklenirken hata oluştu');
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    });

    // Handle file upload
    const handleFileChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const files = Array.from(input.files || []);

        // Max 5 files, max 10MB per file
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                setHata('Dosya boyutu 10MB\'dan küçük olmalı');
                return false;
            }
            return true;
        }).slice(0, 5);

        setDosyalar(prev => [...prev, ...validFiles]);
    };

    // Remove file
    const removeFile = (index: number) => {
        setDosyalar(prev => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validation
        if (!baslik().trim()) {
            setHata('Başlık girmelisiniz!');
            return;
        }
        if (!aciklama().trim()) {
            setHata('Açıklama girmelisiniz!');
            return;
        }
        if (!kategori()) {
            setHata('Bakım kategorisi seçmelisiniz!');
            return;
        }

        setHata('');
        setIsSubmitting(true);

        try {
            const requestData: MaintenanceRequest = {
                student_id: studentId(),
                room_id: roomId(),
                type_id: kategori()!,
                priority: oncelik(),
                description: `${baslik()}\n\n${aciklama()}`,
                ...(tarih() && { scheduled_date: new Date(tarih()).toISOString() })
            };

            const result = await apiCall('create_own_maintenance', {
                data: requestData
            });

            setBasariMesaji('Bakım talebi başarıyla oluşturuldu!');

            // Reset form
            setBaslik('');
            setAciklama('');
            setKategori(null);
            setOncelik('medium');
            setTarih('');
            setDosyalar([]);

            // Reload previous requests
            const requests = await apiCall('list_own_maintenances', {
                student_id: studentId(),
                list_options: {
                    limit: 20,
                    offset: 0,
                    order_by: 'created_at',
                    direction: 'desc'
                }
            });

            setPreviousRequests(requests.data || []);

            setTimeout(() => {
                setBasariMesaji('');
            }, 5000);

        } catch (error) {
            setHata('Bakım talebi oluşturulurken hata oluştu: ' + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle update request
    const handleUpdate = async (requestId: number) => {
        try {
            // Önce mevcut talebi al
            const request = await apiCall('get_own_maintenance', {
                maintenance_id: requestId,
                student_id: studentId()
            });

            if (request) {
                // Formu doldur ve yeni talep sekmesine geç
                setBaslik(request.description.split('\n\n')[0] || '');
                setAciklama(request.description.split('\n\n').slice(1).join('\n\n') || '');
                setKategori(request.type_id);
                setOncelik(request.priority);
                setTarih(request.scheduled_date || '');
                setActiveTab('new');

                setBasariMesaji('Bakım talebi düzenleme moduna alındı');
                setTimeout(() => setBasariMesaji(''), 3000);
            }
        } catch (error) {
            setHata('Talep yüklenirken hata oluştu: ' + (error as Error).message);
        }
    };

    // Handle delete request
    const handleDelete = async (requestId: number) => {
        if (!confirm('Bu bakım talebini silmek istediğinize emin misiniz?')) return;

        try {
            await apiCall('delete_own_maintenance', {
                maintenance_id: requestId,
                student_id: studentId(),
                cancellation_reason: "Kullanıcı tarafından iptal edildi"
            });

            setBasariMesaji('Bakım talebi başarıyla silindi!');

            // Reload previous requests
            const requests = await apiCall('list_own_maintenances', {
                student_id: studentId(),
                list_options: {
                    limit: 20,
                    offset: 0,
                    order_by: 'created_at',
                    direction: 'desc'
                }
            });

            setPreviousRequests(requests.data || []);

            setTimeout(() => setBasariMesaji(''), 3000);
        } catch (error) {
            setHata('Bakım talebi silinirken hata oluştu: ' + (error as Error).message);
        }
    };

    // Get category display info
    const getCategoryInfo = (category: string) => {
        const categoryMap: Record<string, { icon: string; color: string; bgColor: string }> = {
            'elektrik': { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            'tesisat': { icon: '🚿', color: 'text-blue-600', bgColor: 'bg-blue-100' },
            'mobilya': { icon: '🪑', color: 'text-amber-600', bgColor: 'bg-amber-100' },
            'temizlik': { icon: '🧽', color: 'text-green-600', bgColor: 'bg-green-100' },
            'güvenlik': { icon: '🔒', color: 'text-red-600', bgColor: 'bg-red-100' },
            'diğer': { icon: '🔧', color: 'text-gray-600', bgColor: 'bg-gray-100' }
        };
        return categoryMap[category] || categoryMap['diğer'];
    };

    const selectedType = () => maintenanceTypes().find(t => t.id === kategori());
    const selectedPriority = () => priorityOptions.find(p => p.value === oncelik());

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status display info
    const getStatusInfo = (statusName: string) => {
        const status = maintenanceStatuses().find(s => s.name === statusName);
        if (!status) return statusOptions.pending;

        if (status.name.toLowerCase().includes('tamamlandı') || status.name.toLowerCase().includes('completed')) {
            return statusOptions.completed;
        } else if (status.name.toLowerCase().includes('devam') || status.name.toLowerCase().includes('progress')) {
            return statusOptions.in_progress;
        } else if (status.name.toLowerCase().includes('iptal') || status.name.toLowerCase().includes('cancelled')) {
            return statusOptions.cancelled;
        } else {
            return statusOptions.pending;
        }
    };

    return (
        <div class="min-h-screen bg-gray-50 py-8 px-4">
            <div class="max-w-6xl mx-auto">
                {/* Header */}
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">Bakım Talebi Yönetimi</h1>
                    <p class="text-gray-600">Oda bakım sorunlarınızı bildirin ve takip edin</p>
                </div>

                {/* Info Card - Moved to top as requested */}
                <div class="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <h3 class="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <FaSolidExclamation class="text-blue-500" />
                        Bakım Talep Süreci
                    </h3>
                    <div class="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                            <div>
                                <div class="font-medium">Talep Oluştur</div>
                                <div class="text-blue-700">Sorununuzu detaylı şekilde bildirin</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                            <div>
                                <div class="font-medium">Değerlendirme</div>
                                <div class="text-blue-700">Yurt yönetimi talebi inceleyecek</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                            <div>
                                <div class="font-medium">Çözüm</div>
                                <div class="text-blue-700">Bakım ekibi sorunu çözecek</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div class="flex border-b border-gray-200 mb-6">
                    <button
                        class={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${activeTab() === 'new' ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        Yeni Talep Oluştur
                    </button>
                    <button
                        class={`py-3 px-6 font-medium text-sm rounded-t-lg transition-colors ${activeTab() === 'history' ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Önceki Taleplerim
                    </button>
                </div>

                <Show when={activeTab() === 'new'}>
                    {/* Main Form Card */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                        {/* Form Content */}
                        <div class="p-6 space-y-6">
                            {/* Title Input */}
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-gray-700">Talep Başlığı</label>
                                <input
                                    type="text"
                                    class="w-full p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-lg transition-all duration-200"
                                    placeholder="Örn: 305 No'lu Odada Su Kaçağı"
                                    value={baslik()}
                                    onInput={(e) => setBaslik(e.currentTarget.value)}
                                />
                            </div>

                            {/* Category Selection */}
                            <div class="space-y-2 relative">
                                <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FaSolidTag class="text-gray-500" size={16} />
                                    Bakım Kategorisi
                                </label>

                                <Show when={isLoading()}>
                                    <div class="flex items-center gap-2 p-4 bg-gray-100 rounded-lg">
                                        <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                        <span class="text-gray-600">Kategoriler yükleniyor...</span>
                                    </div>
                                </Show>

                                <Show when={!isLoading()}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveDropdown(activeDropdown() === 'category' ? null : 'category')}
                                        class={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${kategori()
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Show when={selectedType()} fallback={
                                            <span class="text-gray-500">Kategori seçin...</span>
                                        }>
                                            <div class="flex items-center gap-3">
                                                <span class="text-xl">{getCategoryInfo(selectedType()!.category).icon}</span>
                                                <div>
                                                    <div class="font-medium text-gray-900">{selectedType()!.type_name}</div>
                                                    <div class="text-sm text-gray-600 capitalize">{selectedType()!.category}</div>
                                                </div>
                                            </div>
                                        </Show>
                                    </button>

                                    <Show when={activeDropdown() === 'category'}>
                                        <div class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
                                            <div class="p-2">
                                                <For each={maintenanceTypes()}>
                                                    {(type) => {
                                                        const categoryInfo = getCategoryInfo(type.category);
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setKategori(type.id);
                                                                    setActiveDropdown(null);
                                                                }}
                                                                class={`w-full p-3 rounded-md text-left hover:bg-gray-50 transition-colors ${kategori() === type.id ? 'bg-blue-50 border border-blue-200' : ''
                                                                }`}
                                                            >
                                                                <div class="flex items-start gap-3">
                                                                    <span class="text-xl mt-0.5">{categoryInfo.icon}</span>
                                                                    <div class="flex-1">
                                                                        <div class="font-medium text-gray-900">{type.type_name}</div>
                                                                        <div class="text-sm text-gray-600 capitalize">{type.category}</div>
                                                                        <Show when={type.description}>
                                                                            <div class="text-xs text-gray-500 mt-1">{type.description}</div>
                                                                        </Show>
                                                                    </div>
                                                                    <Show when={type.requires_specialist}>
                                                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                                                            Uzman
                                                                        </span>
                                                                    </Show>
                                                                </div>
                                                            </button>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                        </div>
                                    </Show>
                                </Show>
                            </div>

                            {/* Priority Selection */}
                            <div class="space-y-2 relative">
                                <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FaSolidExclamation class="text-gray-500" size={16} />
                                    Öncelik Seviyesi
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setActiveDropdown(activeDropdown() === 'priority' ? null : 'priority')}
                                    class={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${oncelik()
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div class="flex items-center gap-3">
                                        <span class={`px-3 py-1 rounded-full text-sm font-medium ${selectedPriority()!.bgColor} ${selectedPriority()!.color}`}>
                                            {selectedPriority()!.label}
                                        </span>
                                    </div>
                                </button>

                                <Show when={activeDropdown() === 'priority'}>
                                    <div class="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                                        <div class="p-2">
                                            <For each={priorityOptions}>
                                                {(priority) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOncelik(priority.value as any);
                                                            setActiveDropdown(null);
                                                        }}
                                                        class={`w-full p-3 rounded-md text-left hover:bg-gray-50 transition-colors ${oncelik() === priority.value ? 'bg-blue-50 border border-blue-200' : ''
                                                        }`}
                                                    >
                                                        <div class="flex items-center gap-3">
                                                            <span class={`px-3 py-1 rounded-full text-sm font-medium ${priority.bgColor} ${priority.color}`}>
                                                                {priority.label}
                                                            </span>
                                                        </div>
                                                    </button>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </div>

                            {/* Description Textarea */}
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-gray-700">Detaylı Açıklama</label>
                                <textarea
                                    rows={6}
                                    class="w-full p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none transition-all duration-200"
                                    placeholder="Sorunu detaylı olarak açıklayın. Ne zaman başladığını, nasıl oluştuğunu belirtin..."
                                    value={aciklama()}
                                    onInput={(e) => setAciklama(e.currentTarget.value)}
                                />
                                <div class="text-xs text-gray-500 text-right">
                                    {aciklama().length}/1000
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FaSolidCalendar class="text-gray-500" size={16} />
                                    Tercih Edilen Tarih (İsteğe bağlı)
                                </label>
                                <input
                                    type="datetime-local"
                                    class="w-full p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200"
                                    value={tarih()}
                                    onInput={(e) => setTarih(e.currentTarget.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                            {/* File Upload */}
                            <div class="space-y-3">
                                <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FaSolidPaperclip class="text-gray-500" size={16} />
                                    Dosya/Fotoğraf Ekle (İsteğe bağlı)
                                </label>

                                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FaSolidPlus class="text-2xl text-gray-400 mb-2" />
                                        <p class="text-sm text-gray-600">
                                            <span class="font-semibold">Dosya seçmek için tıklayın</span>
                                        </p>
                                        <p class="text-xs text-gray-500">PNG, JPG, PDF (Max 10MB, 5 dosya)</p>
                                    </div>
                                    <input
                                        type="file"
                                        class="hidden"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                {/* File List */}
                                <Show when={dosyalar().length > 0}>
                                    <div class="space-y-2">
                                        <h4 class="text-sm font-medium text-gray-700">Seçilen Dosyalar:</h4>
                                        <For each={dosyalar()}>
                                            {(file, index) => (
                                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                                    <div class="flex items-center gap-3">
                                                        <FaSolidPaperclip class="text-gray-400" size={16} />
                                                        <div>
                                                            <div class="text-sm font-medium text-gray-900">{file.name}</div>
                                                            <div class="text-xs text-gray-500">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index())}
                                                        class="text-red-500 hover:text-red-700 transition-colors"
                                                    >
                                                        <FaSolidX size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        <Show when={hata()}>
                            <div class="px-6 py-3 bg-red-50 border-t border-red-200">
                                <div class="text-red-700 text-sm flex items-center gap-2">
                                    <FaSolidX class="text-red-500" size={16} />
                                    {hata()}
                                </div>
                            </div>
                        </Show>

                        <Show when={basariMesaji()}>
                            <div class="px-6 py-3 bg-green-50 border-t border-green-200">
                                <div class="text-green-700 text-sm flex items-center gap-2">
                                    <FaSolidCheck class="text-green-500" size={16} />
                                    {basariMesaji()}
                                </div>
                            </div>
                        </Show>

                        {/* Submit Button */}
                        <div class="px-6 py-4 bg-gray-50 border-t">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting()}
                                class={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${isSubmitting()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                            >
                                <Show when={isSubmitting()} fallback="Bakım Talebi Oluştur">
                                    <div class="flex items-center justify-center gap-2">
                                        <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Gönderiliyor...
                                    </div>
                                </Show>
                            </button>
                        </div>
                    </div>
                </Show>

                <Show when={activeTab() === 'history'}>
                    {/* Previous Requests Card */}
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="p-6">
                            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaSolidCalendar class="text-blue-500" />
                                Önceki Bakım Taleplerim
                            </h2>

                            <Show when={previousRequests().length === 0}>
                                <div class="text-center py-8 text-gray-500">
                                    <FaSolidTag class="mx-auto text-3xl text-gray-300 mb-3" />
                                    <p>Henüz hiç bakım talebi oluşturmamışsınız.</p>
                                </div>
                            </Show>

                            <Show when={previousRequests().length > 0}>
                                <div class="overflow-x-auto">
                                    <table class="w-full">
                                        <thead>
                                        <tr class="border-b border-gray-200">
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Talep No</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öncelik</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                                            <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                                        </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                        <For each={previousRequests()}>
                                            {(request) => {
                                                const type = maintenanceTypes().find(t => t.id === request.type_id);
                                                const priority = priorityOptions.find(p => p.value === request.priority);
                                                const statusInfo = getStatusInfo(request.status || 'pending');

                                                return (
                                                    <tr class="hover:bg-gray-50">
                                                        <td class="py-3 px-4 text-sm font-medium text-gray-900">#{request.id}</td>
                                                        <td class="py-3 px-4 text-sm text-gray-700">
                                                            <Show when={type} fallback="-">
                                                                <div class="flex items-center gap-2">
                                                                    <span>{getCategoryInfo(type!.category).icon}</span>
                                                                    <span>{type!.type_name}</span>
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{request.description}</td>
                                                        <td class="py-3 px-4">
                                                            <Show when={priority}>
                                                                    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority!.bgColor} ${priority!.color}`}>
                                                                        {priority!.label}
                                                                    </span>
                                                            </Show>
                                                        </td>
                                                        <td class="py-3 px-4">
                                                                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                                                    {statusInfo.label}
                                                                </span>
                                                        </td>
                                                        <td class="py-3 px-4 text-sm text-gray-700">
                                                            {request.created_at ? formatDate(request.created_at) : '-'}
                                                        </td>
                                                        <td class="py-3 px-4 text-sm font-medium">
                                                            <div class="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleUpdate(request.id!)}
                                                                    class="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                                                                    title="Düzenle"
                                                                >
                                                                    <FaSolidEdit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(request.id!)}
                                                                    class="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                                                                    title="Sil"
                                                                >
                                                                    <FaSolidTrash size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>
                    </div>
                </Show>
            </div>

            {/* Backdrop for dropdowns */}
            <Show when={activeDropdown()}>
                <div
                    class="fixed inset-0 z-40 bg-black bg-opacity-10"
                    onClick={() => setActiveDropdown(null)}
                />
            </Show>
        </div>
    );
};

export default Maintenance;