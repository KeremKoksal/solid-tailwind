import { createSignal, Show, For, createEffect, createMemo } from 'solid-js';
import Modal from '~/components/Modal';

interface Props {
    machineId: number;
    duration: number;
    studentId: number;
    studentBuildingId: number;
    machineBuildingId: number;
    onClose?: () => void;
}

interface ReservationSlot {
    label: string;
    startTime: string;
    isReserved: boolean;
    isMine?: boolean;
    reservationId?: number;
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

function calculateSlots(duration: number, date: string): ReservationSlot[] {
    const slots: ReservationSlot[] = [];
    const start = new Date(`${date}T08:00:00`);
    const end = new Date(`${date}T22:00:00`);

    while (start.getTime() + duration * 60000 <= end.getTime()) {
        const next = new Date(start.getTime() + duration * 60000);
        slots.push({
            label: `${start.getHours().toString().padStart(2, '0')}:${start
                .getMinutes()
                .toString()
                .padStart(2, '0')} - ${next
                .getHours()
                .toString()
                .padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`,
            startTime: start.toISOString(),
            isReserved: false,
        });
        start.setTime(next.getTime());
    }
    return slots;
}

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

function get7DaysLater(): string {
    const today = new Date();
    today.setDate(today.getDate() + 6);
    return today.toISOString().split('T')[0];
}

function dayRangeZ(dateStr: string) {
    const startLocal = new Date(`${dateStr}T00:00:00`);
    const endLocal = new Date(`${dateStr}T23:59:59`);
    return {
        startZ: startLocal.toISOString(),
        endZ: endLocal.toISOString(),
    };
}

function todayStartZ() {
    return dayRangeZ(getTodayDate()).startZ;
}
function weekEndZ() {
    const endLocal = new Date(`${get7DaysLater()}T23:59:59`);
    return endLocal.toISOString();
}

export default function LaundryReservation_isil(props: Props) {
    const [slots, setSlots] = createSignal<ReservationSlot[]>([]);
    const [message, setMessage] = createSignal('');
    const [selectedDate, setSelectedDate] = createSignal(getTodayDate());
    const [reservations, setReservations] = createSignal<any[]>([]);
    const [slotFilter, setSlotFilter] =
        createSignal<'all' | 'empty' | 'mine'>('all');
    const [confirmDeleteId, setConfirmDeleteId] = createSignal<number | null>(
        null
    );
    const [showConfirmModal, setShowConfirmModal] = createSignal(false);
    const [showSlots, setShowSlots] = createSignal(true);

    const [myReservations, setMyReservations] = createSignal<any[]>([]);
    const [weeklyEmptySlots, setWeeklyEmptySlots] =
        createSignal<Record<string, ReservationSlot[]>>({});
    const [weeklyLoading, setWeeklyLoading] = createSignal(false);
    const [openDays, setOpenDays] = createSignal<Set<string>>(new Set());

    function toggleDay(date: string) {
        setOpenDays((prev) => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    }

    function formatDayLabel(dateStr: string): string {
        const d = new Date(dateStr + 'T00:00:00');
        const weekday = d.toLocaleDateString('tr-TR', { weekday: 'short' });
        const day = d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
        });
        return `${weekday} ${day}`;
    }

    const hasReservationOnSelectedDate = createMemo(() => {
        const selected = new Date(selectedDate()).toDateString();
        return myReservations().some(
            (r) =>
                new Date(r.time).toDateString() === selected &&
                r.student_id === props.studentId
        );
    });

    const futureReservations = createMemo(() => {
        const now = new Date();
        return myReservations().filter((r) => new Date(r.time) > now);
    });

