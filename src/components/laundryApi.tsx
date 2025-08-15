// components/laundryApi.tsx

import { createSignal } from "solid-js";
import { format, addDays } from "date-fns";

const BASE_URL = "https://dema.cc.metu.edu.tr/api";

export const useLaundryApi = () => {
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal("");

    const fetchRPC = async (method: string, params: any = {}) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${BASE_URL}/rpc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                mode: "cors",
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: Math.floor(Math.random() * 1000),
                    method,
                    params
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            return data.result;
        } catch (err) {
            setError(err.message);
            console.error(`API Error (${method}):`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const listBuildings = async () => {
        try {
            const buildings = await fetchRPC("list_buildings", {
                list_options: { limit: 50, offset: 0 }
            });
            return buildings.data.map((building: any) => ({
                id: building.id,
                yurt_id: building.external_id,
                name: building.name,
                location: building.location,
            }));
        } catch (error) {
            console.error("Yurt listesi alınırken hata:", error);
            return [];
        }
    };

    const listLaundries = async (buildingId: number) => {
        try {
            const laundries = await fetchRPC("list_laundrys", {
                filters: { building_id: { $eq: buildingId } },
                list_options: { limit: 10, offset: 0 }
            });
            if (!laundries.data || laundries.data.length === 0) {
                return [{ id: 0, name: "Çamaşırhane Yok", building_id: buildingId, is_empty: true }];
            }
            return laundries.data.map((laundry: any) => ({
                id: laundry.id,
                name: laundry.name,
                building_id: laundry.building_id,
                opening_time: laundry.opening_time,
                closing_time: laundry.closing_time,
                is_empty: false
            }));
        } catch (error) {
            console.error("Çamaşırhane listesi alınırken hata:", error);
            return [{ id: 0, name: "Çamaşırhane Yok", building_id: buildingId, is_empty: true }];
        }
    };

    const listMachines = async (laundryId: number) => {
        try {
            const machines = await fetchRPC("list_laundry_machines", {
                filters: { laundry_id: { $eq: laundryId } },
                list_options: { limit: 50, offset: 0 }
            });

            // bir haftalık rezervasyon verileri
            const today = new Date();
            const nextWeek = addDays(today, 7);

            const allReservations = await fetchRPC("list_laundry_reservations", {
                filters: {
                    machine_id: {
                        $in: machines.data.map((m: any) => m.id)
                    }
                },
                list_options: { limit: 500, offset: 0 }
            });

            console.log("Tüm rezervasyonlar:", allReservations);

            const machineMap = new Map();
            machines.data.forEach((machine: any) => {
                machineMap.set(machine.id, {
                    ...machine,
                    reservations: []
                });
            });

            // rezervasyonları makinelere atama
            allReservations.data.forEach((res: any) => {
                const machine = machineMap.get(res.machine_id);
                if (machine) {
                    // tarih/saat
                    const reservationDate = new Date(res.time);
                    const dateStr = format(reservationDate, 'yyyy-MM-dd');
                    const timeStr = format(reservationDate, 'HH:mm');

                    machine.reservations.push({
                        date: dateStr,
                        time: timeStr
                    });
                }
            });

            const machinesWithOccupancy = Array.from(machineMap.values()).map((machine: any) => {
                const duration = machine.duration || 30;
                const dailySlots = Math.floor((22.5 * 60 - 8 * 60) / duration);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const reservedSlotsToday = machine.reservations.filter((res: any) => res.date === todayStr).length;
                const occupancy = Math.min(100, Math.round((reservedSlotsToday / dailySlots) * 100));

                console.log(`Makine ${machine.name} rezervasyonları:`, machine.reservations);

                return {
                    ...machine,
                    occupancy
                };
            });

            return machinesWithOccupancy;
        } catch (error) {
            console.error("Makine listesi alınırken hata:", error);
            return [];
        }
    };

    const createReservation = async (reservationData: { student_id: number; machine_id: number; time: string }) => {
        console.log("API'ye gönderilen rezervasyon verisi:", reservationData);

        const result = await fetchRPC("create_laundry_reservation", {
            data: reservationData
        });

        console.log("API'den dönen sonuç:", result);
        return result;
    };

    const getUserReservations = async (laundryId: number) => {
        try {
            const reservations = await fetchRPC("list_laundry_reservations", {
                filters: {
                    student_id: { $eq: 1000 }
                },
                list_options: { limit: 100, offset: 0 }
            });

            return reservations.data.map((res: any) => ({
                ...res,
                date: format(new Date(res.time), 'yyyy-MM-dd')
            }));
        } catch (error) {
            console.error("Kullanıcı rezervasyonları alınırken hata:", error);
            return [];
        }
    };

    const deleteReservation = async (reservationId: number) => {
        try {
            const result = await fetchRPC("delete_laundry_reservation", {
                id: reservationId
            });
            console.log("Rezervasyon iptalinden dönen sonuç:", result);
            return result;
        } catch (error) {
            console.error("Rezervasyon iptal edilirken hata:", error);
            throw error;
        }
    };

    return {
        loading,
        error,
        listBuildings,
        listLaundries,
        listMachines,
        createReservation,
        getUserReservations,
        deleteReservation
    };
};