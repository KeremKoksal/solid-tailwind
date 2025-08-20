import { createSignal, Show, For, onMount, createMemo, createEffect } from 'solid-js';

import Heading from '~/components/Headings';
import Combobox from '~/components/Combobox';
import Pagination from '~/components/Pagination';
import Modal from '~/components/Modal';
import Room_isil from '~/components/Room_isil';

interface Building {
    id: number;
    name: string;
    gender: boolean | string;
    private: boolean;
}
function isMale(g: unknown): boolean {
    if (typeof g === "boolean") return g;
    if (typeof g === "number") return g === 1;
    if (typeof g === "string") {
        const s = g.toLowerCase();
        if (["erkek", "male", "true", "1"].includes(s)) return true;
        if (["kız", "kiz", "female", "false", "0"].includes(s)) return false;
    }
    return false;
}


async function fetchRpc(method: string, params?: any) {
    const response = await fetch('https://dema.cc.metu.edu.tr/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (data.error) throw new Error(data.error.message);
    return data.result;
}

export default function BuildingIsilPage() {
    const [buildingList, setBuildingList] = createSignal<Building[]>([]);
    const [error, setError] = createSignal('');
    const [currentPage, setCurrentPage] = createSignal(1);
    const [selectedBuildingId, setSelectedBuildingId] = createSignal<number | null>(null);
    const [editingBuilding, setEditingBuilding] = createSignal<Building | null>(null);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const resultsPerPage = 10;
    const [genderFilter, setGenderFilter] = createSignal('');



    const filteredList = createMemo(() => {
        const genderVal = genderFilter();
        if (!genderVal) return buildingList();
        return buildingList().filter((b) => isMale(b.gender) === (genderVal === "true"));
    });

    const sortedList = createMemo(() => [...filteredList()].sort((a, b) => a.id - b.id));
    const paginatedList = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return sortedList().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() => Math.ceil(filteredList().length / resultsPerPage));

    async function loadBuildings() {
        try {
            const response = await fetchRpc('list_buildings', {
                filters: {},
                list_options: {
                    limit: 1000,
                    offset: 0,
                    sort: [{ field: 'id', direction: 'desc' }],
                },
            });
            setBuildingList(response?.data || []);
            setError('');
        } catch (e: any) {
            setError('Listeleme hatası: ' + e.message);
        }
    }

    async function deleteBuilding(id: number) {
        try {
            await fetchRpc('delete_building', { id });
            setBuildingList((prev) => prev.filter((b) => b.id !== id));
            setError('');
        } catch (e: any) {
            setError('Silme hatası: ' + e.message);
        }
    }

    async function updateBuilding(updated: Building) {
        try {
            await fetchRpc("update_building", {
                id: updated.id,
                data: {
                    name: updated.name,
                    gender: updated.gender,
                    private: updated.private,
                    manager_id: 1000,
                },
            });


            setBuildingList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setShowEditModal(false);
            setError('');
        } catch (e: any) {
            setError('Güncelleme hatası: ' + e.message);
        }
    }

    onMount(() => {
        loadBuildings();
    });


    createEffect(() => {
        const currentId = selectedBuildingId();
        if (currentId !== null && !buildingList().some(b => b.id === currentId)) {
            setSelectedBuildingId(null);
        }
    });

    async function handleDelete(id: number) {
        const ok = confirm("Bu yurdu silmek istediğine emin misin?");
        if (!ok) return;
        try {
            await fetchRpc("delete_building", { id });
            setBuildingList(prev => prev.filter(b => b.id !== id));
            setError("");

            if (selectedBuildingId() === id) {
                setSelectedBuildingId(null);
            }
        } catch (e: any) {
            setError("Silme hatası: " + e.message);
        }
    }



    return (
        <main class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-4 sm:space-y-6">
            <Heading
                title="Yurt Yönetimi"
                description="Yurtları listeleyebilir, filtreleyebilir, güncelleyebilir ve odalarını görebilirsiniz."
            >
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Combobox
                        name="gender"
                        placeholder="Cinsiyet seçiniz"
                        options={[
                            {value: '', label: 'Tümü'},
                            {value: 'true', label: 'Erkek'},
                            {value: 'false', label: 'Kız'},
                        ]}
                        value={genderFilter()}
                        onChange={(val) => {
                            setGenderFilter(val);
                            setCurrentPage(1);
                        }}
                        class="w-full sm:w-48"
                    />
                    <button
                        class="w-full sm:w-auto bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm font-medium"
                        onClick={() => {
                            loadBuildings();
                            setCurrentPage(1);
                        }}
                    >
                        Yurtları Yenile
                    </button>
                    <button
                        class="w-full sm:w-auto bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                        onClick={() => {
                            setEditingBuilding({
                                id: -1,
                                name: '',
                                gender: true,
                                private: false
                            });
                            setShowEditModal(true);
                        }}
                    >
                        Yurt Ekle
                    </button>
                </div>
            </Heading>

            <Show when={error()}>
                <div class="bg-red-200 text-red-800 p-3 rounded text-sm">{error()}</div>
            </Show>

            <div class="flex flex-col xl:flex-row gap-4 sm:gap-6">
                <div class={selectedBuildingId() !== null
                    ? "w-full xl:w-1/2 bg-white shadow-sm border border-gray-200 h-fit"
                    : "w-full bg-white shadow-sm border border-gray-200 h-fit"}>


                    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-bold text-purple-900">
                            Yurtlar
                        </h2>
                    </div>


                    <div class="hidden md:block">
                        <table class="min-w-full">
                            <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">Yurt
                                    Adı
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">Cinsiyet</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">Özel</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-pink-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                            <For each={paginatedList()}>
                                {(building) => (
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {building.id}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-pink-900">
                                            {building.name}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isMale(building.gender)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-pink-100 text-pink-800'
                            }`}>
                                {isMale(building.gender) ? 'Erkek' : 'Kız'}
                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                building.private
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {building.private ? 'Evet' : 'Hayır'}
                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                            <button
                                                class="text-blue-600 hover:text-blue-900"
                                                onClick={() => setSelectedBuildingId(building.id)}
                                            >
                                                Odaları Gör
                                            </button>
                                            <button
                                                class="text-green-600 hover:text-green-900"
                                                onClick={() => {
                                                    setEditingBuilding(building);
                                                    setShowEditModal(true);
                                                }}
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                class="text-red-600 hover:text-red-900"
                                                onClick={() => handleDelete(building.id)}
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </For>
                            </tbody>
                        </table>
                    </div>

                    <div class="md:hidden divide-y divide-gray-500">
                        <For each={paginatedList()}>
                            {(building) => (
                                <div class="p-4 hover:bg-indigo-50 transition duration-150">
                                    <div class="flex justify-between items-start mb-3">
                                        <div>
                                            <div class="font-bold text-indigo-700 text-lg">#{building.id}</div>
                                            <div class="text-gray-900 font-medium">{building.name}</div>
                                        </div>
                                        <div class="flex flex-col gap-1 text-right">
                                            <span class={`px-2 py-1 text-xs font-medium rounded-full inline-block
                                                ${isMale(building.gender) ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                {isMale(building.gender) ? 'Erkek' : 'Kız'}
                                            </span>
                                            <span class={`px-2 py-1 text-xs font-semibold rounded-full inline-block
                                                ${building.private ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {building.private ? 'Özel' : 'Genel'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        <button
                                            class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                            onClick={() => setSelectedBuildingId(building.id)}
                                        >
                                            Odaları Gör
                                        </button>
                                        <button
                                            class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                                            onClick={() => {
                                                setEditingBuilding(building);
                                                setShowEditModal(true);
                                            }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            class="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                            onClick={() => handleDelete(building.id)}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>

                    <Show when={filteredList().length > 0}>
                        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage()}
                                totalPages={totalPages()}
                                totalResults={filteredList().length}
                                resultsPerPage={resultsPerPage}
                                onPageChange={setCurrentPage}
                                showResultsInfo={false}
                            />
                        </div>
                    </Show>
                    <Show when={filteredList().length === 0}>
                        <div class="text-center py-12">
                            <div
                                class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Yurt bulunamadı</h3>
                            <p class="text-gray-500">
                                {genderFilter()
                                    ? `${genderFilter() === 'true' ? 'Erkek' : 'Kız'} yurdu bulunamadı.`
                                    : 'Henüz sistemde kayıtlı yurt bulunmuyor.'
                                }
                            </p>
                        </div>
                    </Show>
                </div>

                <Show when={selectedBuildingId() !== null}>
                    <div class="w-full xl:w-1/2">
                        <Room_isil
                            buildingId={selectedBuildingId()!}
                            onClose={() => setSelectedBuildingId(null)}
                        />
                    </div>
                </Show>

            </div>

            <Show when={showEditModal() && editingBuilding()}>
                <Modal
                    open={showEditModal()}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingBuilding(null);
                    }}
                    title=""
                >

                    <div class="bg-white text-gray-900">
                        <h3 class="text-xl font-semibold mb-3">
                            {editingBuilding()!.id === -1 ? 'Yeni Yurt Ekle' : 'Yurdu Güncelle'}
                        </h3>

                        <form
                            class="space-y-4"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const b = editingBuilding()!;
                                try {
                                    if (b.id === -1) {
                                        await fetchRpc("create_building", {
                                            data: {
                                                name: b.name,
                                                gender: b.gender,
                                                private: b.private,
                                                manager_id: 1000
                                            }
                                        });
                                    } else {
                                        await fetchRpc("update_building", {
                                            id: b.id,
                                            data: {name: b.name, gender: b.gender, private: b.private},
                                        });
                                    }
                                    await loadBuildings();
                                    setShowEditModal(false);
                                    setEditingBuilding(null);
                                } catch (err: any) {
                                    setError((b.id === -1 ? "Ekleme" : "Güncelleme") + " hatası: " + err.message);
                                }
                            }}
                        >
                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Yurt Adı</label>
                                <input
                                    type="text"
                                    class="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 shadow-sm outline-none
                   focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-gray-900 placeholder:text-gray-400"
                                    value={editingBuilding()!.name}
                                    onInput={(e) =>
                                        setEditingBuilding(prev => prev ? {...prev, name: e.currentTarget.value} : prev)
                                    }
                                    placeholder="Örn: 1. Yurt"
                                    required
                                />
                            </div>

                            <div class="space-y-1">
                                <label class="text-sm font-medium text-gray-700">Cinsiyet</label>
                                <select
                                    class="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 shadow-sm outline-none
                   focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-gray-900"
                                    value={isMale(editingBuilding()!.gender) ? "true" : "false"}
                                    onChange={(e) =>
                                        setEditingBuilding(prev => prev ? {
                                            ...prev,
                                            gender: e.currentTarget.value === "true"
                                        } : prev)
                                    }
                                    required
                                >
                                    <option value="true">Erkek</option>
                                    <option value="false">Kız</option>
                                </select>
                            </div>

                            <div
                                class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3">
                                <label class="text-sm text-gray-700" for="privateChk">Özel mi?</label>
                                <input
                                    id="privateChk"
                                    type="checkbox"
                                    class="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={!!editingBuilding()!.private}
                                    onChange={(e) =>
                                        setEditingBuilding(prev => prev ? {
                                            ...prev,
                                            private: e.currentTarget.checked
                                        } : prev)
                                    }
                                />
                            </div>

                            <div class="flex flex-col sm:flex-row justify-end gap-2">
                                <button
                                    type="button"
                                    class="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingBuilding(null);
                                    }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    class="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow order-1 sm:order-2"
                                >
                                    {editingBuilding()!.id === -1 ? 'Ekle' : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </Show>

        </main>
    );
}