    async function loadReservations() {
        const { startZ, endZ } = dayRangeZ(selectedDate());
        const tStartZ = todayStartZ();
        const wEndZ = weekEndZ();

        const occ = await fetchRpc('list_laundry_reservations', {
            filters: {
                machine_id: { $eq: props.machineId },
                active: { $eq: true },
                time: { $gte: startZ, $lte: endZ },
            },
            list_options: { limit: 1000, offset: 0 },
        });

        const mine = await fetchRpc('list_own_laundry_reservations', {
            filters: {
                active: { $eq: true },
                time: { $gte: tStartZ, $lte: wEndZ },
            },
            list_options: { limit: 1000, offset: 0 },
        });

        const reservationData = occ.data ?? [];
        const myData = mine.data ?? [];

        setReservations(reservationData);
        setMyReservations(myData);

        const allSlots = calculateSlots(props.duration, selectedDate()).map(
            (slot) => {
                const slotTime = new Date(slot.startTime).getTime();
                const matchingOcc = reservationData.find(
                    (r: any) => new Date(r.time).getTime() === slotTime
                );
                const matchingMine = myData.find(
                    (r: any) => new Date(r.time).getTime() === slotTime
                );

                return {
                    ...slot,
                    isReserved: !!matchingOcc,
                    isMine: !!matchingMine,
                    reservationId: matchingMine?.id ?? matchingOcc?.id,
                };
            }
        );

        setSlots(allSlots);
    }

    async function loadWeeklyEmptySlots() {
        setWeeklyLoading(true);
        try {
            const { startZ } = dayRangeZ(getTodayDate());

            const endLocal = new Date(`${get7DaysLater()}T23:59:59`);
            const endZ = endLocal.toISOString();

            const occ = await fetchRpc('list_laundry_reservations', {
                filters: {
                    machine_id: { $eq: props.machineId },
                    active: { $eq: true },
                    time: { $gte: startZ, $lte: endZ },
                },
                list_options: { limit: 2000, offset: 0 },
            });
            const reservationData = occ.data ?? [];

            const mine = await fetchRpc('list_own_laundry_reservations', {
                filters: {
                    time: { $gte: startZ, $lte: endZ },
                },
                list_options: { limit: 2000, offset: 0 },
            });
            const myData = mine.data ?? [];

            const map: Record<string, ReservationSlot[]> = {};

            for (let i = 0; i < 7; i++) {
                const dateStr = addDays(getTodayDate(), i);

                const iHaveOneThatDay = myData.some((r: { time?: string }) => {
                    const t = r?.time;
                    if (!t) return false;
                    const d = new Date(t);
                    if (isNaN(d.getTime())) return false;
                    return d.toISOString().slice(0, 10) === dateStr;
                });
                if (iHaveOneThatDay) {
                    map[dateStr] = [];
                    continue;
                }

                const daySlots = calculateSlots(props.duration, dateStr).map((slot) => {
                    const slotTime = new Date(slot.startTime).getTime();
                    const reserved = reservationData.find(
                        (r: any) => new Date(r.time).getTime() === slotTime
                    );
                    return {
                        ...slot,
                        isReserved: !!reserved,
                        isMine: reserved?.student_id === props.studentId,
                        reservationId: reserved?.id,
                    };
                });

                map[dateStr] = daySlots.filter((s) => {
                    const isToday = dateStr === getTodayDate();
                    const isPast = isToday && new Date(s.startTime).getTime() < Date.now();
                    return !s.isReserved && !isPast;
                });
            }

            setWeeklyEmptySlots(map);
        } catch (e) {
            console.error(e);
            setWeeklyEmptySlots({});
        } finally {
            setWeeklyLoading(false);
        }
    }


