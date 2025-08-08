import { createSignal, onMount, createMemo, Show, For } from "solid-js";
import BuildingTable from "~/components/BuildingTable";
import Combobox from "~/components/Combobox";
import Button from "~/components/Button";
import Modal from "~/components/Modal";
import Pagination from "~/components/Pagination";

interface Building {
    id: number;
    name: string;
    gender: boolean | null;
    private: boolean;
}

interface Room {
    id: number;
    name: string;
    building_id: number;
    capacity: number;
    price: number | string;
    wc: boolean;
    ac: boolean;
    available: boolean;
}

const baseUrl = "https://dema.cc.metu.edu.tr/api";

const rpc = async (method: string, params: any) => {
    const res = await fetch(`${baseUrl}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
        }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const jsonResponse = await res.json();
    if (jsonResponse.error) {
        throw new Error(jsonResponse.error?.message || "Unknown RPC error");
    }

    return jsonResponse.result;
};

const formatPrice = (price: number | string): string => {
    const num = typeof price === 'number' ? price : parseFloat(price.toString());
    return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function BuildingPage() {
    const [buildings, setBuildings] = createSignal<Building[]>([]);
    const [filterGender, setFilterGender] = createSignal("");
    const [isModalOpen, setModalOpen] = createSignal(false);
    const [editing, setEditing] = createSignal<Building | null>(null);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [selectedBuildingRooms, setSelectedBuildingRooms] = createSignal<Room[]>([]);
    const [currentBuilding, setCurrentBuilding] = createSignal<Building | null>(null);
    const [showRoomsPanel, setShowRoomsPanel] = createSignal(false);
    const [selectedBuildingId, setSelectedBuildingId] = createSignal<number | null>(null);
    const resultsPerPage = 5;

    const loadBuildings = async () => {
        try {
            const result = await rpc("list_buildings", {
                filters: {},
                list_options: { limit: 100, offset: 0 },
            });
            setBuildings(result.data || []);
        } catch (error) {
            console.error("Error loading buildings:", error);
            alert("Error loading buildings");
        }
    };

    onMount(loadBuildings);

    const filteredBuildings = createMemo(() => {
        const filter = filterGender();
        return buildings().filter((b) =>
            filter === "erkek" ? b.gender === true :
                filter === "kadın" ? b.gender === false :
                    filter === "karma" ? b.gender === null : true
        );
    });

    const paginatedBuildings = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return filteredBuildings().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() => Math.ceil(filteredBuildings().length / resultsPerPage));

    const fetchBuildingRooms = async (buildingId: number) => {
        try {
            const result = await rpc("list_rooms", {
                filters: { building_id: { $eq: buildingId } },
                list_options: { limit: 100, offset: 0 },
            });

            const validatedRooms = (result.data || []).map((room: any) => ({
                ...room,
                price: typeof room.price === 'number' ? room.price : parseFloat(room.price) || 0
            }));

            setSelectedBuildingRooms(validatedRooms);
            setShowRoomsPanel(true);
        } catch (error) {
            console.error("Error fetching rooms:", error);
            alert("Error fetching rooms");
        }
    };

    const handleBuildingClick = (building: Building) => {
        setCurrentBuilding(building);
        setSelectedBuildingId(building.id);
        fetchBuildingRooms(building.id);
    };

    const handleSave = async (formData: any) => {
        try {
            const gender = formData.gender === "erkek" ? true :
                formData.gender === "kadın" ? false : null;

            const payload = {
                name: formData.name,
                gender,
                private: formData.private === "true",
            };

            if (editing()) {
                await rpc("update_building", { id: editing()!.id, data: payload });
            } else {
                await rpc("create_building", { data: payload });
            }

            await loadBuildings();
            setModalOpen(false);
            setEditing(null);
        } catch (error) {
            console.error("Save error:", error);
            alert("Save error");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try {
            await rpc("delete_building", { id });
            setBuildings(buildings().filter((b) => b.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete error");
        }
    };

    return (
        <div class="p-6">
            <div class="flex justify-between mb-4">
                <h1 class="text-2xl font-bold">Yurtlar</h1>
                <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                    Yurt Ekle
                </Button>
            </div>

            <div class="flex gap-6">
                <div class={`transition-all duration-300 ${showRoomsPanel() ? 'w-1/2' : 'w-full'}`}>
                    <Combobox
                        name="gender"
                        options={[
                            { value: "", label: "Tümü" },
                            { value: "erkek", label: "Erkek" },
                            { value: "kadın", label: "Kadın" },
                            { value: "karma", label: "Karma" },
                        ]}
                        value={filterGender()}
                        onChange={setFilterGender}
                        placeholder="Cinsiyete Göre Filtrele"
                    />

                    <BuildingTable
                        buildings={paginatedBuildings()}
                        selectedBuildingId={selectedBuildingId()}
                        onEdit={(b) => { setEditing(b); setModalOpen(true); }}
                        onDelete={handleDelete}
                        onRowClick={handleBuildingClick}
                    />

                    <Show when={filteredBuildings().length > 0}>
                        <Pagination
                            currentPage={currentPage()}
                            totalPages={totalPages()}
                            totalResults={filteredBuildings().length}
                            onPageChange={setCurrentPage}
                            resultsPerPage={resultsPerPage}
                        />
                    </Show>
                </div>

                <Show when={showRoomsPanel()}>
                    <div class="w-1/2 bg-white rounded-lg shadow-lg p-6 border">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-bold text-gray-800">
                                {currentBuilding()?.name || "Yurt"} Odaları
                            </h2>
                            <button
                                onClick={() => { setShowRoomsPanel(false); setSelectedBuildingId(null); }}
                                class="text-gray-500 hover:text-gray-700 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <Show when={selectedBuildingRooms().length > 0} fallback={
                            <p class="text-gray-500 text-center py-8">Bu yurtta oda bulunamadı.</p>
                        }>
                            <div class="overflow-x-auto max-h-96 overflow-y-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oda</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kapasite</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WC</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klima</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                                    </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                    <For each={selectedBuildingRooms()}>
                                        {(room) => (
                                            <tr class="hover:bg-gray-50">
                                                <td class="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{room.name}</td>
                                                <td class="px-4 py-3 whitespace-nowrap text-gray-600">{room.capacity}</td>
                                                <td class="px-4 py-3 whitespace-nowrap text-gray-600">₺{formatPrice(room.price)}</td>
                                                <td class="px-4 py-3 whitespace-nowrap">
                            <span class={`px-2 py-1 rounded-full text-xs ${room.wc ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {room.wc ? "Var" : "Yok"}
                            </span>
                                                </td>
                                                <td class="px-4 py-3 whitespace-nowrap">
                            <span class={`px-2 py-1 rounded-full text-xs ${room.ac ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {room.ac ? "Var" : "Yok"}
                            </span>
                                                </td>
                                                <td class="px-4 py-3 whitespace-nowrap">
                            <span class={`px-2 py-1 rounded-full text-xs ${room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {room.available ? "Boş" : "Dolu"}
                            </span>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                    </tbody>
                                </table>
                            </div>

                            <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h3 class="font-semibold text-gray-800 mb-2">Özet</h3>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span class="text-gray-600">Toplam Oda:</span>
                                        <span class="font-medium ml-2">{selectedBuildingRooms().length}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Boş Odalar:</span>
                                        <span class="font-medium ml-2 text-green-600">
                      {selectedBuildingRooms().filter(r => r.available).length}
                    </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Toplam Kapasite:</span>
                                        <span class="font-medium ml-2">
                      {selectedBuildingRooms().reduce((sum, room) => sum + room.capacity, 0)}
                    </span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Ortalama Fiyat:</span>
                                        <span class="font-medium ml-2">
                      ₺{selectedBuildingRooms().length > 0
                                            ? formatPrice(selectedBuildingRooms().reduce((sum, room) => {
                                                const price = typeof room.price === 'number' ? room.price : parseFloat(room.price) || 0;
                                                return sum + price;
                                            }, 0) / selectedBuildingRooms().length)
                                            : '0.00'}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>

            <Modal
                open={isModalOpen()}
                onClose={() => { setModalOpen(false); setEditing(null); }}
                title={editing() ? "Yurt Düzenle" : "Yurt Ekle"}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleSave({
                        name: formData.get("name"),
                        gender: formData.get("gender"),
                        private: formData.get("private"),
                    });
                }}>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Yurt Adı</label>
                            <input
                                type="text"
                                name="name"
                                value={editing()?.name || ""}
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Cinsiyet</label>
                            <select
                                name="gender"
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                <option value="erkek" selected={editing()?.gender === true}>Erkek</option>
                                <option value="kadın" selected={editing()?.gender === false}>Kadın</option>
                                <option value="karma" selected={editing()?.gender === null}>Karma</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Konukevi</label>
                            <select
                                name="private"
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                <option value="true" selected={editing()?.private}>Evet</option>
                                <option value="false" selected={!editing()?.private}>Hayır</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}