// src/components/rooms-N

import { createSignal, createEffect, For, Show } from 'solid-js';

interface Room {
    id: number;
    name: string;
    building_id: number;
    buildingName: string;
    onClose: () => void;
    capacity: number;
    current_occupancy: number;
    available: boolean;
    wc: boolean;
    ac: boolean;
    price: number;
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

interface RoomsProps {
    buildingId: number;
    buildingName: string;
    onClose: () => void;
}

export default function Rooms(props: RoomsProps) {
    const [roomList, setRoomList] = createSignal<Room[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal('');

    createEffect(async () => {
        if (props.buildingId) {
            setLoading(true);
            try {
                console.log(`Odalar çekiliyor: Yurt ID - ${props.buildingId}`);
                const result = await fetchRpc('list_rooms', {
                    filters: {
                        building_id: {
                            "$eq": props.buildingId
                        }
                    },
                });

                let processedRooms: Room[] = [];
                if (result && Array.isArray(result.data)) {
                    processedRooms = result.data.map(room => ({
                        id: room.id,
                        name: room.name,
                        building_id: room.building_id,
                        capacity: room.capacity,
                        current_occupancy: room.current_occupancy,
                        available: room.available,
                        wc: room.wc,
                        ac: room.ac,
                        price: room.price
                    }));
                }

                setRoomList(processedRooms);
                setError('');
            } catch (e: any) {
                console.error('Oda listeleme hatası:', e);
                setError('Oda listeleme hatası: ' + e.message);
            }
            setLoading(false);
        } else {
            setRoomList([]);
        }
    });

    function getOccupancyPercentage(current: number, capacity: number): number {
        if (capacity === 0) return 0;
        return Math.round((current / capacity) * 100);
    }

    function getOccupancyColor(percentage: number): string {
        if (percentage === 100) return 'bg-red-500';
        if (percentage > 75) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    return (
        <div class="p-4 bg-white rounded-xl shadow-lg h-full">
            <div class="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
                <h3 class="text-xl font-bold text-gray-800">Odalar ({props.buildingName})</h3>
                <button
                    onClick={props.onClose}
                    class="text-gray-500 hover:text-gray-800 font-bold text-xl transition-colors duration-200"
                >
                    &times;
                </button>
            </div>

            <Show when={error()}>
                <div class="p-4 bg-red-100 text-red-700 rounded-lg shadow-md mb-4">{error()}</div>
            </Show>

            <Show when={loading()} fallback={
                <div class="overflow-x-auto">
                    {/* Büyük ekranlar için tablo görünümü */}
                    <table class="min-w-full table-auto text-sm text-gray-800 hidden md:table">
                        <thead class="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th class="px-4 py-2 text-left font-semibold">Oda No</th>
                            <th class="px-4 py-2 text-left font-semibold">Doluluk</th>
                            <th class="px-4 py-2 text-left font-semibold">Fiyat</th>
                            <th class="px-4 py-2 text-left font-semibold">WC</th>
                            <th class="px-4 py-2 text-left font-semibold">AC</th>
                            <th class="px-4 py-2 text-left font-semibold">Durum</th>
                        </tr>
                        </thead>
                        <tbody>
                        <Show when={roomList().length > 0} fallback={
                            <tr>
                                <td colSpan="6" class="text-center p-4 text-gray-500">
                                    Bu yurda ait oda bulunamadı.
                                </td>
                            </tr>
                        }>
                            <For each={roomList()}>
                                {(room) => {
                                    const occupancyPercentage = getOccupancyPercentage(room.current_occupancy, room.capacity);
                                    const occupancyColor = getOccupancyColor(occupancyPercentage);
                                    return (
                                        <tr class="border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                                            <td class="px-4 py-2 font-medium">{room.name}</td>
                                            <td class="px-4 py-2">
                                                <div class="flex items-center">
                                                    <span class="mr-2">{room.current_occupancy} / {room.capacity}</span>
                                                    <span class={`text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ${occupancyColor}`}>
                                                        %{occupancyPercentage}
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-2">{room.price} TL</td>
                                            <td class="px-4 py-2">
                                                <span class={`text-white text-xs font-semibold px-2 py-1 rounded-full ${room.wc ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {room.wc ? 'Var' : 'Yok'}
                                                </span>
                                            </td>
                                            <td class="px-4 py-2">
                                                <span class={`text-white text-xs font-semibold px-2 py-1 rounded-full ${room.ac ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    {room.ac ? 'Var' : 'Yok'}
                                                </span>
                                            </td>
                                            <td class="px-4 py-2">
                                                <span class={`px-2 py-1 rounded-full font-semibold text-xs ${room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {room.available ? 'Müsait' : 'Dolu'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }}
                            </For>
                        </Show>
                        </tbody>
                    </table>

                    {/* Küçük ekranlar için kart görünümü */}
                    <div class="md:hidden space-y-4">
                        <Show when={roomList().length > 0} fallback={
                            <div class="text-center p-4 text-gray-500">
                                Bu yurda ait oda bulunamadı.
                            </div>
                        }>
                            <For each={roomList()}>
                                {(room) => {
                                    const occupancyPercentage = getOccupancyPercentage(room.current_occupancy, room.capacity);
                                    const occupancyColor = getOccupancyColor(occupancyPercentage);
                                    return (
                                        <div class="bg-gray-50 p-4 rounded-lg shadow-sm border-b">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="text-base font-bold text-gray-900">Oda No: {room.name}</span>
                                                <span class={`px-2 py-1 rounded-full font-semibold text-xs ${room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {room.available ? 'Müsait' : 'Dolu'}
                                                </span>
                                            </div>
                                            <div class="space-y-1 text-sm text-gray-700">
                                                <div class="flex justify-between items-center">
                                                    <strong>Doluluk:</strong>
                                                    <div class="flex items-center">
                                                        <span class="mr-2">{room.current_occupancy} / {room.capacity}</span>
                                                        <span class={`text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ${occupancyColor}`}>
                                                            %{occupancyPercentage}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <strong>Fiyat:</strong>
                                                    <span>{room.price} TL</span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <strong>WC:</strong>
                                                    <span class={`text-white text-xs font-semibold px-2 py-1 rounded-full ${room.wc ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {room.wc ? 'Var' : 'Yok'}
                                                    </span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <strong>AC:</strong>
                                                    <span class={`text-white text-xs font-semibold px-2 py-1 rounded-full ${room.ac ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {room.ac ? 'Var' : 'Yok'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </Show>
                    </div>
                </div>
            }>
                <div class="text-center p-8 text-gray-500">Odalar yükleniyor...</div>
            </Show>
        </div>
    );
}