    async function reserve(slot: ReservationSlot) {
        if (props.studentBuildingId !== props.machineBuildingId) {
            setMessage('Sadece kendi yurdunuzdaki makinelere rezervasyon yapabilirsiniz.');
            return;
        }

        const studentId = props.studentId;
        const selected = new Date(slot.startTime);

        if (slot.isReserved && slot.isMine) {
            const confirmed = confirm(
                `"${slot.label}" saatindeki rezervasyonu iptal etmek istediğine emin misin?`
            );
            if (!confirmed) return;

            const myReservation = myReservations().find(
                (r) =>
                    r.student_id === studentId &&
                    new Date(r.time).getTime() === selected.getTime()
            );

            if (myReservation) {
                try {
                    await fetchRpc('delete_laundry_reservation', {
                        id: myReservation.id,
                    });
                    setMessage('Rezervasyon iptal edildi.');
                    await loadReservations();
                    if (slotFilter() === 'empty') await loadWeeklyEmptySlots();
                    return;
                } catch (e: any) {
                    setMessage(`İptal hatası: ${e.message}`);
                    return;
                }
            }
        }

        const sameDay = myReservations().some((r) => {
            const rDate = new Date(r.time);
            return rDate.toDateString() === selected.toDateString();
        });
        if (sameDay) {
            setMessage('Aynı gün içinde yalnızca 1 rezervasyon yapabilirsiniz.');
            return;
        }

        const oneWeekLater = new Date();
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);
        const weeklyCount = myReservations().filter((r) => {
            const rDate = new Date(r.time);
            return rDate >= new Date() && rDate <= oneWeekLater;
        }).length;
        if (weeklyCount >= 7) {
            setMessage('Bir haftada en fazla 7 rezervasyon yapabilirsiniz.');
            return;
        }

        const confirmed = confirm(
            `"${slot.label}" saatine rezervasyon yapmak istediğine emin misin?`
        );
        if (!confirmed) return;

        try {
            await fetchRpc('create_own_laundry_reservation', {
                data: {
                    student_id: studentId,
                    machine_id: props.machineId,
                    time: slot.startTime,
                },
            });
            setMessage(`Rezervasyon yapıldı: ${slot.label}`);
            await loadReservations();
            if (slotFilter() === 'empty') await loadWeeklyEmptySlots();
        } catch (e: any) {
            setMessage(`Hata: ${e.message}`);
        }

