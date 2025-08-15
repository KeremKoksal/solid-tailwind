// src/routes/building.tsx

import { createSignal, Show, For, onMount, createEffect } from 'solid-js';
import Heading from '../components/Headings';
import Pagination from '../components/Pagination';
import Combobox from '../components/Combobox';
import Rooms from '../components/rooms-N';

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
    const [genderFilter, setGenderFilter] = createSignal<string>('all');

    const [selectedBuildingId, setSelectedBuildingId] = createSignal<number | null>(null);
    const [selectedBuildingName, setSelectedBuildingName] = createSignal<string | null>(null);

    function handleShowRooms(buildingId: number, buildingName: string) {
        setSelectedBuildingId(buildingId);
        setSelectedBuildingName(buildingName);
    }
    function handleCloseFeaturePanel() {
        setSelectedBuildingId(null);
        setSelectedBuildingName(null);
    }


    async function loadBuildings() {
        setLoading(true);
        try {
            const offset = (currentPage() - 1) * pageSize();
            const filters: { gender?: boolean } = {};
            if (genderFilter() === 'erkek') {
                filters.gender = true;
            } else if (genderFilter() === 'kadın') {
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

    return (
        <main class="p-8 bg-gray-100 min-h-screen space-y-8">
            <Show when={error()}>
                <div class="p-4 bg-red-100 text-red-700 rounded-lg shadow-md">{error()}</div>
            </Show>
            <div class="flex flex-col md:flex-row md:space-x-8 h-full">
                <div class="flex-1 overflow-hidden bg-white rounded-xl shadow-lg mt-6 md:mt-0">
                    <Heading title="Yurt Yönetimi">
                        <div class="flex flex-row space-x-2 items-center">
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                            >
                                Yeni Yurt Ekle
                            </button>
                            <button
                                onClick={loadBuildings}
                                class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                            >
                                Yurtları Listele
                            </button>
                        </div>

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
                            class="w-full sm:w-48"
                        />
                    </Heading>

                    <div class="p-4">
                        <table class="min-w-full table-auto text-sm text-gray-800 hidden md:table">
                            <thead class="bg-gray-200 border-b border-gray-300">
                            <tr>
                                <th class="px-6 py-3 text-left font-semibold">ID</th>
                                <th class="px-6 py-3 text-left font-semibold">Ad</th>
                                <th class="px-6 py-3 text-left font-semibold">Cinsiyet</th>
                                <th class="px-6 py-3 text-left font-semibold">Özel</th>
                                <th class="px-6 py-3 text-left font-semibold">İşlemler</th>
                            </tr>
                            </thead>
                            <tbody>
                            <Show
                                when={buildingList().length > 0}
                                fallback={
                                    <tr>
                                        <td colSpan="5" class="text-center p-8 text-gray-500">
                                            Veri yok
                                        </td>
                                    </tr>
                                }
                            >
                                <For each={buildingList()}>
                                    {(b) => (
                                        <tr class="border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                                            <td class="px-6 py-4">{b.id}</td>
                                            <td class="px-6 py-4">{b.name}</td>
                                            <td class="px-6 py-4">
                                                <span
                                                    class={`px-2 py-1 rounded font-semibold text-xs 
                                                          ${b.gender ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'}`}
                                                >
                                                    {b.gender ? 'Erkek' : 'Kadın'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4">
                                                <span
                                                    class={`px-2 py-1 rounded font-semibold text-xs 
                                                          ${b.private ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}
                                                >
                                                    {b.private ? 'Evet' : 'Hayır'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 space-x-3 flex items-center">
                                                <button
                                                    onClick={() => editBuilding(b)}
                                                    class="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => deleteBuilding(b.id)}
                                                    class="text-red-600 hover:text-red-800 font-medium ml-2"
                                                >
                                                    Sil
                                                </button>
                                                <button
                                                    onClick={() => handleShowRooms(b.id, b.name)}
                                                    class="text-purple-600 hover:text-purple-800 font-medium ml-2"
                                                >
                                                    Odaları Görüntüle
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                            </tbody>
                        </table>

                        <div class="md:hidden">
                            <Show
                                when={buildingList().length > 0}
                                fallback={
                                    <div class="text-center p-8 text-gray-500">
                                        Veri yok
                                    </div>
                                }
                            >
                                <For each={buildingList()}>
                                    {(b) => (
                                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm mb-4 border-b">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="text-lg font-bold text-gray-900">{b.name}</span>
                                                <span class="text-sm font-semibold text-gray-500">ID: {b.id}</span>
                                            </div>
                                            <div class="space-y-1 text-sm text-gray-700">
                                                <div class="flex justify-between items-center">
                                                    <strong>Cinsiyet:</strong>
                                                    <span
                                                        class={`px-2 py-1 rounded font-semibold text-xs 
                                                              ${b.gender ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'}`}
                                                    >
                                                        {b.gender ? 'Erkek' : 'Kadın'}
                                                    </span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <strong>Özel:</strong>
                                                    <span
                                                        class={`px-2 py-1 rounded font-semibold text-xs 
                                                              ${b.private ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}
                                                    >
                                                        {b.private ? 'Evet' : 'Hayır'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="mt-4 flex flex-wrap justify-between items-center gap-2">
                                                <button
                                                    onClick={() => editBuilding(b)}
                                                    class="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => deleteBuilding(b.id)}
                                                    class="text-red-600 hover:text-red-800 font-medium"
                                                >
                                                    Sil
                                                </button>
                                                <button
                                                    onClick={() => handleShowRooms(b.id, b.name)}
                                                    class="text-purple-600 hover:text-purple-800 font-medium"
                                                >
                                                    Odaları Görüntüle
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </div>
                    </div>

                    <div class="mt-4 flex justify-center p-4">
                        <Show when={totalPages() > 1}>
                            <Pagination
                                currentPage={currentPage()}
                                totalPages={totalPages()}
                                onPageChange={setCurrentPage}
                                totalResults={totalBuildings()}
                                resultsPerPage={pageSize()}
                            />
                        </Show>
                    </div>
                </div>

                <Show when={selectedBuildingId()}>
                    <div class="flex-1 mt-6 md:mt-0">
                        <Rooms
                            buildingId={selectedBuildingId()!}
                            buildingName={selectedBuildingName()!}
                            onClose={handleCloseFeaturePanel}
                        />
                    </div>
                </Show>
            </div>

            <Show when={showModal()}>
                <div
                    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 class="text-2xl font-bold mb-6 text-gray-800">{editingId() !== null ? 'Yurt Güncelle' : 'Yeni Yurt Ekle'}</h2>
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                saveBuilding();
                            }}
                            class="space-y-6"
                        >
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Adı</label>
                                <input
                                    type="text"
                                    value={name()}
                                    onInput={e => setName(e.currentTarget.value)}
                                    required
                                    class="block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                                <select
                                    value={gender() ? 'true' : 'false'}
                                    onChange={e => setGender(e.currentTarget.value === 'true')}
                                    class="block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="true">Erkek</option>
                                    <option value="false">Kadın</option>
                                </select>
                            </div>
                            <div class="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={isPrivate()}
                                    onChange={e => setIsPrivate(e.currentTarget.checked)}
                                    id="modalPrivateCheck"
                                    class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label for="modalPrivateCheck" class="text-sm font-medium text-gray-700">Özel mi?</label>
                            </div>
                            <div class="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    class="text-gray-600 hover:text-gray-900 font-medium py-2 px-4 transition-colors duration-200"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                >
                                    İptal
                                </button>
                                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
                                    {editingId() !== null ? 'Güncelle' : 'Ekle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>
        </main>
    );
}