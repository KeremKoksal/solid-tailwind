import { createSignal, onMount, createMemo, Show, For } from "solid-js";
import Pagination from "~/components/Pagination";

interface Laundry {
    id: number;
    name: string;
    building_id: number;
}

interface LaundryMachine {
    id: number;
    name: string;
    laundry_id: number;
    duration: number;
    status?: "available" | "in_use" | "maintenance";
}

interface Reservation {
    id: number;
    machine_id: number;
    student_id: number;
    time: string;
    status: "active" | "completed" | "cancelled";
    active: boolean;
    machine_name?: string;
    laundry_name?: string;
}

const baseUrl = "https://dema.cc.metu.edu.tr/api";

const rpc = async (method: string, params: any) => {
    try {
        console.log("API İsteği Gönderiliyor:", { method, params });

        const res = await fetch(`${baseUrl}/rpc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method,
                params,
            }),
        });

        console.log("API Yanıt Durumu:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`RPC hatası. Durum: ${res.status}, Body:`, errorText);
            throw new Error(`HTTP hatası! durum: ${res.status}, body: ${errorText}`);
        }

        const jsonResponse = await res.json();
        console.log("API Tam Yanıt:", jsonResponse);

        if (jsonResponse.error) {
            console.error("API Error Yanıtı:", jsonResponse.error);
            throw new Error(jsonResponse.error?.message || "Bilinmeyen RPC hatası");
        }

        return jsonResponse.result;
    } catch (error) {
        console.error("RPC çağrısında genel hata:", error);
        throw error;
    }
};

export default function LaundryPage() {
    const [laundries, setLaundries] = createSignal<Laundry[]>([]);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [selectedLaundryMachines, setSelectedLaundryMachines] = createSignal<LaundryMachine[]>([]);
    const [currentLaundry, setCurrentLaundry] = createSignal<Laundry | null>(null);
    const [showMachinesPanel, setShowMachinesPanel] = createSignal(false);
    const [selectedLaundryId, setSelectedLaundryId] = createSignal<number | null>(null);
    const [showReservationPanel, setShowReservationPanel] = createSignal(false);
    const [showMyReservationsPanel, setShowMyReservationsPanel] = createSignal(false);
    const [selectedMachine, setSelectedMachine] = createSignal<LaundryMachine | null>(null);
    const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0]);
    const [reservations, setReservations] = createSignal<Reservation[]>([]);
    const [userReservations, setUserReservations] = createSignal<Reservation[]>([]);
    const resultsPerPage = 5;

    const getLoggedInStudentId = () => {
        return 1000;
    };

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString);
        const turkeyDate = new Date(date.getTime());

        const day = turkeyDate.getDate();
        const month = turkeyDate.toLocaleDateString('tr-TR', { month: 'long' });
        const year = turkeyDate.getFullYear();
        const time = turkeyDate.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Istanbul'
        });

        return { date: `${day} ${month} ${year}`, time };
    };

    const loadLaundries = async () => {
        try {
            const result = await rpc("list_student_allowed_laundrys", {
                list_options: { limit: 100, offset: 0 },
            });
            setLaundries(result.data || []);
        } catch (error) {
            console.error("Error loading laundries:", error);
            alert("Error loading laundries");
        }
    };

    const fetchReservationDetails = async (reservation: Reservation) => {
        try {
            const machineResult = await rpc("list_laundry_machines", {
                filters: { id: { $eq: reservation.machine_id } },
                list_options: { limit: 1, offset: 0 },
            });
            const machine = machineResult.data[0];

            let laundryName = "";
            if (machine) {
                const laundryResult = await rpc("list_laundrys", {
                    filters: { id: { $eq: machine.laundry_id } },
                    list_options: { limit: 1, offset: 0 },
                });
                laundryName = laundryResult.data[0]?.name || "Bilinmeyen Çamaşırhane";
            }

            return {
                ...reservation,
                machine_name: machine?.name || "Bilinmeyen Makine",
                laundry_name: laundryName,
            };
        } catch (error) {
            console.error(`Error fetching details for reservation ${reservation.id}:`, error);
            return {
                ...reservation,
                machine_name: "Bilinmeyen Makine",
                laundry_name: "Bilinmeyen Çamaşırhane",
            };
        }
    };

    const loadUserReservations = async () => {
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            const result = await rpc("list_own_laundry_reservations", {
                filters: {
                    status: { $eq: "active" },
                    active: { $eq: true },
                    time: {
                        $gte: sevenDaysAgo.toISOString(),
                        $lt: sevenDaysLater.toISOString()
                    }
                },
                list_options: { limit: 100, offset: 0 },
            });

            const detailedReservations = await Promise.all(
                (result.data || []).map((reservation: Reservation) => fetchReservationDetails(reservation))
            );

            setUserReservations(detailedReservations);
        } catch (error) {
            console.error("Error loading user reservations:", error);
        }
    };

    onMount(async () => {
        await loadLaundries();
        await loadUserReservations();
    });

    const paginatedLaundries = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return laundries().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() => Math.ceil(laundries().length / resultsPerPage));

    const fetchLaundryMachines = async (laundryId: number) => {
        try {
            const result = await rpc("list_laundry_machines", {
                filters: { laundry_id: { $eq: laundryId } },
                list_options: { limit: 100, offset: 0 },
            });
            setSelectedLaundryMachines(result.data || []);
            setShowMachinesPanel(true);
            setShowMyReservationsPanel(false);
            return result;
        } catch (error) {
            console.error("Error fetching machines:", error);
            alert("Error fetching machines");
            throw error;
        }
    };

    const fetchReservations = async (machineId: number, date: string) => {
        try {
            const startDate = new Date(`${date}T08:00:00`);
            const endDate = new Date(`${date}T22:00:00`);

            const result = await rpc("list_laundry_reservations", {
                filters: {
                    machine_id: { $eq: machineId },
                    time: {
                        $gte: startDate.toISOString(),
                        $lt: endDate.toISOString()
                    },
                    status: { $eq: "active" },
                    active: { $eq: true }
                },
                list_options: { limit: 100, offset: 0 },
            });
            setReservations(result.data || []);
            return result;
        } catch (error) {
            console.error("Error fetching reservations:", error);
            setReservations([]);
            throw error;
        }
    };

    const userWeeklyUsedSlots = createMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

        return userReservations().filter(res => {
            const resTime = new Date(res.time);
            return resTime.getTime() >= startOfWeek.getTime();
        }).length;
    });

    const hasReservationToday = createMemo(() => {
        const today = new Date(selectedDate());
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return userReservations().some(res => {
            const resTime = new Date(res.time);
            return resTime >= today && resTime < tomorrow;
        });
    });

    const generateTimeSlots = createMemo(() => {
        const machine = selectedMachine();
        if (!machine) return [];

        const slots = [];
        const duration = machine.duration;
        const startTime = 8;
        const endTime = 22;
        const now = new Date();

        const activeReservations = reservations().filter(res => res.status === "active" && res.active);
        const userReservationsForSelectedDate = userReservations().filter(res => {
            const resDate = new Date(res.time);
            const selectedDateObj = new Date(`${selectedDate()}T00:00:00`);
            return resDate.toDateString() === selectedDateObj.toDateString();
        });

        for (let hour = startTime; hour < endTime; hour++) {
            for (let minute = 0; minute < 60; minute += duration) {
                if (hour * 60 + minute + duration > endTime * 60) break;

                const startHour = Math.floor((hour * 60 + minute) / 60);
                const startMinute = (hour * 60 + minute) % 60;
                const endHour = Math.floor((hour * 60 + minute + duration) / 60);
                const endMinute = (hour * 60 + minute + duration) % 60;

                const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
                const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

                const slotDateTime = new Date(`${selectedDate()}T${startTimeStr}:00`);
                const isPastTime = slotDateTime.getTime() < now.getTime();

                const isReserved = activeReservations.some(res => {
                    const resStart = new Date(res.time);
                    const resEnd = new Date(res.time);
                    resEnd.setMinutes(resEnd.getMinutes() + machine.duration);
                    return slotDateTime.getTime() >= resStart.getTime() &&
                        slotDateTime.getTime() < resEnd.getTime();
                });

                const isMyReservation = userReservationsForSelectedDate.some(res => {
                    const resStart = new Date(res.time);
                    return Math.abs(slotDateTime.getTime() - resStart.getTime()) < 60000;
                });

                slots.push({
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    isReserved,
                    isMyReservation,
                    dateTime: slotDateTime,
                    isPastTime
                });
            }
        }

        return slots;
    });

    const handleLaundryClick = (laundry: Laundry) => {
        setCurrentLaundry(laundry);
        setSelectedLaundryId(laundry.id);
        fetchLaundryMachines(laundry.id).catch(console.error);
    };

    const handleMachineReservationClick = (machine: LaundryMachine) => {
        setSelectedMachine(machine);
        setShowReservationPanel(true);
        setShowMachinesPanel(false);
        setShowMyReservationsPanel(false);
        fetchReservations(machine.id, selectedDate()).catch(console.error);
    };

    const handleReservation = async (slot: any) => {
        if (slot.isPastTime) {
            alert("Geçmiş saatler için rezervasyon yapamazsınız!");
            return;
        }

        if (hasReservationToday()) {
            alert("Bugün için zaten bir rezervasyonunuz var!");
            return;
        }

        if (userWeeklyUsedSlots() >= 7) {
            alert("Haftalık rezervasyon limitiniz doldu! (7/7)");
            return;
        }

        if (slot.isReserved) {
            alert("Bu saat aralığı dolu.");
            return;
        }

        if (!confirm(`${slot.startTime} - ${slot.endTime} saatleri arasında rezervasyon yapmak istediğinize emin misiniz?`)) {
            return;
        }

        try {
            const reservationTime = new Date(`${selectedDate()}T${slot.startTime}:00`);
            reservationTime.setHours(reservationTime.getHours());

            await rpc("create_own_laundry_reservation", {
                data: {
                    machine_id: selectedMachine()!.id,
                    student_id: getLoggedInStudentId(),
                    time: reservationTime.toISOString(),
                    status: "active",
                }
            });

            await Promise.all([
                fetchReservations(selectedMachine()!.id, selectedDate()),
                loadUserReservations()
            ]);

            alert("Rezervasyon başarıyla oluşturuldu!");
        } catch (error: unknown) {
            console.error("Reservation error:", error);
            alert("Rezervasyon oluşturulurken hata oluştu");
        }
    };

    const handleCancelReservation = async (reservation: Reservation) => {
        const reservationTime = new Date(reservation.time);

        const timeLabel = reservationTime.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        if (!confirm(`"${timeLabel}" saatindeki rezervasyonu iptal etmek istediğine emin misin?`)) {
            return;
        }

        try {
            await rpc("delete_own_laundry_reservation", {
                id: reservation.id
            });

            alert(`Rezervasyon iptal edildi: ${timeLabel}`);

            await Promise.all([
                loadUserReservations(),
                selectedMachine() ? fetchReservations(selectedMachine()!.id, selectedDate()) : Promise.resolve()
            ]);

        } catch (error: unknown) {
            console.error("İptal hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            alert(`İptal hatası: ${errorMessage}`);
        }
    };

    const handleDateChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const newDate = target.value;
        setSelectedDate(newDate);
        if (selectedMachine()) {
            fetchReservations(selectedMachine()!.id, newDate).catch(console.error);
        }
    };

    const toggleMyReservationsPanel = () => {
        setShowMyReservationsPanel(!showMyReservationsPanel());
        setShowMachinesPanel(false);
        setShowReservationPanel(false);
    };

    const handleGoBack = () => {
        if (showReservationPanel()) {
            setShowReservationPanel(false);
            setShowMachinesPanel(true);
        } else if (showMachinesPanel()) {
            setShowMachinesPanel(false);
            setSelectedLaundryId(null);
            setCurrentLaundry(null);
        } else if (showMyReservationsPanel()) {
            setShowMyReservationsPanel(false);
        }
    }

    return (
        <div class="p-4 bg-gray-50 min-h-screen">
            <div class="sticky top-0 bg-gray-50 z-10 py-4 mb-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <Show when={showMachinesPanel() || showReservationPanel() || showMyReservationsPanel()}>
                        <button
                            onClick={handleGoBack}
                            class="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                            aria-label="Geri"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Show>
                    <h1 class={`text-xl font-bold text-gray-800 ${showMachinesPanel() || showReservationPanel() || showMyReservationsPanel() ? '' : 'text-center w-full'}`}>
                        Çamaşırhane Rezervasyon
                    </h1>
                    <button
                        onClick={toggleMyReservationsPanel}
                        class="px-3 py-1 bg-purple-600 text-white font-medium rounded-lg text-sm hover:bg-purple-700 transition-colors duration-200"
                    >
                        Rezervasyonlarım
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <Show when={!showMachinesPanel() && !showReservationPanel() && !showMyReservationsPanel()}>
                    <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div class="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                            <h2 class="text-md font-semibold text-gray-800">Çamaşırhaneler Listesi</h2>
                        </div>
                        <ul class="divide-y divide-gray-200">
                            <For each={paginatedLaundries()}>
                                {laundry => (
                                    <li
                                        class={`p-4 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${selectedLaundryId() === laundry.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}`}
                                        onClick={() => handleLaundryClick(laundry)}
                                    >
                                        <div class="text-sm font-semibold text-gray-900">{laundry.name}</div>
                                    </li>
                                )}
                            </For>
                        </ul>
                        <Show when={paginatedLaundries().length === 0}>
                            <div class="text-center py-8">
                                <div class="text-gray-400 text-lg mb-2">📋</div>
                                <p class="text-gray-500 text-sm">Henüz çamaşırhane bulunmuyor.</p>
                            </div>
                        </Show>
                    </div>
                    <Show when={laundries().length > 0}>
                        <div class="mt-4">
                            <Pagination
                                currentPage={currentPage()}
                                totalPages={totalPages()}
                                totalResults={laundries().length}
                                onPageChange={setCurrentPage}
                                resultsPerPage={resultsPerPage}
                            />
                        </div>
                    </Show>
                </Show>

                <Show when={showMyReservationsPanel()}>
                    <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                        <div class="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                            <h2 class="text-md font-semibold text-gray-800">Aktif Rezervasyonlarım</h2>
                        </div>
                        <div class="p-4">
                            <Show when={userReservations().length > 0} fallback={
                                <div class="text-center py-8">
                                    <div class="text-gray-400 text-4xl mb-4">🧺</div>
                                    <p class="text-gray-500 text-lg">Bu hafta için aktif bir rezervasyonunuz bulunmamaktadır.</p>
                                </div>
                            }>
                                <div class="mb-4">
                                    <div class="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2">
                                        <p class="text-blue-800 font-medium text-sm">
                                            Bu hafta **{userWeeklyUsedSlots()}/7** rezervasyon hakkınızı kullandınız.
                                        </p>
                                    </div>
                                </div>
                                <div class="space-y-3">
                                    <For each={userReservations().filter(res => new Date(res.time).getTime() >= new Date().getTime())}>
                                        {(reservation) => {
                                            const formatted = formatDateForDisplay(reservation.time);

                                            return (
                                                <div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p class="text-xs text-gray-500">{reservation.laundry_name} - {reservation.machine_name}</p>
                                                        <p class="font-semibold text-gray-900 mt-1 text-sm">
                                                            {formatted.date} - {formatted.time}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancelReservation(reservation)}
                                                        class="px-2 py-1 text-xs font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                    >
                                                        İptal Et
                                                    </button>
                                                </div>
                                            );
                                        }}
                                    </For>
                                </div>
                            </Show>
                        </div>
                    </div>
                </Show>

                <Show when={showMachinesPanel()}>
                    <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                        <div class="px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                            <h2 class="text-md font-semibold text-gray-800">
                                {currentLaundry()?.name || "Çamaşırhane"} Makineleri
                            </h2>
                        </div>
                        <div class="p-4">
                            <Show when={selectedLaundryMachines().length > 0} fallback={
                                <div class="text-center py-8">
                                    <div class="text-gray-400 text-4xl mb-4">🔧</div>
                                    <p class="text-gray-500 text-lg">Bu çamaşırhanede makine bulunamadı.</p>
                                </div>
                            }>
                                <ul class="space-y-3">
                                    <For each={selectedLaundryMachines()}>
                                        {(machine) => (
                                            <li class="bg-gray-50 p-3 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors duration-200">
                                                <div>
                                                    <div class="font-semibold text-gray-900 text-sm">
                                                        {machine.name}
                                                    </div>
                                                    <div class="mt-1">
                                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {machine.duration} dk
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    class="px-2 py-1 text-xs font-medium rounded-md text-purple-600 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                                                    onClick={() => handleMachineReservationClick(machine)}
                                                >
                                                    Rezerve Et
                                                </button>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </Show>
                        </div>
                    </div>
                </Show>

                <Show when={showReservationPanel()}>
                    <div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
                        <div class="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                            <h2 class="text-md font-semibold text-gray-800">
                                {selectedMachine()?.name} Rezervasyon
                            </h2>
                        </div>
                        <div class="p-4">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tarih Seçin</label>
                                <input
                                    type="date"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    value={selectedDate()}
                                    min={new Date().toISOString().split('T')[0]}
                                    max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    onChange={handleDateChange}
                                />
                            </div>

                            <div class="mb-4">
                                <h3 class="text-sm font-medium text-gray-700 mb-2">
                                    Müsait Saatler ({selectedMachine()?.duration} dk'lık slotlar)
                                </h3>
                                <p class="text-xs text-gray-500">
                                    Bu hafta **{userWeeklyUsedSlots()}/7** rezervasyon hakkınızı kullandınız.
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                    Bugün için herhangi bir rezervasyonunuz varsa başka rezervasyon yapamazsınız.
                                </p>
                            </div>

                            <div class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                                <For each={generateTimeSlots()}>
                                    {(slot) => {
                                        const isDisabled = slot.isReserved || hasReservationToday() || userWeeklyUsedSlots() >= 7 || slot.isPastTime;
                                        const isMySlot = slot.isMyReservation;

                                        let buttonClasses = "relative px-3 py-2 text-sm font-medium rounded-md w-full transition-colors duration-200";
                                        let buttonText = `${slot.startTime} - ${slot.endTime}`;

                                        if (isMySlot) {
                                            buttonClasses += " bg-green-500 text-white cursor-not-allowed";
                                            buttonText = "Rezervasyonunuz";
                                        } else if (slot.isReserved) {
                                            buttonClasses += " bg-red-100 text-red-800 cursor-not-allowed";
                                            buttonText = "Dolu";
                                        } else if (isDisabled) {
                                            buttonClasses += " bg-gray-200 text-gray-500 cursor-not-allowed";
                                        } else {
                                            buttonClasses += " bg-green-100 text-green-800 hover:bg-green-200";
                                        }

                                        return (
                                            <button
                                                class={buttonClasses}
                                                onClick={() => handleReservation(slot)}
                                                disabled={isDisabled}
                                            >
                                                {buttonText}
                                                <Show when={slot.isPastTime && !isMySlot && !slot.isReserved}>
                                                    <span class="absolute top-1 right-1 text-xs font-bold text-gray-400">Geçmiş</span>
                                                </Show>
                                            </button>
                                        );
                                    }}
                                </For>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}