import { createSignal, createResource, createMemo, onMount } from "solid-js";
import Heading from "~/components/Headings";
import Pagination from "~/components/Pagination";
import Combobox from "~/components/Combobox";
import Modal from "~/components/Modal";
import Tables from "~/components/Tables";

interface User {
    name: string;
    username: string;
    email: string;
    picture: string;
    active: boolean;
}

const fetchUsers = async (): Promise<User[]> => {
    const res = await fetch("https://randomuser.me/api/?results=12&inc=name,login,email,picture");
    const data = await res.json();
    return data.results.map((u: any) => ({
        name: `${u.name.first} ${u.name.last}`,
        username: u.login.username,
        email: u.email,
        picture: u.picture.medium,
        active: Math.random() < 0.5,
    }));
};

export default function UsersPage() {

    const [initialUsers, initialUsersActions] = createResource(fetchUsers);


    const [users, setUsers] = createSignal<User[]>([]);


    onMount(() => {
        initialUsersActions.refetch();
    });


    createMemo(() => {
        if (initialUsers()) {
            setUsers(initialUsers() || []);
        }
    });

    const [selectedUsername, setSelectedUsername] = createSignal("");
    const [activeFilter, setActiveFilter] = createSignal<string>("all");
    const [sortNameDirection, setSortNameDirection] = createSignal<'asc' | 'desc' | null>(null);

    const [isModalOpen, setModalOpen] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<"create" | "update">("create");
    const [editingUser, setEditingUser] = createSignal<User | null>(null);
    const [currentPage, setCurrentPage] = createSignal(1);
    const resultsPerPage = 5;

    const filteredUsers = createMemo(() => {
        let currentUsers = [...users() || []];


        if (selectedUsername()) {
            currentUsers = currentUsers.filter((u) => u.username === selectedUsername());
        }


        if (activeFilter() === "active") {
            currentUsers = currentUsers.filter((u) => u.active);
        } else if (activeFilter() === "passive") {
            currentUsers = currentUsers.filter((u) => !u.active);
        }


        if (sortNameDirection() === 'asc') {
            currentUsers.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortNameDirection() === 'desc') {
            currentUsers.sort((a, b) => b.name.localeCompare(a.name));
        }

        return currentUsers;
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
            picture: editingUser()?.picture || "https://randomuser.me/api/portraits/lego/1.jpg",
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
        setSelectedUsername("");
        setCurrentPage(1);
    };

    return (
        <main class="p-6">
            <Heading
                title="Kullanıcı Yönetimi"
                description="Kullanıcı adına göre filtreleyin, yeni kullanıcı ekleyin ya da güncelleyin."
            >
                <Combobox
                    name="user-filter"
                    placeholder="Kullanıcı Seç"
                    options={[{ value: "", label: "Tüm Kullanıcılar" }, ...(users() || []).map((u) => ({
                        value: u.username,
                        label: u.username,
                    }))]}
                    value={selectedUsername()}
                    onChange={setSelectedUsername}
                />

                <button
                    class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                    onClick={() => {

                        if (sortNameDirection() === 'asc') {
                            setSortNameDirection('desc');
                        } else if (sortNameDirection() === 'desc') {
                            setSortNameDirection(null);
                        } else {
                            setSortNameDirection('asc');
                        }
                        setCurrentPage(1);
                    }}
                >
                    İsme Göre Sırala
                    {sortNameDirection() === 'asc' && <span class="text-white">↑</span>}
                    {sortNameDirection() === 'desc' && <span class="text-white">↓</span>}
                </button>


                <Combobox
                    name="active-passive-filter"
                    placeholder="Aktiflik Durumu"
                    options={[
                        { value: "all", label: "Tümü" },
                        { value: "active", label: "Aktif" },
                        { value: "passive", label: "Pasif" },
                    ]}
                    value={activeFilter()}
                    onChange={(value) => {
                        setActiveFilter(value);
                        setCurrentPage(1);
                    }}
                />

                <button
                    class="bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700"
                    onClick={handleCreate}
                >
                    Yeni Kullanıcı
                </button>
            </Heading>

            <Tables
                users={paginatedUsers()}
                onEdit={handleEdit}
            />

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
                    <input type="text" name="name" placeholder="Ad Soyad" required class="border px-3 py-2 rounded" value={editingUser()?.name || ""} />
                    <input type="text" name="username" placeholder="Kullanıcı Adı" required class="border px-3 py-2 rounded"
                           value={editingUser()?.username || ""}
                    />
                    <input type="email" name="email" placeholder="Email" required class="border px-3 py-2 rounded" value={editingUser()?.email || ""} />
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="active" checked={editingUser()?.active} /> Aktif mi?
                    </label>
                    <button type="submit" class="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700">Kaydet</button>
                </form>
            </Modal>
        </main>
    );
}