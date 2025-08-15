import { createEffect, createSignal, For, Show } from "solid-js";
import { useLaundryApi } from "./laundryApi";
import { format, addDays, getDay, isSameDay, isToday } from "date-fns";
import { tr } from "date-fns/locale/tr";
interface Building {
    id: number;
    name: string;
    external_id?: string;
}

interface Laundry {
    id: number;
    name: string;
    building_id: number;
    is_empty?: boolean;
}

interface Machine {
    id: number;
    name: string;
    laundry_id: number;
    duration: number;
    occupancy?: number;
    reservations?: { date: string; time: string }[];
}

interface UserReservation {
    id: number;
    machine_id: number;
    time: string;
    date: string;
    machine_name: string;
    laundry_name: string;
    building_name: string;
}

export default function LaundryN() {
    const api = useLaundryApi();
    const [buildings, setBuildings] = createSignal<Building[]>([]);
    const [selectedBuilding, setSelectedBuilding] = createSignal<number | null>(null);
    const [laundries, setLaundries] = createSignal<Laundry[]>([]);
    const [selectedLaundry, setSelectedLaundry] = createSignal<number | null>(null);
    const [machines, setMachines] = createSignal<Machine[]>([]);
    const [selectedMachine, setSelectedMachine] = createSignal<Machine | null>(null);
    const [selectedDate, setSelectedDate] = createSignal<Date>(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = createSignal<string | null>(null);

    // işlem başarılı/hatalı mesajları sinyalleri
    const [showReservationSuccess, setShowReservationSuccess] = createSignal(false);
    const [showCancelSuccess, setShowCancelSuccess] = createSignal(false);
    const [showError, setShowError] = createSignal(false);

    const [showCancelModal, setShowCancelModal] = createSignal(false);
    const [reservationToCancel, setReservationToCancel] = createSignal<UserReservation | null>(null);
    const [userReservations, setUserReservations] = createSignal<UserReservation[]>([]);
    const refreshAllData = async () => {
        await fetchUserReservations();
        const laundryId = selectedLaundry();
        if (laundryId) {
            const updatedMachines = await api.listMachines(laundryId);
            setMachines(updatedMachines);
            // Seçili makinenin rezervasyonlarını güncelle
            if (selectedMachine()) {
                const updatedMachine = updatedMachines.find(m => m.id === selectedMachine()?.id);
                if (updatedMachine) {
                    setSelectedMachine(updatedMachine);
                }
            }
        }
    };

    const fetchUserReservations = async () => {
        try {
            const data = await api.getUserReservations(0);
            const now = new Date();
            const futureReservations = data.filter(res => {
                try {
                    return new Date(res.time) > now;
                } catch (e) {
                    console.error("Geçersiz rezervasyon zamanı formatı:", res.time);
                    return false;
                }
            });
            // tarihe göre sırala
            futureReservations.sort((a: UserReservation, b: UserReservation) => new Date(a.time).getTime() - new Date(b.time).getTime());            setUserReservations(futureReservations);
        } catch (err) {
            console.error("Kullanıcı rezervasyonları alınamadı:", err);
        }
    };

    createEffect(async () => {
        try {
            const data = await api.listBuildings();
            setBuildings(data);
            if (data.length > 0) {
                setSelectedBuilding(data[0].id);
            }
        } catch (err) {
            console.error("Yurtlar yüklenemedi:", err);
        }
    });
    createEffect(async () => {
        const buildingId = selectedBuilding();
        if (!buildingId) return;

        try {
            const data = await api.listLaundries(buildingId);
            setLaundries(data);
            setSelectedLaundry(data[0]?.id || null);
        } catch (err) {
            console.error("Çamaşırhane listesi alınamadı:", err);
        }
    });
    createEffect(async () => {
        const laundryId = selectedLaundry();
        if (!laundryId) {
            setMachines([]);
            return;
        }

        try {
            const data = await api.listMachines(laundryId);
            setMachines(data);
        } catch (err) {
            console.error("Makine listesi alınamadı:", err);
        }
    });
    createEffect(() => {
        fetchUserReservations();
    });
    const handleMachineSelect = (machine: Machine) => {
        if (selectedMachine()?.id === machine.id) {
            setSelectedMachine(null);
            setSelectedDate(new Date());
            setSelectedTimeSlot(null);
        } else {
            setSelectedMachine(machine);
            setSelectedDate(new Date());
            setSelectedTimeSlot(null);
        }
    };

    const generateTimeSlots = (duration: number, existingReservations: { date: string; time: string }[]) => {
        const slots = [];
        const startHour = 8;
        const endHour = 22;
        const endMinute = 30;

        const selectedDay = selectedDate();
        const selectedDayString = format(selectedDay, 'yyyy-MM-dd');

        const reservationStartTimesForSelectedDay = new Set(
            existingReservations
                .filter(res => res.date === selectedDayString)
                .map(res => res.time)
        );

        let currentHour = startHour;
        let currentMinute = 0;
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            const slotStartTime = new Date(selectedDay);
            slotStartTime.setHours(currentHour, currentMinute, 0, 0);

            const endMinutes = currentMinute + duration;
            const endHourAdj = currentHour + Math.floor(endMinutes / 60);
            const endMinuteAdj = endMinutes % 60;
            const slotEndTime = new Date(selectedDay);
            slotEndTime.setHours(endHourAdj, endMinuteAdj, 0, 0);

            const slotId = `${startTime}-${endHourAdj.toString().padStart(2, '0')}:${endMinuteAdj.toString().padStart(2, '0')}`;

            if (endHourAdj < endHour || (endHourAdj === endHour && endMinuteAdj <= endMinute)) {
                // Saat aralığının dolu olup olmadığını HH:mm formatındaki string ile kontrol et
                const isReserved = reservationStartTimesForSelectedDay.has(startTime);
                // Saat aralığının "geçti" olup olmadığını başlangıç saatine göre kontrol et
                const isPastTime = isToday(selectedDay) && new Date().getTime() >= slotStartTime.getTime();

                slots.push({
                    id: slotId,
                    time: `${startTime} - ${endHourAdj.toString().padStart(2, '0')}:${endMinuteAdj.toString().padStart(2, '0')}`,
                    isReserved,
                    isPast: isPastTime
                });
            }

            currentMinute += duration;
            if (currentMinute >= 60) {
                currentMinute = currentMinute % 60;
                currentHour++;
            }
        }
        return slots;
    };
    const getOccupancyColor = (percentage: number) =>
        percentage < 30 ?
            "bg-green-100 text-green-800" :
            percentage < 70 ?
                "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800";
    const getWeekdayName = (date: Date) => format(date, 'EEEE', { locale: tr });
    const getFormattedDate = (date: Date) => format(date, 'EEEE, d MMMM', { locale: tr });
    const handleCancelReservation = async () => {
        const resToCancel = reservationToCancel();
        if (!resToCancel) return;

        try {
            await api.deleteReservation(resToCancel.id);

            setShowCancelModal(false);
            setReservationToCancel(null);
            setShowCancelSuccess(true); // İptal başarı mesajı
            setTimeout(() => setShowCancelSuccess(false), 3000);
            await refreshAllData();

        } catch (err) {
            console.error("Rezervasyon iptal edilirken hata:", err);
            setShowError(true); // Hata mesajı
            setTimeout(() => setShowError(false), 5000);
        }
    };

    const handleReservation = async () => {
        const machine = selectedMachine();
        const date = selectedDate();
        const timeSlot = selectedTimeSlot();

        if (!machine || !date || !timeSlot) {
            console.error("Eksik veri:", { machine: machine?.id, date, timeSlot });
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
            return;
        }

        try {
            const existingUserReservations = await api.getUserReservations(0);
            const hasReservationOnSelectedDay = existingUserReservations.some(res =>
                isSameDay(new Date(res.date), date)
            );
            if (hasReservationOnSelectedDay) {
                alert("Bu tarihte zaten bir rezervasyonunuz bulunmaktadır. Her gün için sadece bir rezervasyon yapabilirsiniz.");
                return;
            }

            const startTime = timeSlot.split(' - ')[0];
            const [hours, minutes] = startTime.split(':');
            const reservationDateTime = new Date(date);
            reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const isoDateTime = reservationDateTime.toISOString();
            const result = await api.createReservation({
                student_id: 1000,
                machine_id: machine.id,
                time: isoDateTime
            });
            setSelectedMachine(null);
            setSelectedTimeSlot(null);
            setSelectedDate(new Date());
            setShowReservationSuccess(true); // Rezervasyon başarı mesajı
            setTimeout(() => setShowReservationSuccess(false), 3000);
            await refreshAllData();

        } catch (err) {
            console.error("Rezervasyon yapılırken hata oluştu:", err);
            setShowError(true); // Hata mesajı
            setTimeout(() => setShowError(false), 5000);
        }
    };

    const openCancelModal = (reservation: UserReservation) => {
        setReservationToCancel(reservation);
        setShowCancelModal(true);
    };

    return (
        <div class="p-4 max-w-7xl mx-auto space-y-6">
            <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Çamaşırhane Yönetim Sistemi</h2>
                <div class="h-1 w-24 bg-gradient-to-r from-red-500 to-indigo-600 rounded-full mx-auto"></div>
            </div>

            {/* Başarı mesajları */}
            <Show when={showReservationSuccess()}>
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <svg class="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="text-green-800 font-medium">Rezervasyonunuz başarıyla oluşturuldu!</span>
                    </div>
                </div>
            </Show>


            <Show when={showCancelSuccess()}>
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <svg class="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="text-green-800 font-medium">Rezervasyonunuz başarıyla iptal edildi!</span>
                    </div>
                </div>
            </Show>

            {/* Hata mesajı */}
            <Show when={showError()}>
                <div class="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                    <div class="flex items-center">
                        <svg class="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span class="text-red-800 font-medium">Bir hata oluştu. Lütfen tekrar deneyin.</span>
                    </div>
                </div>
            </Show>

            <Show when={api.error()}>
                <div class="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                    <p class="text-red-700 font-medium">{api.error()}</p>
                </div>
            </Show>

            <Show when={userReservations().length > 0}>
                <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                                <svg class="h-5 w-5 text-orange-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-15-6h7.5" />
                                </svg>
                                Yaklaşan Randevularım
                            </h3>
                            <span class="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {userReservations().length} Rezervasyon
                            </span>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex flex-wrap gap-4 max-h-48 overflow-y-auto">
                            <For each={userReservations()}>
                                {(reservation) => (
                                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 flex-grow">
                                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 w-full">
                                            <div class="flex-1 min-w-0">
                                                <div class="font-semibold text-gray-900 text-sm mb-2">
                                                    {format(new Date(reservation.time), 'd MMMM yyyy EEEE HH:mm', { locale: tr })}
                                                </div>
                                                <div class="flex flex-wrap items-center space-x-2 text-xs text-gray-500">
                                                    <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                                        {reservation.laundry_name}
                                                    </span>
                                                    <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                                        {reservation.machine_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openCancelModal(reservation)}
                                                class="flex-shrink-0 inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 self-start sm:self-auto"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.728-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                                </svg>
                                                İptal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </Show>

            <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div class="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                        <svg class="h-5 w-5 text-pink-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Yurt Seçimi
                    </h3>
                </div>
                <div class="p-6">
                    <Show when={!api.loading()} fallback={
                        <div class="flex items-center justify-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span class="ml-3 text-gray-600">Yükleniyor...</span>
                        </div>
                    }>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <For each={buildings()}>
                                {(building) => (
                                    <button
                                        class={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                                            selectedBuilding() === building.id
                                                ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 text-pink-700 shadow-lg'
                                                : 'border-gray-200 hover:border-pink-300 bg-white hover:shadow-md'
                                        }`}
                                        onClick={() => setSelectedBuilding(building.id)}
                                    >
                                        <div class="font-semibold text-left mb-2">{building.name}</div>
                                        <div class="text-xs text-gray-500 text-left space-y-1">
                                            <div class="flex items-center">
                                                <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">ID: {building.id}</span>
                                            </div>
                                            {building.external_id && (
                                                <div class="flex items-center">
                                                    <span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">Yurt ID: {building.external_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </div>

            <Show when={selectedBuilding()}>
                {/* Bilgilendirme Alert'i */}
                <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400 p-4 rounded-lg shadow-sm">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-orange-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-orange-800">
                                <span class="font-bold">Önemli:</span> Rezervasyon sadece 7 gün sonrasına kadar alabilirsiniz. Her gün için en fazla bir rezervasyon yapabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                            <h3 class="font-semibold text-gray-900 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-blue-600 mr-2">
                                    <path d="M0 0h24v24H0z" stroke="none"/>
                                    <rect x="5" y="3" width="14" height="18" rx="2"/>
                                    <path d="M7 6h10M7 19h10M7 10h10M7 14h10"/>
                                </svg>
                                Çamaşırhane Listesi
                            </h3>
                            <Show when={selectedBuilding()}>
                                <p class="text-xs text-gray-600 mt-1">
                                    {buildings().find(b => b.id === selectedBuilding())?.name}
                                </p>
                            </Show>
                        </div>
                        <div class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            <For each={laundries()}>
                                {(laundry) => (
                                    <div
                                        class={`p-4 cursor-pointer transition-all duration-200 ${
                                            selectedLaundry() === laundry.id
                                                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500'
                                                : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => !laundry.is_empty && setSelectedLaundry(laundry.id)}
                                    >
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <h4 class="font-medium text-gray-900">{laundry.name}</h4>
                                                <p class="text-xs text-gray-500 mt-1">ID: {laundry.id}</p>
                                            </div>
                                            <span class={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                laundry.is_empty
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {laundry.is_empty ? 'Yok' : `${machines().filter(m => m.laundry_id === laundry.id).length} Makine`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>

                    <div class="lg:col-span-2 flex flex-col gap-6">
                        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div class="bg-gradient-to-r from-indigo-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                                <h3 class="font-semibold text-gray-900 flex items-center">
                                    <svg class="h-4 w-4 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 18h.01" />
                                        <path d="M12 6h.01" />
                                        <path d="M6 12h.01" />
                                        <path d="M18 12h.01" />
                                    </svg>
                                    Çamaşır Makineleri
                                </h3>
                                <Show when={selectedLaundry()}>
                                    <p class="text-xs text-gray-600 mt-1">
                                        {laundries().find(l => l.id === selectedLaundry())?.name}
                                    </p>
                                </Show>
                            </div>
                            <Show when={laundries().find(l => l.id === selectedLaundry())?.is_empty}>
                                <div class="p-8 text-center">
                                    <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                    </svg>
                                    <p class="text-gray-500 font-medium">Bu yurtta çamaşırhane bulunmamaktadır</p>
                                </div>
                            </Show>
                            <Show when={!laundries().find(l => l.id === selectedLaundry())?.is_empty}>
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Makine</th>
                                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Süre</th>
                                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Durum</th>
                                            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">İşlem</th>
                                        </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-100">
                                        <For each={machines()}>
                                            {(machine) => (
                                                <tr class={`hover:bg-gray-50 transition-colors duration-200 ${selectedMachine()?.id === machine.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : ''}`}>
                                                    <td class="px-4 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                                                                <span class="text-blue-700 font-bold text-sm">{machine.name.split(' ')[1]}</span>
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-semibold text-gray-900">{machine.name}</div>
                                                                <div class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ID: {machine.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-4 whitespace-nowrap">
                                                            <span class="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                                                {machine.duration} dakika
                                                            </span>
                                                    </td>
                                                    <td class="px-4 py-4 whitespace-nowrap">
                                                            <span class={`px-3 py-1 rounded-full text-xs font-semibold ${getOccupancyColor(machine.occupancy || 0)}`}>
                                                                %{machine.occupancy || 0} - {machine.occupancy === undefined ? "Bilinmiyor" :
                                                                machine.occupancy < 30 ? "Müsait" :
                                                                    machine.occupancy < 70 ? "Orta Dolu" : "Dolu"}
                                                            </span>
                                                    </td>
                                                    <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => handleMachineSelect(machine)}
                                                            class={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                                                                selectedMachine()?.id === machine.id
                                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                                                    : (machine.occupancy || 0) < 100
                                                                        ? 'text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 border border-blue-200 hover:border-blue-600'
                                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            }`}
                                                            disabled={(machine.occupancy || 0) >= 100}
                                                        >
                                                            {(machine.occupancy || 0) < 100 ? "Rezervasyon Yap" : "Dolu"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>

                        <Show when={selectedMachine()}>
                            <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                                <div class="bg-gradient-to-r from-green-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                                            <svg class="h-5 w-5 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                            Rezervasyon: {selectedMachine()?.name}
                                        </h3>
                                        <button
                                            onClick={() => setSelectedMachine(null)}
                                            class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="p-6 space-y-8">
                                    <div>
                                        <h4 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                            <svg class="w-5 h-5 mr-2 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                                            </svg>
                                            Tarih Seçin
                                        </h4>
                                        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                            <div class="flex space-x-2 overflow-x-auto whitespace-nowrap">
                                                <For each={[...Array(7)].map((_, i) => addDays(new Date(), i))}>
                                                    {(day) => {
                                                        const dayOfWeek = getDay(day);
                                                        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDate(day);
                                                                    setSelectedTimeSlot(null);
                                                                }}
                                                                class={`flex-shrink-0 w-20 p-3 rounded-xl transition-all duration-200 text-center transform hover:scale-105 ${
                                                                    isSameDay(selectedDate(), day)
                                                                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                                                                        : isToday(day)
                                                                            ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 border-2 border-green-300 shadow-md'
                                                                            : 'bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                                                                }`}
                                                            >
                                                                <div class="text-xs font-medium mb-1">{dayNames[dayOfWeek]}</div>
                                                                <div class="text-lg font-bold">{format(day, 'd')}</div>
                                                                {isToday(day) && <div class="text-xs mt-1 opacity-75">Bugün</div>}
                                                            </button>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                            <div class="mt-4 text-center">
                                                <p class="text-sm text-gray-600">
                                                    Seçilen tarih: <span class="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">{getFormattedDate(selectedDate())}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                            <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Saat Aralığı Seçin
                                            <span class="ml-2 text-sm bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">
                                                {selectedMachine()?.duration} dakika
                                            </span>
                                        </h4>
                                        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                                                <For each={generateTimeSlots(selectedMachine()?.duration || 30, selectedMachine()?.reservations || [])}>
                                                    {(slot) => (
                                                        <button
                                                            class={`py-4 px-3 text-sm rounded-xl border-2 transition-all duration-200 font-semibold transform hover:scale-105 ${
                                                                selectedTimeSlot() === slot.id
                                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-600 shadow-lg'
                                                                    : slot.isReserved || slot.isPast
                                                                        ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                        : 'bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 text-gray-700 border-gray-300 hover:border-green-400 hover:shadow-md'
                                                            }`}
                                                            onClick={() => setSelectedTimeSlot(slot.id)}
                                                            disabled={slot.isReserved || slot.isPast}
                                                        >
                                                            <div class="font-bold">{slot.time}</div>
                                                            {slot.isReserved && <div class="text-xs mt-1 opacity-75">Dolu</div>}
                                                            {slot.isPast && <div class="text-xs mt-1 opacity-75">Geçti</div>}
                                                        </button>
                                                    )}
                                                </For>
                                            </div>
                                            <Show when={selectedTimeSlot()}>
                                                <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                    <div class="flex items-center justify-center">
                                                        <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <p class="text-green-800 font-semibold">
                                                            Seçilen saat: {selectedTimeSlot()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Show>
                                        </div>
                                    </div>
                                </div>

                                <div class="p-6 bg-gradient-to-r from-pink-50 to-red-50 border-t border-gray-200">
                                    <div class="mb-6">
                                        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg class="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            Rezervasyon Özeti
                                        </h4>
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div class="space-y-3">
                                                <div class="flex justify-between items-center">
                                                    <span class="text-gray-600 font-medium">Makine:</span>
                                                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">{selectedMachine()?.name}</span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <span class="text-gray-600 font-medium">Tarih:</span>
                                                    <span class="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">{getFormattedDate(selectedDate())}</span>
                                                </div>
                                            </div>
                                            <div class="space-y-3">
                                                <div class="flex justify-between items-center">
                                                    <span class="text-gray-600 font-medium">Saat:</span>
                                                    <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">{selectedTimeSlot() || "Seçilmedi"}</span>
                                                </div>
                                                <div class="flex justify-between items-center">
                                                    <span class="text-gray-600 font-medium">Süre:</span>
                                                    <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded font-semibold">{selectedMachine()?.duration} dakika</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                                        <button
                                            type="button"
                                            class="px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
                                            onClick={() => setSelectedMachine(null)}
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!selectedTimeSlot()}
                                            class={`px-8 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-200 transform hover:scale-105 ${
                                                selectedTimeSlot()
                                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-xl'
                                                    : 'bg-gray-300 cursor-not-allowed'
                                            }`}
                                            onClick={handleReservation}
                                        >
                                            <span class="flex items-center justify-center">
                                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Rezervasyonu Onayla
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </div>
                </div>
            </Show>

            {/* İptal Modal'ı */}
            <Show when={showCancelModal()}>
                <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div class="relative w-full max-w-md">
                        <div class="relative bg-white rounded-2xl shadow-2xl border border-gray-200">
                            <button
                                type="button"
                                class="absolute top-4 right-4 text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600 rounded-full text-sm w-8 h-8 flex items-center justify-center transition-all duration-200"
                                onClick={() => setShowCancelModal(false)}
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                            <div class="p-8 text-center">
                                <div class="mx-auto mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                                <h3 class="mb-6 text-xl font-semibold text-gray-900">Rezervasyonu İptal Et</h3>
                                <p class="mb-8 text-gray-600">Rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={handleCancelReservation}
                                        type="button"
                                        class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                    >
                                        Evet, İptal Et
                                    </button>
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        type="button"
                                        class="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                                    >
                                        Hayır, Vazgeç
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}