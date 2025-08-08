import { For } from "solid-js";

interface Building {
    id: number;
    name: string;
    gender: boolean | null;
    private: boolean;
}

interface BuildingTableProps {
    buildings: Building[];
    selectedBuildingId?: number | null;
    onEdit: (building: Building) => void;
    onDelete: (buildingId: number) => void;
    onRowClick?: (building: Building) => void;
}

export default function BuildingTable(props: BuildingTableProps) {
    return (
        <div class="overflow-x-auto relative shadow-md sm:rounded-lg mt-4">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" class="py-3 px-6">
                        Building Name
                    </th>
                    <th scope="col" class="py-3 px-6">
                        Gender
                    </th>
                    <th scope="col" class="py-3 px-6">
                        Type
                    </th>
                    <th scope="col" class="py-3 px-6">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody>
                <For each={props.buildings}>
                    {(building) => (
                        <tr
                            class={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 ${
                                props.selectedBuildingId === building.id
                                    ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500'
                                    : 'bg-white dark:bg-gray-800'
                            }`}
                        >
                            <td class={`py-4 px-6 font-medium whitespace-nowrap ${
                                props.selectedBuildingId === building.id
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-gray-900 dark:text-white'
                            }`}>
                                <span
                                    class="cursor-pointer hover:underline text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 px-2 py-1 rounded transition-colors duration-200"
                                    onClick={() => props.onRowClick?.(building)}
                                >
                                    {building.name}
                                </span>
                            </td>
                            <td class="py-4 px-6">
                                {building.gender === true
                                    ? "Erkek"
                                    : building.gender === false
                                        ? "Kız"
                                        : "Karma"}
                            </td>
                            <td class="py-4 px-6">
                                {building.private ? "Konuk evi" : "Devlet"}
                            </td>
                            <td class="py-4 px-6">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.onEdit(building);
                                    }}
                                    class="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3"
                                >
                                    Düzenle
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.onDelete(building.id);
                                    }}
                                    class="font-medium text-red-600 dark:text-red-500 hover:underline"
                                >
                                    Sil
                                </a>
                            </td>
                        </tr>
                    )}
                </For>
                </tbody>
            </table>
        </div>
    );
}