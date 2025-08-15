// src/components/Building.tsx

import { createSignal, Show, For, onMount, createEffect } from 'solid-js';
import Headings from '../components/Headings';
import Pagination from '../components/Pagination';
import Combobox from '../components/Combobox';
import Rooms from '../components/rooms-N';
import LaundryPage from '../components/laundry-N';

export default function BuildingNisaPage() {
    interface Building {
        id: number;
        name: string;
        gender: boolean;
        private: boolean;
    }

    interface ComboboxOption {
        id: string;
        value: string;
        label: string;
    }

    async function fetchRpc(method: string, params?: any) {
        const token = typeof window !== 'undefined' ? localStorage.getItem("auth-token") : "";

        const response = await fetch('https://dema.cc.metu.edu.tr/api/rpc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('RPC Hatası:', data.error);
            throw new Error(data.error.message);
        }

        return data.result;
    }

    const [buildingList, setBuildingList] = createSignal<Building[]>([]);
    const [error, setError] = createSignal('');
    const [loading, setLoading] = createSignal(false);
    const [showModal, setShowModal] = createSignal(false);
    const [name, setName] = createSignal('');
    const [gender, setGender] = createSignal(true);
    const [isPrivate, setIsPrivate] = createSignal(false);
    const [editingId, setEditingId] = createSignal<number | null>(null);

    const [currentPage, setCurrentPage] = createSignal(1);
    const [pageSize] = createSignal(10);
    const [totalBuildings, setTotalBuildings] = createSignal(0);
    const [genderFilter, setGenderFilter] = createSignal<string>('');

    const [selectedBuildingId, setSelectedBuildingId] = createSignal<number | null>(null);
    const [selectedBuildingFeature, setSelectedBuildingFeature] = createSignal<'rooms' | 'laundry' | null>(null);

    async function loadBuildings() {
        setLoading(true);
        try {
            const offset = (currentPage() - 1) * pageSize();
            const filters: { gender?: boolean } = {};

            // Fixed filter logic
            if (genderFilter() === 'true') {
                filters.gender = true;
            } else if (genderFilter() === 'false') {
                filters.gender = false;
            }

            const result = await fetchRpc('list_buildings', {
                filters: filters,
                list_options: { limit: pageSize(), offset: offset },
            });

            let processedList: Building[] = [];
            let totalCount = 0;

            if (result) {
                if (Array.isArray(result)) {
                    processedList = result;
                    totalCount = result.length;
                } else if (result.data && Array.isArray(result.data)) {
                    processedList = result.data;
                    totalCount = result.total_count;
                } else if (result.data && typeof result.data === 'object' && result.data !== null) {
                    processedList = [result.data];
                    totalCount = 1;
                }
            }

            setBuildingList(processedList);
            setTotalBuildings(totalCount);
            setError('');
        } catch (e: any) {
            console.error('Listeleme hatası:', e);
            setError('Listeleme hatası: ' + e.message);
        }
        setLoading(false);
    }

    async function saveBuilding() {
        setLoading(true);
        try {
            if (editingId() !== null) {
                await fetchRpc('update_building', {
                    id: editingId(),
                    data: { name: name(), gender: gender(), private: isPrivate() },
                });
            } else {
                await fetchRpc('create_building', {
                    data: { name: name(), gender: gender(), private: isPrivate() },
                });
            }
            await loadBuildings();
            resetForm();
            setShowModal(false);
            setError('');
        } catch (e: any) {
            setError('Kayıt hatası: ' + e.message);
        }
        setLoading(false);
    }

    async function deleteBuilding(id: number) {
        if (!confirm('Silmek istediğine emin misin?')) return;
        setLoading(true);
        try {
            await fetchRpc('delete_building', { id });
            await loadBuildings();
            setError('');
        } catch (e: any) {
            setError('Silme hatası: ' + e.message);
        }
        setLoading(false);
    }

    function editBuilding(b: Building) {
        setName(b.name);
        setGender(b.gender);
        setIsPrivate(b.private);
        setEditingId(b.id);
        setShowModal(true);
    }

    function resetForm() {
        setName('');
        setGender(true);
        setIsPrivate(false);
        setEditingId(null);
    }

    function handleShowFeature(buildingId: number, feature: 'rooms' | 'laundry') {
        setSelectedBuildingId(buildingId);
        setSelectedBuildingFeature(feature);
    }

    function closeFeaturePanel() {
        setSelectedBuildingId(null);
        setSelectedBuildingFeature(null);
    }

    onMount(() => {
        loadBuildings();
    });

    createEffect(() => {
        genderFilter();
        currentPage();
        loadBuildings();
    });

    const totalPages = () => Math.ceil(totalBuildings() / pageSize());

    const comboboxOptions: ComboboxOption[] = [
        { id: 'all', value: 'Tümü', label: 'Tümü' },
        { id: 'erkek', value: 'Erkek', label: 'Erkek' },
        { id: 'kadın', value: 'Kadın', label: 'Kadın' }
    ];

    const getBuildingName = (id: number | null) => {
        return buildingList().find(b => b.id === id)?.name || "";
    };

    return (
        <main class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
            <div class="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <Show when={error()}>
                    <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm">
                        <div class="flex items-center">
                            <div class="bg-red-100 rounded-full p-2 mr-3">
                                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <span class="font-medium">{error()}</span>
                        </div>
                    </div>
                </Show>

                <div class="bg-white rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm">
                    <div class="p-6 border-b border-gray-100">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <Headings title="Yurt Yönetimi" />
                            <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
                                <button
                                    onClick={() => { resetForm(); setShowModal(true); }}
                                    class="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                >
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Yeni Yurt Ekle
                                </button>
                                <button
                                    onClick={loadBuildings}
                                    disabled={loading()}
                                    class="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {loading() ? 'Yükleniyor...' : 'Yurtları Listele'}
                                </button>
                                <div class="min-w-[200px]">
                                    <Combobox
                                        name="gender"
                                        placeholder="Cinsiyet seçiniz"
                                        options={[
                                            { value: '', label: 'Tümü' },
                                            { value: 'true', label: 'Erkek' },
                                            { value: 'false', label: 'Kız' },
                                        ]}
                                        value={genderFilter()}
                                        onChange={(val) => {
                                            setGenderFilter(val);
                                            setCurrentPage(1);
                                        }}
                                        class="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col xl:flex-row xl:space-x-6 p-6">
                        <div class="flex-1 min-h-0">
                            <div class="overflow-x-auto rounded-xl border border-gray-100">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Yurt Adı</th>
                                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cinsiyet</th>
                                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Özel</th>
                                        <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                                    </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-100">
                                    <Show
                                        when={buildingList().length > 0}
                                        fallback={
                                            <tr>
                                                <td colSpan="5" class="px-6 py-12 text-center text-gray-500">
                                                    <div class="flex flex-col items-center space-y-3">
                                                        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span class="font-medium">Henüz yurt bulunmamaktadır</span>
                                                        <span class="text-sm text-gray-400">Yeni bir yurt ekleyerek başlayın</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={buildingList()}>
                                            {(b) => (
                                                <tr class="hover:bg-blue-50/50 transition-colors duration-200">
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{b.id}</td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm font-medium text-gray-900">{b.name}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                            <span class={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${b.gender ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-pink-100 text-pink-800 border border-pink-200'}`}>
                                                                <div class={`w-2 h-2 rounded-full mr-2 ${b.gender ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                                                {b.gender ? 'Erkek' : 'Kadın'}
                                                            </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                            <span class={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${b.private ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                                                <div class={`w-2 h-2 rounded-full mr-2 ${b.private ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                                {b.private ? 'Evet' : 'Hayır'}
                                                            </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div class="flex items-center space-x-3">
                                                            <button
                                                                onClick={() => editBuilding(b)}
                                                                class="text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all duration-200"
                                                            >
                                                                Düzenle
                                                            </button>
                                                            <button
                                                                onClick={() => deleteBuilding(b.id)}
                                                                class="text-red-600 hover:text-red-800 font-medium hover:bg-red-50 px-2 py-1 rounded-lg transition-all duration-200"
                                                            >
                                                                Sil
                                                            </button>
                                                            <button
                                                                onClick={() => handleShowFeature(b.id, 'rooms')}
                                                                class="text-purple-600 hover:text-purple-800 font-medium hover:bg-purple-50 px-2 py-1 rounded-lg transition-all duration-200"
                                                            >
                                                                Odalar
                                                            </button>
                                                            <button
                                                                onClick={() => handleShowFeature(b.id, 'laundry')}
                                                                class="text-teal-600 hover:text-teal-800 font-medium hover:bg-teal-50 px-2 py-1 rounded-lg transition-all duration-200"
                                                            >
                                                                Çamaşırhane
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                    </tbody>
                                </table>
                            </div>

                            <div class="mt-6 flex justify-center">
                                <Show when={totalPages() > 1}>
                                    <Pagination
                                        totalPages={totalPages()}
                                        currentPage={currentPage()}
                                        onPageChange={setCurrentPage}
                                        totalResults={totalBuildings()}
                                        resultsPerPage={pageSize()}
                                    />
                                </Show>
                            </div>
                        </div>

                        <Show when={selectedBuildingId()}>
                            <div class="xl:w-1/2 xl:max-w-2xl mt-6 xl:mt-0">
                                <Show when={selectedBuildingFeature() === 'rooms'}>
                                    <Rooms
                                        buildingId={selectedBuildingId()!}
                                        buildingName={getBuildingName(selectedBuildingId())}
                                        onClose={closeFeaturePanel}
                                    />
                                </Show>
                                <Show when={selectedBuildingFeature() === 'laundry'}>
                                    <LaundryPage
                                        buildingId={selectedBuildingId()!}
                                        buildingName={getBuildingName(selectedBuildingId())}
                                        onClose={closeFeaturePanel}
                                    />
                                </Show>
                            </div>
                        </Show>
                    </div>
                </div>

                <Show when={showModal()}>
                    <div
                        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <div
                            class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div class="px-6 py-4 border-b border-gray-100">
                                <h2 class="text-xl font-bold text-gray-800">
                                    {editingId() !== null ? 'Yurt Güncelle' : 'Yeni Yurt Ekle'}
                                </h2>
                            </div>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    saveBuilding();
                                }}
                                class="p-6 space-y-4"
                            >
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Yurt Adı</label>
                                    <input
                                        type="text"
                                        value={name()}
                                        onInput={e => setName(e.currentTarget.value)}
                                        required
                                        class="block w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                        placeholder="Yurt adını giriniz"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Cinsiyet</label>
                                    <select
                                        value={gender() ? 'true' : 'false'}
                                        onChange={e => setGender(e.currentTarget.value === 'true')}
                                        class="block w-full border border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                                    >
                                        <option value="true">Erkek Yurdu</option>
                                        <option value="false">Kadın Yurdu</option>
                                    </select>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={isPrivate()}
                                        onChange={e => setIsPrivate(e.currentTarget.checked)}
                                        id="modalPrivateCheck"
                                        class="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                                    />
                                    <label for="modalPrivateCheck" class="text-sm font-medium text-gray-700">
                                        Özel yurt mu?
                                    </label>
                                </div>
                                <div class="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 rounded-xl transition-colors duration-200"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        class="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                                    >
                                        {editingId() !== null ? 'Güncelle' : 'Ekle'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Show>
            </div>
        </main>
    );
}