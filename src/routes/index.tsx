import { createResource, createSignal, createMemo, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import Counter from "~/components/Counter";
import BadgeExample from "~/components/Badge";
import Textareas from "~/components/Textareas";
import Heading from "~/components/headings";
import Modal from "~/components/Modal";
import Pagination from "~/components/pagination";
import Avatar from "~/components/Avatar";
import SelectMenus from "~/components/SelectMenus";
import RadioGroup from '~/components/RadioGroup';
import Toggle from '~/components/Toggle';
import RadioGroup_2 from '~/components/RadioGroup_2';
import RadioGroup_3 from '~/components/RadioGroup_3';
import RadioGroup_4 from '~/components/RadioGroup_4';

const fetchUsers = async () => {
    const res = await fetch("https://randomuser.me/api/?results=40");
    const data = await res.json();
    return data.results;
};

export default function Home() {
    const [inlineNotif, setInlineNotif] = createSignal(false);
    const [inlineRoom, setInlineRoom] = createSignal(false);

    const handleSelectionChange = (value: string) => {
        console.log("Seçilen:", value);
    };

    const [people, setPeople] = createSignal<any[]>([]);
    const [users] = createResource(fetchUsers);
    const [filterGender, setFilterGender] = createSignal("");
    const [sortField, setSortField] = createSignal<"name" | "age">("name");
    const [isModalOpen, setModalOpen] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<"create" | "update">("create");
    const [currentPage, setCurrentPage] = createSignal(1);
    const resultsPerPage = 9;

    onMount(async () => {
        const res = await fetch("public/people.json");
        const data = await res.json();
        setPeople(data);
    });

    const currentUser = () => people()[0];

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

    const totalPages = createMemo(() =>
        Math.ceil(filteredSorted().length / resultsPerPage)
    );

    const paginatedUsers = createMemo(() => {
        const start = (currentPage() - 1) * resultsPerPage;
        return filteredSorted().slice(start, start + resultsPerPage);
    });

    return (
        <main class="p-8 space-y-8 text-center mx-auto text-gray-700">
            
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
          

           
            <Show when={currentUser()}>
                <Avatar
                    isStudent={currentUser()?.isStudent}
                    picture={currentUser()?.picture}
                />
            </Show>

            <SelectMenus people={people()} />

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

            <section>
                <div class="mb-4 flex items-center space-x-2">
                    <button
                        class="p-1 rounded-full border border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                        onClick={() => setInlineNotif(!inlineNotif())}
                        aria-label="Görünüm Değiştir"
                    >
                        {inlineNotif() ? (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 fill="none" viewBox="0 0 24 24"
                                 stroke-width="1.5" stroke="currentColor"
                                 class="w-4 h-4 text-blue-600">
                                <path stroke-linecap="round"
                                      stroke-linejoin="round"
                                      d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 fill="none" viewBox="0 0 24 24"
                                 stroke-width="1.5" stroke="currentColor"
                                 class="w-4 h-4 text-blue-600">
                                <path stroke-linecap="round"
                                      stroke-linejoin="round"
                                      d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </button>

                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            How do you prefer to receive notifications?
                        </p>
                    </div>
                </div>

                <RadioGroup
                    inline={inlineNotif()}
                    initialValue="email"
                    onChange={handleSelectionChange}
                />
            </section>

            <section>
                <div class="mb-4 flex items-center space-x-2">
                    <button
                        class="p-1 rounded-full border border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                        onClick={() => setInlineRoom(!inlineRoom())}
                        aria-label="Görünüm Değiştir"
                    >
                        {inlineRoom() ? (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 fill="none" viewBox="0 0 24 24"
                                 stroke-width="1.5" stroke="currentColor"
                                 class="w-4 h-4 text-purple-600">
                                <path stroke-linecap="round"
                                      stroke-linejoin="round"
                                      d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg"
                                 fill="none" viewBox="0 0 24 24"
                                 stroke-width="1.5" stroke="currentColor"
                                 class="w-4 h-4 text-blue-600">
                                <path stroke-linecap="round"
                                      stroke-linejoin="round"
                                      d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </button>

                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">List with description</p>
                    </div>
                </div>

                <RadioGroup_2
                    inline={inlineRoom()}
                    initialValue="small"
                    onChange={(val) => console.log("List with description seçimi:", val)}
                />
            </section>

            <section>
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Simple list with radio on the right</p>
                </div>
                <RadioGroup_3
                    initialValue="none"
                    onChange={(val) => console.log("Simple list with radio on the right seçimi:", val)}
                />
            </section>

            <section>
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Simple Table</p>
                </div>
                <RadioGroup_4
                    initialValue="startup"
                    onChange={(val) => console.log("Simple Table seçimi:", val)}
                />
            </section>

            <section>
                <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Toggles</h2>
                <div class="space-y-4 mt-4">
                    <Toggle />
                    <Toggle icon="✕" />
                    <Toggle label="Available to hire" labelPosition="right" icon="✕" />
                    <Toggle label="Annual billing (Save 10%)" labelPosition="left" />
                </div>
            </section>
        </main>
    );
}
