import { createSignal, onMount, createMemo } from "solid-js";
import BuildingTable from "~/components/BuildingTable";
import Combobox from "~/components/Combobox";
import Button from "~/components/Button";
import Modal from "~/components/Modal";

interface Building {
    id: number;
    name: string;
    gender: boolean | null;
    private: boolean;
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

    const jsonResponse = await res.json();
    if (jsonResponse.error) {
        console.error("RPC Error:", jsonResponse.error);
        if (
            typeof jsonResponse.error === "object" &&
            jsonResponse.error !== null &&
            "message" in jsonResponse.error
        ) {
            throw new Error((jsonResponse.error as { message: string }).message);
        } else {
            throw new Error("Bilinmeyen RPC hatası");
        }
    }

    return jsonResponse.result;
};

export default function BuildingPage() {
    const [buildings, setBuildings] = createSignal<Building[]>([]);
    const [filterGender, setFilterGender] = createSignal("");
    const [isModalOpen, setModalOpen] = createSignal(false);
    const [editing, setEditing] = createSignal<Building | null>(null);

    const fetchBuildings = async () => {
        try {
            const result = await rpc("list_buildings", {
                filters: {},
                list_options: { limit: 100, offset: 0 },
            });

            if (result && Array.isArray(result.data)) {
                setBuildings(result.data);
            } else {
                console.error("Beklenmeyen RPC yanıtı: result.data bir dizi değil", result);
                setBuildings([]);
            }
        } catch (error: unknown) {
            console.error("Binalar çekilirken hata oluştu:", error);
            if (error instanceof Error) {
                alert("Binalar çekilirken hata oluştu: " + error.message);
            } else {
                alert("Binalar çekilirken bilinmeyen bir hata oluştu.");
            }
            setBuildings([]);
        }
    };

    const handleSave = async (formData: any) => {
        const gender =
            formData.gender === "male"
                ? true
                : formData.gender === "female"
                    ? false
                    : null;

        const payload = {
            name: formData.name,
            gender,
            private: formData.private === "true",
        };

        try {
            if (editing()) {
                await rpc("update_building", {
                    id: editing()!.id,
                    data: payload,
                });
            } else {
                await rpc("create_building", {
                    data: payload,
                });
            }
            await fetchBuildings();
            setModalOpen(false);
            setEditing(null);
        } catch (error: unknown) {
            console.error("Kaydetme işlemi başarısız oldu:", error);
            if (error instanceof Error) {
                alert("Kaydetme işlemi başarısız oldu: " + error.message);
            } else {
                alert("Kaydetme işlemi başarısız oldu: Bilinmeyen bir hata.");
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Silmek istediğine emin misin?")) return;
        try {
            await rpc("delete_building", { id });
            await fetchBuildings();
        } catch (error: unknown) {
            console.error("Silme işlemi başarısız oldu:", error);
            if (error instanceof Error) {
                alert("Silme işlemi başarısız oldu: " + error.message);
            } else {
                alert("Silme işlemi başarısız oldu: Bilinmeyen bir hata.");
            }
        }
    };

    onMount(fetchBuildings);

    const filteredBuildings = createMemo(() => {
        const currentFilter = filterGender();
        if (!currentFilter || currentFilter === "") {
            return buildings();
        }
        return buildings().filter((building) => {
            if (currentFilter === "male") {
                return building.gender === true;
            } else if (currentFilter === "female") {
                return building.gender === false;
            } else if (currentFilter === "mixed") {
                return building.gender === null;
            }
            return true;
        });
    });

    return (
        <div class="p-6">
            <div class="flex justify-between mb-4">
                <h1 class="text-2xl font-bold">Yurtlar</h1>
                <Button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                >
                    Yurt Ekle
                </Button>
            </div>

            <Combobox
                name="gender"
                options={[
                    { value: "", label: "Tümü" },
                    { value: "male", label: "Erkek" },
                    { value: "female", label: "Kız" },
                    { value: "mixed", label: "Karma" },
                ]}
                value={filterGender()}
                onChange={setFilterGender}
                placeholder="Cinsiyet Filtrele"
            />

            <BuildingTable
                buildings={filteredBuildings()}
                onEdit={(building) => {
                    setEditing(building);
                    setModalOpen(true);
                }}
                onDelete={handleDelete}
            />

            <Modal
                open={isModalOpen()}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                title={editing() ? "Yurt Güncelle" : "Yurt Ekle"}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSave({
                            name: formData.get("name"),
                            gender: formData.get("gender"),
                            private: formData.get("private"),
                        });
                    }}
                >
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Yurt Adı
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={editing()?.name || ""}
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Cinsiyet
                            </label>
                            <select
                                name="gender"
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                <option value="male" selected={editing()?.gender === true}>
                                    Erkek
                                </option>
                                <option value="female" selected={editing()?.gender === false}>
                                    Kız
                                </option>
                                <option value="mixed" selected={editing()?.gender === null}>
                                    Karma
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">
                                Konukevi
                            </label>
                            <select
                                name="private"
                                required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                <option value="true" selected={editing()?.private}>
                                    Evet
                                </option>
                                <option value="false" selected={!editing()?.private}>
                                    Hayır
                                </option>
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
