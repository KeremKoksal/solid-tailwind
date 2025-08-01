import { For } from 'solid-js';
import { Edit } from 'lucide-solid';

interface User {
    name: string;
    username: string;
    email: string;
    picture: string;
    active: boolean;
}

interface TablesProps {
    users: User[];
    onEdit?: (user: User) => void;
}

export default function Tables(props: TablesProps) {
    const handleEdit = (user: User) => {
        if (props.onEdit) {
            props.onEdit(user);
        } else {
            console.log('Edit user:', user);
        }
    };

    return (
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table class="w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                <tr>
                    <th class="px-3 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th class="px-3 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
                    <th class="px-3 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th class="px-3 py-3 text-left text-sm font-semibold text-gray-900">Active</th>
                    <th class="px-3 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                <For each={props.users}>
                    {(user) => (
                        <tr>
                            <td class="px-3 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10">
                                        <img
                                            class="h-10 w-10 rounded-full"
                                            src={user.picture}
                                            alt={`${user.name}'s photo`}
                                        />
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">{user.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.username}
                            </td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                            </td>
                            <td class="px-3 py-4 whitespace-nowrap text-sm">
                                {user.active ? (
                                    <span class="text-green-600 font-medium">✓ Aktif</span>
                                ) : (
                                    <span class="text-gray-500">✗ Pasif</span>
                                )}
                            </td>
                            <td class="px-3 py-4 whitespace-nowrap text-right text-sm">
                                <div class="flex justify-end items-center h-full">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        class="text-indigo-600 hover:text-indigo-900"
                                        title="Edit user"
                                    >
                                        <Edit class="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                </For>
                </tbody>
            </table>
        </div>
    );
}