        try {
            await fetchRpc('create_laundry_reservation', {
                data: {
                    student_id: studentId,
                    machine_id: props.machineId,
                    time: slot.startTime,
                },
            });
            setMessage(`Rezervasyon yapıldı: ${slot.label}`);
            await loadReservations();
            if (slotFilter() === 'empty') await loadWeeklyEmptySlots();
        } catch (e: any) {
            setMessage(`Hata: ${e.message}`);
        }
    }

    function addDays(dateStr: string, days: number): string {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    const remainingQuota = createMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();
        const oneWeekLater = new Date();
        oneWeekLater.setDate(now.getDate() + 7);

        const weekReservations = myReservations().filter((r) => {
            const rTime = new Date(r.time);
            const rDateStr = rTime.toDateString();
            return rTime <= oneWeekLater && (rTime >= now || rDateStr === todayStr);
        });

        return 7 - weekReservations.length;
    });

    createEffect(() => {
        props.machineId;
        selectedDate();
        loadReservations();
        setMessage('');
    });

    createEffect(() => {
        if (message()) {
            const timer = setTimeout(() => setMessage(''), 6000);
            return () => clearTimeout(timer);
        }
    });

    createEffect(() => {
        slotFilter();
        props.machineId;
        props.duration;
        if (slotFilter() === 'empty') loadWeeklyEmptySlots();
    });

    return (
        <Show when={showSlots()}>
            <div class="w-full bg-gradient-to-br from-gray-50 via-white to-slate-50 rounded-2xl shadow-md border border-gray-200 backdrop-blur-sm">
                <div class="bg-gradient-to-r from-white-50 to-green-100 px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H6zM4 6h12v2H4V6z"/>
                                </svg>
                            </div>
                            <h3 class="text-xl font-bold text-black">
                                Rezervasyon Slotları
                            </h3>
                        </div>
                        <button
                            class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
                            onClick={() => props.onClose?.()}
                            aria-label="Kapat"
                        >
                            ×
                        </button>
                    </div>
                </div>


                <div class="p-6 space-y-6">
                    <div
                        class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-6 py-4 rounded-xl shadow-sm">
                        <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <span class="text-amber-600 text-lg">⚡</span>
                            </div>
                            <p class="text-amber-800 font-medium">
                                Her öğrenci aynı gün içinde en fazla <span class="font-bold">1</span> ve bir hafta içinde toplamda
                                <span class="font-bold"> 7</span> rezervasyon yapabilir.
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div class="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const newDate = addDays(selectedDate(), -1);
                                    if (newDate >= getTodayDate()) setSelectedDate(newDate);
                                }}
                                disabled={selectedDate() <= getTodayDate()}
                                class={`w-10 h-10 rounded-xl border font-bold transition-all duration-200 ${
                                    selectedDate() <= getTodayDate()
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 cursor-pointer'
                                }`}
                                title={selectedDate() <= getTodayDate() ? 'Geçmiş tarihe gidemezsiniz' : 'Önceki gün'}
                            >
                                ←
                            </button>

                            <input
                                type="date"
                                value={selectedDate()}
                                min={getTodayDate()}
                                max={get7DaysLater()}
                                onInput={(e) => setSelectedDate(e.currentTarget.value)}
                                class="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-gray-600 font-semibold focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all duration-200"
                            />

                            <button
                                onClick={() => {
                                    const newDate = addDays(selectedDate(), 1);
                                    if (newDate <= get7DaysLater()) setSelectedDate(newDate);
                                }}
                                disabled={selectedDate() >= get7DaysLater()}
                                class={`w-10 h-10 rounded-xl border font-bold transition-all duration-200 ${
                                    selectedDate() >= get7DaysLater()
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white hover:border-gray-800 cursor-pointer'
                                }`}
                                title={selectedDate() >= get7DaysLater() ? 'Maksimum 7 gün ileriye gidebilirsiniz' : 'Sonraki gün'}
                            >
                                →
                            </button>
                        </div>

                        <div
                            class="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-200 rounded-xl px-6 py-4 text-center shadow-sm">
                            <div class="text-xs font-semibold text-orange-700 uppercase tracking-wide">Kalan Hakkınız
                            </div>
                            <div class="text-2xl font-bold text-orange-800 mt-1">{remainingQuota()} / 7</div>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                class={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                                    slotFilter() === 'all'
                                        ? 'bg-blue-100 text-gray-800 border border-blue-300'
                                        : 'bg-white text-blue-300 border-2 border-blue-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSlotFilter('all')}
                            >
                                Tümü
                            </button>
                            <button
                                class={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                                    slotFilter() === 'empty'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-white text-emerald-500 border-2 border-emerald-200 hover:border-emerald-300'
                                }`}
                                onClick={() => setSlotFilter('empty')}
                            >
                                Boş
                            </button>
                            <button
                                class={`px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                                    slotFilter() === 'mine'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-white text-amber-500 border-2 border-amber-200 hover:border-amber-300'
                                }`}
                                onClick={() => setSlotFilter('mine')}
                            >
                                Rezervasyonlarım
                            </button>
                        </div>
                    </div>

                    <Show when={message()}>
                        <div class="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 text-gray-600 px-6 py-4 rounded-xl shadow-sm font-medium">
                            {message()}
                        </div>
                    </Show>


                    <Show
                        when={slotFilter() === 'empty'}
                        fallback={
                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                <For
                                    each={slots().filter((slot) => {
                                        const isPast =
                                            selectedDate() === getTodayDate() &&
                                            new Date(slot.startTime).getTime() < Date.now();
                                        if (slotFilter() === 'mine') return slot.isMine;
                                        if (slotFilter() === 'empty') return !slot.isReserved && !isPast;
                                        return true;
                                    })}
                                >
                                    {(slot) => {
                                        const isPast =
                                            selectedDate() === getTodayDate() &&
                                            new Date(slot.startTime).getTime() < Date.now();
                                        const isDisabled = (slot.isReserved && !slot.isMine) || isPast;
                                        return (
                                            <button
                                                class={`relative p-4 rounded-xl font-semibold shadow-sm transition-all duration-200 transform hover:scale-105 ${
                                                    isPast
                                                        ? 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                                                        : slot.isReserved
                                                            ? slot.isMine
                                                                ? 'bg-white text-amber-600 border-2 border-amber-300 hover:shadow-md'
                                                                : 'bg-white text-rose-600 border-2 border-rose-300'
                                                            : 'bg-white text-emerald-600 border-2 border-emerald-300 hover:shadow-md cursor-pointer'
                                                }`}
                                                disabled={isDisabled}
                                                title={
                                                    isPast
                                                        ? 'Geçmiş zaman – seçim yapılamaz'
                                                        : slot.isReserved
                                                            ? slot.isMine
                                                                ? 'Rezervasyonu silmek için tıklayın'
                                                                : 'Bu slot dolu'
                                                            : 'Rezervasyonu için tıklayın'
                                                }
                                                onClick={() => {
                                                    if (!isDisabled) reserve(slot);
                                                }}
                                            >
                                                <div class="text-center">
                                                    <div class="font-bold text-sm">{slot.label}</div>
                                                    {!isPast && (
                                                        <div class="text-xs mt-1 opacity-80">
                                                            {slot.isMine
                                                                ? slot.startTime.startsWith(getTodayDate())
                                                                    ? 'Bugünkü'
                                                                    : 'Rezervasyonunuz'
                                                                : slot.isReserved
                                                                    ? 'Dolu'
                                                                    : hasReservationOnSelectedDate()
                                                                        ? 'x'
                                                                        : 'Müsait'}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    }}
                                </For>
                            </div>
                        }
                    >

                        <div class="space-y-4" style="min-height: 500px;">
                            <div
                                class="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 text-gray-600 px-6 py-4 rounded-xl shadow-sm">
                                <div class="flex items-center gap-3">
                                    <span class="font-medium">Rezervasyon yapmak istediğiniz güne tıklayarak rezervasyonunuzu oluşturabilirsiniz.</span>
                                </div>
                            </div>

                            <Show when={!weeklyLoading()} fallback={
                                <div class="text-center py-8">
                                    <div class="inline-flex items-center gap-2 text-gray-500">
                                        <div
                                            class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Haftalık boş slotlar yükleniyor…</span>
                                    </div>
                                </div>
                            }>
                                <For each={Object.keys(weeklyEmptySlots()).sort()}>
                                    {(date) => {
                                        const daySlots = weeklyEmptySlots()[date] ?? [];
                                        if (daySlots.length === 0) return null;

                                        const headerLabel = formatDayLabel(date);
                                        const isOpen = () => openDays().has(date);

                                        return (
                                            <div
                                                class="bg-white border-2 border-emerald-100 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                                <button
                                                    class={`w-full text-left px-6 py-5 flex items-center justify-between transition-all duration-200 ${
                                                        isOpen()
                                                            ? 'bg-green-100 text-green-700 border-b border-green-200'
                                                            : 'bg-white text-green-700 border-b border-green-200 hover:bg-green-50'
                                                    }`}
                                                    onClick={() => toggleDay(date)}
                                                >
                                                    <span class="font-bold text-lg">{headerLabel}</span>
                                                    <div
                                                        class={`inline-flex items-center justify-center rounded-full px-4 py-2 font-semibold ${
                                                            isOpen()
                                                                ? 'bg-white/30 text-gray-700'
                                                                : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {daySlots.length} boş slot
                                                    </div>
                                                </button>

                                                <Show when={isOpen()}>
                                                    <div class="p-6 bg-gradient-to-br from-gray-50 to-emerald-50">
                                                        <div
                                                            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                            <For each={daySlots}>
                                                                {(slot) => {
                                                                    const isToday = date === getTodayDate();
                                                                    const isPast = isToday && new Date(slot.startTime).getTime() < Date.now();
                                                                    return (
                                                                        <button
                                                                            class={`p-3 rounded-lg font-semibold shadow-md transition-all duration-200 transform hover:scale-105 ${
                                                                                isPast
                                                                                    ? 'bg-gray-100 text-gray-500 border border-gray-200'
                                                                                    : 'bg-white text-emerald-600 border border-emerald-300 hover:bg-emerald-50'
                                                                            }`}
                                                                            disabled={isPast}
                                                                            title={isPast ? 'Geçmiş zaman – seçim yapılamaz' : 'Rezervasyon için tıklayın'}
                                                                            onClick={async () => {
                                                                                if (isPast) return;
                                                                                await reserve(slot);
                                                                                await loadWeeklyEmptySlots();
                                                                                const left = (weeklyEmptySlots()[date] ?? []).length;
                                                                                if (left === 0) toggleDay(date);
                                                                            }}
                                                                        >
                                                                            <div class="text-center">
                                                                                <div
                                                                                    class="font-bold text-sm">{slot.label}</div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                }}
                                                            </For>
                                                        </div>
                                                    </div>
                                                </Show>
                                            </div>
                                        );
                                    }}
                                </For>

                                <Show
                                    when={Object.keys(weeklyEmptySlots()).every(
                                        (d) => (weeklyEmptySlots()[d] ?? []).length === 0
                                    )}
                                >
                                    <div class="text-center py-12">
                                        <p class="text-gray-500 font-medium">Önümüzdeki 7 gün için boş saat
                                            bulunamadı.</p>
                                    </div>
                                </Show>
                            </Show>
                        </div>
                    </Show>


                    <Show
                        when={
                            slotFilter() === 'mine' &&
                            futureReservations().some((r) => {
                                const isToday =
                                    new Date(r.time).toDateString() === new Date().toDateString();
                                return r.student_id === props.studentId && !isToday;
                            })
                        }
                    >
                        <div class="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 shadow-lg">
                            <h4 class="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">

                                Planlanan Rezervasyonlar
                            </h4>
                            <div class="space-y-3">
                                <For
                                    each={futureReservations()
                                        .filter((r) => {
                                            const isToday =
                                                new Date(r.time).toDateString() === new Date().toDateString();
                                            return r.student_id === props.studentId && !isToday;
                                        })
                                        .sort(
                                            (a, b) =>
                                                new Date(a.time).getTime() - new Date(b.time).getTime()
                                        )}
                                >
                                    {(r, index) => {
                                        const d = new Date(r.time);
                                        const label = d.toLocaleDateString('tr-TR', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                        });
                                        const time = d.toLocaleTimeString('tr-TR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        });

                                        return (
                                            <div class="relative bg-white border-2 border-amber-200 rounded-xl p-4 shadow-md transition-all duration-200 hover:shadow-lg">
                                                <Show when={index() === 0}>
                                                    <div class="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                                                        Yaklaşan Rezervasyon
                                                    </div>
                                                </Show>

                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-bold text-amber-900">{label}</div>
                                                        <div class="text-amber-800 font-semibold">{time}</div>
                                                    </div>

                                                    <button
                                                        class="px-4 py-2 bg-gradient-to-r from-rose-400 to-red-400 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                                                        onClick={() => {
                                                            setConfirmDeleteId(r.id);
                                                            setShowConfirmModal(true);
                                                        }}
                                                    >
                                                        İptal
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>

            <Show when={showConfirmModal()}>
                <Modal
                    open={showConfirmModal()}
                    onClose={() => {
                        setShowConfirmModal(false);
                        setConfirmDeleteId(null);
                    }}
                    title="Rezervasyonu İptal Et"
                >
                    <div class="space-y-6">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-rose-600 text-2xl">⚠️</span>
                            </div>
                            <p class="text-gray-700 font-medium text-lg">Bu rezervasyonu iptal etmek istediğinize emin misiniz?</p>
                        </div>

                        <div class="flex justify-center gap-4">
                            <button
                                class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmDeleteId(null);
                                }}
                            >
                                Vazgeç
                            </button>
                            <button
                                class="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                onClick={async () => {
                                    try {
                                        await fetchRpc('delete_laundry_reservation', {
                                            id: confirmDeleteId(),
                                        });
                                        setMessage('Rezervasyon iptal edildi.');
                                        await loadReservations();
                                        if (slotFilter() === 'empty') await loadWeeklyEmptySlots();
                                    } catch (e: any) {
                                        setMessage('Silme hatası: ' + e.message);
                                    } finally {
                                        setShowConfirmModal(false);
                                        setConfirmDeleteId(null);
                                    }
                                }}
                            >
                                İptal Et
                            </button>
                        </div>
                    </div>
                </Modal>
            </Show>
        </Show>
    );
}