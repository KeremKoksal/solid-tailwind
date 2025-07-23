import { createResource, createSignal, createMemo, For, Show } from "solid-js";
import { A } from "@solidjs/router";

import Counter from "~/components/Counter";
import BadgeExample from "~/components/Badge";
import Textareas from "~/components/Textareas";
import Heading from "~/components/headings";
import Modal from "~/components/Modal";
import Pagination from "~/components/pagination";

const fetchUsers = async () => {
    const res = await fetch("https://randomuser.me/api/?results=40");
    const data = await res.json();
    return data.results;
};

export default function Home() {
    const [users] = createResource(fetchUsers);

    const [filterGender, setFilterGender] = createSignal("");
    const [sortField, setSortField] = createSignal<"name" | "age">("name");
    const [isModalOpen, setModalOpen] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<"create" | "update">("create");
    const [currentPage, setCurrentPage] = createSignal(1);
    const resultsPerPage = 9;

    const filteredSorted = createMemo(() => {
        let list = users() || [];
        if (filterGender() !== "") {
            list = list.filter((u) => u.gender === filterGender());
        }
        list = [...list].sort((a, b) => {
            if (sortField() === "name") {
                return a.name.first.localeCompare(b.name.first);
            } else {
                return a.dob.age - b.dob.age;
            }
        });
        return list;
    });

    const paginatedUsers = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return filteredSorted().slice(start, start + resultsPerPage);
    });

    const totalPages = createMemo(() =>
        Math.ceil(filteredSorted().length / resultsPerPage)
    );

    return (
        <main class="text-center mx-auto text-gray-700 p-4">
            <h1 class="max-w-6xl text-6xl text-sky-700 font-thin uppercase my-16">
                Hello world!
            </h1>

            <Counter />

            <p class="mt-8">
                Visit{" "}
                <a
                    href="https://solidjs.com"
                    target="_blank"
                    class="text-sky-600 hover:underline"
                >
                    solidjs.com
                </a>{" "}
                to learn how to build Solid apps.
            </p>

            <p class="my-4">
                <span>Home</span> -{" "}
                <A href="/about" class="text-sky-600 hover:underline">
                    About Page
                </A>
            </p>

            <hr class="my-12 border-gray-300 dark:border-gray-700 w-full max-w-2xl mx-auto" />

            <div class="px-4 py-6 flex justify-center">
                <BadgeExample />
            </div>

            <hr class="my-12 border-gray-300 dark:border-gray-700 w-full max-w-2xl mx-auto" />

            <div class="px-4 py-6 flex justify-center max-w-2xl mx-auto">
                <Textareas
                    id="ariza-takip-metin-alani"
                    title="Arıza Takip Notları"
                    placeholder="Arızanın detaylarını..."
                    rows={6}
                    initialValue="Müşteri şikayeti: "
                    required
                    onTextChange={(v) => console.log("Metin:", v)}
                    pillAction={{
                        label: "Kaydı Tamamla",
                        onClick: (v) => alert("Gönderildi: " + v),
                        disabled: false
                    }}
                />
            </div>

            <Heading title="Kullanıcılar" description="Filtrele, sırala veya kullanıcı ekle">
               
                <select
                    value={filterGender()}
                    onInput={(e) => setFilterGender(e.currentTarget.value)}
                    class="border rounded px-2 py-1 text-sm"
                >
                    <option value="">Filtrele</option>
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                </select>

                <select
                    value={sortField()}
                    onInput={(e) => setSortField(e.currentTarget.value as "name" | "age")}
                    class="border rounded px-2 py-1 text-sm"
                >
                    <option value="name">İsme Göre</option>
                    <option value="age">Yaşa Göre</option>
                </select>

                <button
                    class="bg-white border px-3 py-1 rounded hover:bg-gray-50"
                    onClick={() => {
                        setModalMode("update");
                        setModalOpen(true);
                    }}
                >
                    Güncelle
                </button>

                <button
                    class="bg-sky-600 text-white px-3 py-1 rounded hover:bg-sky-700"
                    onClick={() => {
                        setModalMode("create");
                        setModalOpen(true);
                    }}
                >
                    Yeni Kullanıcı
                </button>
            </Heading>

            <Show when={users()} fallback={<p>Yükleniyor...</p>}>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <For each={paginatedUsers()}>
                        {(user) => (
                            <div class="border rounded-md p-4 text-left">
                                <img
                                    src={user.picture.large}
                                    alt="avatar"
                                    class="rounded-full w-24 h-24 mx-auto mb-2"
                                />
                                <p class="font-semibold">
                                    {user.name.first} {user.name.last}
                                </p>
                                <p class="text-sm text-gray-500">
                                    {user.gender}, Age: {user.dob.age}
                                </p>
                                <p class="text-sm">{user.email}</p>
                            </div>
                        )}
                    </For>
                </div>

                <Pagination
                    currentPage={currentPage()}
                    totalPages={totalPages()}
                    totalResults={filteredSorted().length}
                    onPageChange={setCurrentPage}
                    resultsPerPage={resultsPerPage}
                />
            </Show>

            <Modal
                open={isModalOpen()}
                onClose={() => setModalOpen(false)}
                title={
                    modalMode() === "create" ? "Yeni Kullanıcı Ekle" : "Kullanıcı Güncelle"
                }
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        alert("Saved!");
                        setModalOpen(false);
                    }}
                    class="flex flex-col gap-3"
                >
                    <input
                        type="text"
                        placeholder="First name"
                        class="border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        class="border px-3 py-2 rounded"
                        required
                    />
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" /> Aktif mi?
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
