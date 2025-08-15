import { createSignal, Show, For, createEffect, createMemo } from 'solid-js';
import Pagination from '~/components/Pagination';

interface Room {
    id: number;
    name: string;
    capacity: number;
    available: boolean;
    building_id: number;
    price?: number;
    wc?: boolean;
    ac?: boolean;
}

export default function Room_isil(props: {
    buildingId: number;
    onClose?: () => void;
}) {
    const [rooms, setRooms] = createSignal<Room[]>([]);
    const [error, setError] = createSignal('');
    const [currentPage, setCurrentPage] = createSignal(1);
    const resultsPerPage = 10;

    const paginatedRooms = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return rooms().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() =>
        Math.max(1, Math.ceil(rooms().length / resultsPerPage))
    );

    const loadRooms = async () => {
        try {
            const response = await fetch('https://dema.cc.metu.edu.tr/api/rpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'list_rooms',
                    params: {
                        filters: { building_id: { $eq: props.buildingId } },
                        list_options: { limit: 100, offset: 0 },
                    },
                }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            setRooms(data.result?.data || []);
            setCurrentPage(1);
            setError('');
        } catch (e: any) {
            setError('Oda yükleme hatası: ' + e.message);
        }
    };

    createEffect(() => {
        if (props.buildingId) {
            loadRooms();
        }
    });

    return (
        <>
        <Show when={error()}>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error()}
            </div>
        </Show>

            <div class="bg-white shadow border border-gray-200 overflow-hidden ">
                <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-purple-800">
                            Yurt ID: {props.buildingId} – Odalar
                        </h3>
                        <button
                            type="button"
                            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            onClick={() => props.onClose?.()}
                            aria-label="Kapat"
                            title="Kapat"
                        >
                            ×
                        </button>
                    </div>
                </div>


                <div class="hidden xl:block overflow-x-hidden">
                    <table class="w-full table-fixed">
                        <thead class="bg-gradient-to-r from-purple-50 to-purple-100">
                        <tr class="text-pink-600 text-xs uppercase tracking-wider whitespace-nowrap">
                            <th class="px-3 py-3 text-left">Oda Adı</th>
                            <th class="px-4 py-3 text-left ">ID</th>
                            <th class="px-4 py-3 text-left ">Kapasite</th>
                            <th class="px-4 py-3 text-right ">Ücret</th>
                            <th class="px-4 py-3 text-left ">WC</th>
                            <th class="px-4 py-3 text-left ">AC</th>
                            <th class="px-4 py-3 text-left ">Durum</th>
                            <th class="px-4 py-3 text-left ">Doluluk</th>
                        </tr>
                        </thead>
                        <tbody class="[&>tr:nth-child(even)]:bg-gray-50">
                        <For each={paginatedRooms()}>
                            {(room) => {
                                const occupancyRate = room.available ? 0 : 100;
                                const boolCls = (v: any, on = "", off = "") =>
                                    (v === true || v === "true" || v === 1 || v === "1")
                                        ? `px-2 py-0.5 text-xs rounded-full ${on}`
                                        : `px-2 py-0.5 text-xs rounded-full ${off}`;

                                return (
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-4 py-3">
                                                <span class="text-sm font-medium text-indigo-600"
                                                      title={`Oda ${room.name}`}>
                                                    Oda {room.name}
                                                </span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-500 font-medium tabular-nums">
                                            {room.id}
                                        </td>
                                        <td class="px-4 py-3 text-sm">{room.capacity}</td>
                                        <td class="px-4 py-3 text-sm text-right font-medium tabular-nums">
                                            {(() => {
                                                const v: any = (room as any).price;
                                                const n = typeof v === "number" ? v : Number(v);
                                                return Number.isFinite(n)
                                                    ? n.toLocaleString("tr-TR", {style: "currency", currency: "TRY"})
                                                    : "—";
                                            })()}
                                        </td>
                                        <td class="px-4 py-3">
                                                <span
                                                    class={boolCls(room.wc, "bg-sky-100 text-sky-700", "bg-gray-100 text-gray-500")}>
                                                    {(room as any).wc ? "Var" : "Yok"}
                                                </span>
                                        </td>
                                        <td class="px-4 py-3">
                                                <span
                                                    class={boolCls(room.ac, "bg-amber-100 text-amber-700", "bg-gray-100 text-gray-500")}>
                                                    {(room as any).ac ? "Var" : "Yok"}
                                                </span>
                                        </td>
                                        <td class="px-4 py-3">
                                                <span
                                                    class={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${
                                                        room.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                    }`}>
                                                    <span
                                                        class={`h-2 w-2 rounded-full ${room.available ? "bg-emerald-500" : "bg-rose-500"}`}/>
                                                    {room.available ? "Uygun" : "Dolu"}
                                                </span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="flex items-center gap-2">
                                                <div
                                                    class="h-2 flex-1 max-w-[160px] rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        class={`h-2 rounded-full ${
                                                            occupancyRate < 50 ? "bg-emerald-400" :
                                                                occupancyRate < 80 ? "bg-yellow-400" : "bg-rose-500"
                                                        }`}
                                                        style={{width: `${occupancyRate}%`}}
                                                    />
                                                </div>
                                                <span class="text-xs text-gray-500 tabular-nums shrink-0">
                                                        {occupancyRate}%
                                                    </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }}
                        </For>
                        </tbody>
                    </table>
                </div>


                <div class="hidden md:block xl:hidden overflow-x-auto">
                    <table class="w-full min-w-[700px]">
                        <thead class="bg-gradient-to-r from-slate-50 to-slate-100">
                        <tr class="text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                            <th class="px-3 py-2 text-left">Oda Adı</th>
                            <th class="px-3 py-2 text-left">ID</th>
                            <th class="px-3 py-2 text-left">Kapasite</th>
                            <th class="px-3 py-2 text-right">Ücret</th>
                            <th class="px-3 py-2 text-left">WC</th>
                            <th class="px-3 py-2 text-left">AC</th>
                            <th class="px-3 py-2 text-left">Durum</th>
                            <th class="px-3 py-2 text-left">Doluluk</th>
                        </tr>
                        </thead>
                        <tbody class="[&>tr:nth-child(even)]:bg-slate-50/40">
                        <For each={paginatedRooms()}>
                            {(room) => {
                                const occupancyRate = room.available ? 0 : 100;

                                return (
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-3 py-3 text-sm font-medium text-indigo-600">
                                            Oda {room.name}
                                        </td>
                                        <td class="px-3 py-3 text-sm text-gray-500">
                                            {room.id}
                                        </td>
                                        <td class="px-3 py-3 text-sm">{room.capacity}</td>
                                        <td class="px-3 py-3 text-sm text-right font-medium">
                                            {(() => {
                                                const v: any = (room as any).price;
                                                const n = typeof v === "number" ? v : Number(v);
                                                return Number.isFinite(n)
                                                    ? n.toLocaleString("tr-TR", {style: "currency", currency: "TRY"})
                                                    : "—";
                                            })()}
                                        </td>
                                        <td class="px-3 py-3">
                                                <span class={`px-1.5 py-0.5 text-xs rounded-full ${
                                                    (room as any).wc ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-500"
                                                }`}>
                                                    {(room as any).wc ? "Var" : "Yok"}
                                                </span>
                                        </td>
                                        <td class="px-3 py-3">
                                                <span class={`px-1.5 py-0.5 text-xs rounded-full ${
                                                    (room as any).ac ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                                                }`}>
                                                    {(room as any).ac ? "Var" : "Yok"}
                                                </span>
                                        </td>
                                        <td class="px-3 py-3">
                                                <span
                                                    class={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                                        room.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                    }`}>
                                                    <span
                                                        class={`h-1.5 w-1.5 rounded-full ${room.available ? "bg-emerald-500" : "bg-rose-500"}`}/>
                                                    {room.available ? "Uygun" : "Dolu"}
                                                </span>
                                        </td>
                                        <td class="px-3 py-3">
                                            <div class="flex items-center gap-2 min-w-[80px]">
                                                <div class="h-1.5 w-12 rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        class={`h-1.5 rounded-full ${
                                                            occupancyRate < 50 ? "bg-emerald-400" :
                                                                occupancyRate < 80 ? "bg-yellow-400" : "bg-rose-500"
                                                        }`}
                                                        style={{width: `${occupancyRate}%`}}
                                                    />
                                                </div>
                                                <span class="text-xs text-gray-500 shrink-0">{occupancyRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }}
                        </For>
                        </tbody>
                    </table>
                </div>


                <div class="block md:hidden">
                    <For each={paginatedRooms()}>
                        {(room) => {
                            const occupancyRate = room.available ? 0 : 100;

                            return (
                                <div
                                    class="border-b border-gray-200 p-4 last:border-b-0 hover:bg-slate-50/50 transition-colors">


                                    <div class="flex justify-between items-start mb-3">
                                        <div class="flex-1 min-w-0">
                                            <h4 class="font-semibold text-indigo-600 text-lg">
                                                Oda {room.name}
                                            </h4>
                                            <div class="text-sm text-gray-600 mt-0.5">
                                                ID: {room.id} • Kapasite: {room.capacity} kişi
                                            </div>
                                        </div>
                                        <div class="text-right ml-3 flex-shrink-0">
                                            <div class="font-semibold text-gray-900">
                                                {(() => {
                                                    const v: any = (room as any).price;
                                                    const n = typeof v === "number" ? v : Number(v);
                                                    return Number.isFinite(n)
                                                        ? n.toLocaleString("tr-TR", {
                                                            style: "currency",
                                                            currency: "TRY"
                                                        })
                                                        : "Ücret Belirtilmemiş";
                                                })()}
                                            </div>
                                        </div>
                                    </div>


                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex gap-2">
                                            <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                                                (room as any).wc ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-500"
                                            }`}>
                                                WC {(room as any).wc ? "✓" : "✗"}
                                            </span>
                                            <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                                                (room as any).ac ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                                            }`}>
                                                AC {(room as any).ac ? "✓" : "✗"}
                                            </span>
                                        </div>

                                        <span
                                            class={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                                                room.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                            }`}>
                                            <span
                                                class={`h-2 w-2 rounded-full ${room.available ? "bg-emerald-500" : "bg-rose-500"}`}/>
                                            {room.available ? "Uygun" : "Dolu"}
                                        </span>
                                    </div>


                                    <div class="space-y-2">
                                        <div class="flex justify-between text-xs text-gray-600">
                                            <span>Doluluk Oranı</span>
                                            <span class="font-medium">{occupancyRate}%</span>
                                        </div>
                                        <div class="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                class={`h-2 rounded-full transition-all duration-300 ${
                                                    occupancyRate === 0 ? "bg-emerald-400" :
                                                        occupancyRate < 50 ? "bg-emerald-400" :
                                                            occupancyRate < 80 ? "bg-yellow-400" : "bg-rose-500"
                                                }`}
                                                style={{width: `${Math.max(occupancyRate, 4)}%`}}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    </For>
                </div>
                <Show when={rooms().length > 0}>
                    <div class="px-4 py-3 ">
                        <Pagination
                            currentPage={currentPage()}
                            totalPages={totalPages()}
                            totalResults={rooms().length}
                            resultsPerPage={resultsPerPage}
                            onPageChange={setCurrentPage}
                            showResultsInfo={false}
                        />
                    </div>

                </Show>
                <Show when={rooms().length === 0}>
                    <div class="text-center py-12">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Bu yurtta oda bulunamadı</h3>
                        <p class="text-gray-500">Henüz bu yurt için kayıtlı oda bulunmuyor.</p>
                    </div>
                </Show>

            </div>

        </>
    );

}