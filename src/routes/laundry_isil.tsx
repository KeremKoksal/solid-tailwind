import { createSignal, Show, For, onMount, createMemo, createEffect } from 'solid-js';
import Heading from '~/components/Headings';
import Combobox from '~/components/Combobox';
import Pagination from '~/components/Pagination';
import Modal from '~/components/Modal';
import LaundryMachine_isil from '~/components/LaundryMachine_isil';
import LaundryReservation_isil from '~/components/LaundryReservation_isil';

interface Laundry {
    id: number;
    name: string;
    building_id: number;
}

interface CurrentUser {
    id: number;
    building_id: number;
}

interface SelectedMachine {
    id: number;
    building_id: number;
    duration: number;
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

export default function LaundryIsilPage() {
    const [laundryList, setLaundryList] = createSignal<Laundry[]>([]);
    const [allowedLaundries, setAllowedLaundries] = createSignal<Laundry[]>([]);
    const [onlyMine, setOnlyMine] = createSignal(false);
    const [error, setError] = createSignal('');
    const [currentPage, setCurrentPage] = createSignal(1);
    const [buildingFilter, setBuildingFilter] = createSignal('');
    const [editing, setEditing] = createSignal<Laundry | null>(null);
    const [showModal, setShowModal] = createSignal(false);
    const [selectedLaundryId, setSelectedLaundryId] = createSignal<number | null>(null);
    const [selectedMachine, setSelectedMachine] = createSignal<SelectedMachine | null>(null);
    const [currentUser, setCurrentUser] = createSignal<CurrentUser>({ id: 1000, building_id: 0 });

    const resultsPerPage = 10;

    createEffect(() => {
        if (error()) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    });

    const activeList = createMemo(() => {
        const base = onlyMine() ? allowedLaundries() : laundryList();
        const val = buildingFilter();
        if (!val) return base;
        return base.filter((l) => String(l.building_id) === val);
    });

    const paginatedList = createMemo(() => {
        const sorted = [...activeList()].sort((a, b) => a.id - b.id);
        const start = (currentPage() - 1) * resultsPerPage;
        return sorted.slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() => Math.ceil(activeList().length / resultsPerPage));

    async function loadLaundry() {
        try {
            const response = await fetchRpc('list_laundrys', {
                filters: {},
                list_options: {
                    limit: 1000,
                    offset: 0,
                    sort: [{ field: 'id', direction: 'desc' }],
                },
            });
            setLaundryList(response?.data || []);
            setError('');
        } catch (e: any) {
            setError('Listeleme hatası: ' + e.message);
        }
    }

    async function loadAllowedLaundries() {
        try {
            const response = await fetchRpc('list_student_allowed_laundrys', {
                filters: {},
                list_options: {
                    limit: 1000,
                    offset: 0,
                },
            });
            setAllowedLaundries(response?.data || []);
            setError('');
        } catch (e: any) {
            setError('Öğrenciye açık listeleme hatası: ' + e.message);
        }
    }

    async function loadCurrentUser() {
        try {
            setCurrentUser({ id: 1000, building_id: 0 });
        } catch (e: any) {
            setError('Kullanıcı bilgileri yükleme hatası: ' + e.message);
        }
    }

    async function updateLaundry(updated: Laundry) {
        try {
            await fetchRpc('update_laundry', {
                id: updated.id,
                data: {
                    name: updated.name,
                    building_id: updated.building_id,
                },
            });
            await loadLaundry();
            setShowModal(false);
            setEditing(null);
        } catch (e: any) {
            setError('Güncelleme hatası: ' + e.message);
        }
    }

    function updateEditingField(field: keyof Laundry, value: string | number) {
        const current = editing();
        if (current) {
            setEditing({ ...current, [field]: value });
        }
    }

    onMount(() => {
        loadLaundry();
        loadCurrentUser();
    });

    createEffect(() => {
        selectedLaundryId();
        setSelectedMachine(null);
    });


    return (
        <main class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-4 sm:space-y-6">
            <Heading
                title="Çamaşırhane Yönetimi"
                description="Çamaşırhaneleri listeleyebilir, filtreleyebilir ve düzenleyebilirsiniz."
            >
                <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <Combobox
                        name="building_id"
                        placeholder="Yurt ID filtrele"
                        options={Array.from(new Set((onlyMine() ? allowedLaundries() : laundryList()).map((l) => l.building_id))).map((id) => ({
                            value: String(id),
                            label: 'Yurt ID: ' + id,
                        }))}
                        value={buildingFilter()}
                        onChange={(val) => {
                            setBuildingFilter(val);
                            setCurrentPage(1);
                            setSelectedLaundryId(null);
                            setSelectedMachine(null);

                        }}
                        class="w-full sm:w-48"
                    />
                    <button
                        class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors w-full sm:w-auto"
                        onClick={async () => {
                            await loadLaundry();
                            if (onlyMine()) await loadAllowedLaundries();
                            setCurrentPage(1);
                        }}

                    >
                        Yenile
                    </button>
                    <button
                        class="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors w-full sm:w-auto"
                        onClick={async () => {
                            if (!onlyMine()) await loadAllowedLaundries();
                            setOnlyMine(prev => !prev);
                            setBuildingFilter('');
                            setSelectedLaundryId(null);
                            setSelectedMachine(null);
                            setCurrentPage(1);
                        }}

                    >
                        {onlyMine() ? 'Tüm Çamaşırhaneler' : 'Sadece Benimkiler'}
                    </button>
                    <button
                        class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto"
                        onClick={() => {
                            setEditing({ id: -1, name: '', building_id: 0 });
                            setShowModal(true);
                        }}
                    >
                        Yeni Ekle
                    </button>
                </div>
            </Heading>

            <Show when={error()}>
                <div class="bg-red-200 text-red-800 p-3 rounded text-sm border-l-4 border-red-500">
                    {error()}
                </div>
            </Show>


            <div class="flex flex-col lg:flex-row gap-4">

                <div class={selectedLaundryId() !== null ? "w-full lg:w-1/2" : "w-full"}>

                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

                        <div class="bg-gradient-to-r from-gray-50 to-purple-100 px-6 py-3 border-b border-gray-200">
                            <h3 class="text-xl font-bold text-black">
                                Çamaşırhaneler
                            </h3>
                            <div class="text-sm text-gray-600">
                                Rezervasyon yapmak için bir makineye tıklayın
                            </div>
                        </div>


                        <div class="p-6">

                            <div class="block lg:hidden space-y-4">
                                <For each={paginatedList()}>
                                    {(l) => (
                                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div class="flex justify-between items-start mb-3">
                                                <div class="flex-1">
                                                    <div class="text-lg font-extrabold text-indigo-800">{l.name}</div>
                                                    <div class="text-sm text-gray-500 font-medium">Yurt ID: {l.building_id}</div>
                                                </div>
                                                <div class="text-lg font-bold text-pink-600">#{l.id}</div>
                                            </div>
                                            <button
                                                class="w-full px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-700 transition-all"
                                                onClick={() => setSelectedLaundryId(l.id)}
                                            >
                                                <span>Makineleri Gör</span>
                                            </button>
                                        </div>
                                    )}
                                </For>
                            </div>

                            <div class="hidden lg:block overflow-x-auto">
                                <table class="min-w-full table-auto text-sm text-gray-700">
                                    <thead class="bg-gray-100 text-gray-700 text-xs font-medium uppercase">
                                    <tr>
                                        <th class="px-6 py-3 text-left">ID</th>
                                        <th class="px-6 py-3 text-left">Çamaşırhane Adı</th>
                                        <th class="px-6 py-3 text-left">İşlemler</th>
                                    </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-100">
                                    <For each={paginatedList()}>
                                        {(l) => (
                                            <tr class="hover:bg-indigo-50 transition duration-150">
                                                <td class="px-6 py-3 font-bold text-pink-600">{l.id}</td>
                                                <td class="px-6 py-3">
                                                    <div class="text-base font-extrabold text-indigo-800">{l.name}</div>
                                                    <div class="text-xs text-gray-500 font-medium">Yurt ID: {l.building_id}</div>
                                                </td>
                                                <td class="px-6 py-3 space-x-2">
                                                    <button
                                                        class="px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-700 transition-all"
                                                        onClick={() => setSelectedLaundryId(l.id)}
                                                    >
                                                        <span>Makineleri Gör</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                    </tbody>
                                </table>
                            </div>

                            <Show when={activeList().length > 0}>
                                <div class="mt-4">
                                    <Pagination
                                        currentPage={currentPage()}
                                        totalPages={totalPages()}
                                        totalResults={activeList().length}
                                        resultsPerPage={resultsPerPage}
                                        onPageChange={setCurrentPage}
                                        showResultsInfo={false}
                                    />
                                </div>
                            </Show>
                            <Show when={activeList().length === 0}>
                                <div class="text-center py-12">
                                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                        </svg>
                                    </div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                                        {onlyMine() ? 'Size ait çamaşırhane bulunamadı' : 'Çamaşırhane bulunamadı'}
                                    </h3>
                                    <p class="text-gray-500">
                                        {onlyMine()
                                            ? 'Henüz size tanımlanmış çamaşırhane bulunmuyor.'
                                            : 'Henüz sistemde kayıtlı çamaşırhane bulunmuyor.'
                                        }
                                    </p>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                <Show when={selectedLaundryId() !== null}>
                    <div class="w-full lg:w-1/2">
                        <LaundryMachine_isil
                            laundryId={selectedLaundryId()!}
                            onOpenReservation={(machineId: number, duration: number, machineBuildingId?: number) => {
                                setSelectedMachine({
                                    id: machineId,
                                    building_id: machineBuildingId || 0,
                                    duration: duration
                                });
                            }}
                            onClose={() => setSelectedLaundryId(null)}
                        />
                    </div>
                </Show>
            </div>

            <Show when={selectedMachine() !== null && selectedLaundryId() !== null}>
                <div class="w-full">
                    <LaundryReservation_isil
                        machineId={selectedMachine()!.id}
                        duration={selectedMachine()!.duration}
                        studentId={currentUser().id}
                        studentBuildingId={currentUser().building_id}
                        machineBuildingId={selectedMachine()!.building_id}
                        onClose={() => setSelectedMachine(null)}
                    />
                </div>
            </Show>

            <Show when={showModal() && editing()}>
                <Modal
                    open={showModal()}
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                    title=""
                >
                    <div class="bg-white text-gray-900">
                        <h3 class="text-xl font-semibold mb-3">
                            {editing()!.id === -1 ? 'Yeni Çamaşırhane Ekle' : 'Çamaşırhane Güncelle'}
                        </h3>
                    </div>
                        <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.currentTarget as HTMLFormElement;
                            const formData = new FormData(form);
                            const formValues = {
                                name: formData.get('name') as string,
                                building_id: Number(formData.get('building_id')),
                            };

                            if (editing()!.id === -1) {
                                try {
                                    await fetchRpc('create_laundry', { data: formValues });
                                    await loadLaundry();
                                    setShowModal(false);
                                    setEditing(null);
                                } catch (e: any) {
                                    setError('Ekleme hatası: ' + e.message);
                                }
                            } else {
                                await updateLaundry({
                                    id: editing()!.id,
                                    ...formValues,
                                });
                            }
                        }}
                        class="flex flex-col gap-3 text-gray-900"
                    >
                        <input
                            type="text"
                            name="name"
                            placeholder="Çamaşırhane Adı"
                            required
                            class="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400
       px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
       dark:border-gray-300 dark:bg-white dark:text-gray-900 dark:placeholder:text-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400"

                            value={editing()?.name || ''}
                            onInput={(e) => updateEditingField('name', e.currentTarget.value)}
                        />
                        <input
                            type="number"
                            name="building_id"
                            placeholder="Yurt ID"
                            required
                            class="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400
       px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
       dark:border-gray-300 dark:bg-white dark:text-gray-900 dark:placeholder:text-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400"


                            value={String(editing()?.building_id || '')}
                            onInput={(e) => updateEditingField('building_id', Number(e.currentTarget.value))}
                        />
                        <button
                            type="submit"
                            class="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 transition-colors"
                        >
                            {editing()?.id === -1 ? 'Ekle' : 'Güncelle'}
                        </button>
                    </form>
                </Modal>
            </Show>
        </main>
    );
}