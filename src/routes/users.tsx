import { createSignal, createMemo, For, Show } from "solid-js";
import Heading from "~/components/Headings";
import Pagination from "~/components/Pagination";
import Combobox from "~/components/Combobox";
import Modal from "~/components/Modal";
import { Edit } from 'lucide-solid';

interface User {
    name: string;
    username: string;
    email: string;
    picture: string;
    active: boolean;
}

export default function UserManagement() {
    const [users, setUsers] = createSignal<User[]>([
        { name: "John Doe", username: "john_doe", email: "john@example.com", picture: "https://randomuser.me/api/portraits/men/1.jpg", active: true },
        { name: "Jane Smith", username: "jane_smith", email: "jane@example.com", picture: "https://randomuser.me/api/portraits/women/1.jpg", active: false },
        { name: "Bob Wilson", username: "bob_wilson", email: "bob@example.com", picture: "https://randomuser.me/api/portraits/men/2.jpg", active: true },
        { name: "Alice Brown", username: "alice_brown", email: "alice@example.com", picture: "https://randomuser.me/api/portraits/women/2.jpg", active: true },
        { name: "Charlie Davis", username: "charlie_davis", email: "charlie@example.com", picture: "https://randomuser.me/api/portraits/men/3.jpg", active: false },
        { name: "David Miller", username: "david_miller", email: "david@example.com", picture: "https://randomuser.me/api/portraits/men/4.jpg", active: true },
        { name: "Emma Taylor", username: "emma_taylor", email: "emma@example.com", picture: "https://randomuser.me/api/portraits/women/3.jpg", active: false },
        { name: "Frank Johnson", username: "frank_johnson", email: "frank@example.com", picture: "https://randomuser.me/api/portraits/men/5.jpg", active: true },
        { name: "Odd Hjelvik", username: "orangeladybug496", email: "odd.hjelvik@example.com", picture: "https://randomuser.me/api/portraits/men/89.jpg", active: true },
    ]);

    const [selectedUsername, setSelectedUsername] = createSignal("");
    const [isModalOpen, setModalOpen] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<"create" | "update">("create");
    const [editingUser, setEditingUser] = createSignal<User | null>(null);
    const [currentPage, setCurrentPage] = createSignal(1);
    const resultsPerPage = 2;

    const filteredUsers = createMemo(() => {
        const all = users();
        if (!selectedUsername()) return all;
        return all.filter((u) => u.username === selectedUsername());
    });

    const paginatedUsers = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return filteredUsers().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() =>
        Math.ceil(filteredUsers().length / resultsPerPage)
    );

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setModalMode("update");
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setModalMode("create");
        setModalOpen(true);
    };

    const handleSave = (e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newUser: User = {
            name: formData.get("name") as string,
            username: formData.get("username") as string,
            email: formData.get("email") as string,
            picture:
                editingUser()?.picture ||
                "https://randomuser.me/api/portraits/lego/1.jpg",
            active: formData.get("active") === "on",
        };

        if (modalMode() === "create") {
            setUsers([...users(), newUser]);
        } else {
            setUsers(
                users().map((u) =>
                    u.username === editingUser()?.username ? newUser : u
                )
            );
        }

        setModalOpen(false);
    };

    return (
        <main class="p-6">
            <Heading
                title="Kullanıcı Yönetimi"
                description="Kullanıcı adına göre filtreleyin, yeni kullanıcı ekleyin ya da güncelleyin."
            >
                <Combobox
                    name="user-filter"
                    placeholder="Kullanıcı seçin"
                    options={[{ value: "", label: "Tümü" }, ...users().map((u) => ({
                        value: u.username,
                        label: u.username,
                    }))]}
                    value={selectedUsername()}
                    onChange={(val) => setSelectedUsername(val)}
                />

                <button
                    class="bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700"
                    onClick={handleCreate}
                >
                    Yeni Kullanıcı
                </button>
            </Heading>

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
                    <For each={paginatedUsers()}>
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
                                <td class="px-3 py-4 text-sm text-gray-500">{user.username}</td>
                                <td class="px-3 py-4 text-sm text-gray-500">{user.email}</td>
                                <td class="px-3 py-4 text-sm">
                                    {user.active ? (
                                        <span class="text-green-600 font-medium">✓ Aktif</span>
                                    ) : (
                                        <span class="text-gray-500">✗ Pasif</span>
                                    )}
                                </td>
                                <td class="px-3 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        class="text-indigo-600 hover:text-indigo-900"
                                        title="Edit user"
                                    >
                                        <Edit class="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        )}
                    </For>
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage()}
                totalPages={totalPages()}
                totalResults={filteredUsers().length}
                onPageChange={setCurrentPage}
                resultsPerPage={resultsPerPage}
            />

            <Modal
                open={isModalOpen()}
                onClose={() => setModalOpen(false)}
                title={modalMode() === "create" ? "Yeni Kullanıcı" : "Kullanıcıyı Güncelle"}
            >
                <form onSubmit={handleSave} class="flex flex-col gap-3">
                    <input
                        type="text"
                        name="name"
                        placeholder="Ad Soyad"
                        class="border px-3 py-2 rounded"
                        required
                        value={editingUser()?.name || ""}
                    />
                    <input
                        type="text"
                        name="username"
                        placeholder="Kullanıcı Adı"
                        class="border px-3 py-2 rounded"
                        required
                        value={editingUser()?.username || ""}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        class="border px-3 py-2 rounded"
                        required
                        value={editingUser()?.email || ""}
                    />
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="active" checked={editingUser()?.active} /> Aktif mi?
                    </label>
                    <button
                        type="submit"
                        class="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
                    >
                        Kaydet
                    </button>
                </form>
            </Modal>
        </main>
    );
}