import { createEffect, createSignal, Show, For, createMemo } from 'solid-js';
import Pagination from '~/components/Pagination';

interface LaundryMachine {
    id: number;
    name: string;
    duration: number;
}

interface Props {
    laundryId: number;
    refreshTrigger?: boolean;
    onOpenReservation?: (machineId: number, duration: number) => void;
    onClose?: () => void;
}

async function fetchRpc(method: string, params?: any) {
    const response = await fetch('https://dema.cc.metu.edu.tr/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
}

export default function LaundryMachine_isil(props: Props) {
    const [machines, setMachines] = createSignal<LaundryMachine[]>([]);
    const [error, setError] = createSignal('');
    const [openSlotMachineId, setOpenSlotMachineId] = createSignal<number | null>(null);
    const [currentPage, setCurrentPage] = createSignal(1);

    const resultsPerPage = 10;

    const paginatedMachines = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return machines().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() =>
        Math.ceil(machines().length / resultsPerPage)
    );

    createEffect(() => {
        props.laundryId;
        setCurrentPage(1);
    });

    async function loadMachines() {
        try {
            const result = await fetchRpc('list_laundry_machines', {
                filters: { laundry_id: props.laundryId },
                list_options: { limit: 1000, offset: 0, sort: [{ field: 'id', direction: 'asc' }] }
            });
            setMachines(result?.data || []);
        } catch (e: any) {
            setError('Makine listeleme hatası: ' + e.message);
        }
    }

    createEffect(loadMachines);
    createEffect(() => {
        if (props.refreshTrigger !== undefined) loadMachines();
    });

    const handleMachineClick = (m: LaundryMachine) => {
        const willOpen = openSlotMachineId() !== m.id;
        setOpenSlotMachineId(willOpen ? m.id : null);
        if (willOpen && props.onOpenReservation) {
            props.onOpenReservation(m.id, m.duration);
        }
    };

    return (
        <div class="relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-white to-indigo-100 px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-xl font-bold text-black">Çamaşırhane Makineleri</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Randevu almak için bir makineye tıklayın
                        </p>
                    </div>
                    <button
                        class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                        onClick={() => props.onClose?.()}
                        aria-label="Kapat"
                    >
                        ×
                    </button>
                </div>
            </div>

            <div class="p-6 space-y-4">
                <Show when={error()}>
                    <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        <span class="font-medium">{error()}</span>
                    </div>
                </Show>

                <Show
                    when={machines().length > 0}
                    fallback={
                        <div class="text-center py-8">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-gray-400 text-2xl">⚙️</span>
                            </div>
                            <p class="text-gray-500 font-medium">Makine bulunamadı</p>
                        </div>
                    }
                >

                    <div class="block sm:hidden space-y-3">
                        <For each={paginatedMachines()}>
                            {(m) => {
                                const isOpen = () => openSlotMachineId() === m.id;
                                return (
                                    <div
                                        class={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                            isOpen()
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                        onClick={() => handleMachineClick(m)}
                                    >
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex items-center">
                                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                    <span class="text-blue-800 font-bold text-sm">#{m.id}</span>
                                                </div>
                                                <div>
                                                    <div class="font-semibold text-gray-900">{m.name}</div>
                                                    <div class="text-sm text-gray-600">{m.duration} dakika</div>
                                                </div>
                                            </div>
                                            <div class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Makine
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                    </div>

                    <div class="hidden sm:block">
                        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                ID
                                            </div>
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                Makine Adı
                                            </div>
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div class="flex items-center">
                                                <span class="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                                Süre (dk)
                                            </div>
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                    <For each={paginatedMachines()}>
                                        {(m) => {
                                            const isOpen = () => openSlotMachineId() === m.id;
                                            return (
                                                <tr
                                                    class={`cursor-pointer transition-all duration-200 ${
                                                        isOpen()
                                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => handleMachineClick(m)}
                                                >
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <span class="text-blue-800 font-bold text-sm">#{m.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                                <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                                    {m.name}
                                                                </span>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <span class="text-gray-900 font-semibold">{m.duration}</span>
                                                            <span class="text-gray-500 text-sm ml-1">dk</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }}
                                    </For>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <Show when={machines().length > resultsPerPage}>
                        <div class="mt-6">
                            <Pagination
                                currentPage={currentPage()}
                                totalPages={totalPages()}
                                totalResults={machines().length}
                                resultsPerPage={resultsPerPage}
                                onPageChange={setCurrentPage}
                                showResultsInfo={false}
                            />
                        </div>
                    </Show>
                </Show>
            </div>
        </div>
    );
}