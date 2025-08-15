// src/routes/index.tsx
import { createResource, createSignal, createMemo, For, Show, onMount } from "solid-js";
import RadioGroup from '~/components/RadioGroup';
import Toggle from '~/components/Toggle';
import RadioGroupTable from '~/components/RadioGroupTable';
import { A, useNavigate } from "@solidjs/router";

import Counter from "~/components/Counter";
import BadgeExample from "~/components/Badge";
import TextAreas from "~/components/TextAreas";
import Heading from "~/components/Headings";
import Modal from "~/components/Modal";
import Pagination from "~/components/Pagination";
import Avatar from "~/components/Avatar";
import SelectMenus from "~/components/SelectMenus";

const BASE_URL = "http://dema.cc.metu.edu.tr/login";

async function sendRpcRequest<T>(method: string, params: any): Promise<T | null> {
    try {
        const response = await fetch(`${BASE_URL}/rpc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: Date.now(),
                method,
                params,
            }),
            credentials: 'include',
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`HTTP Hata Durumu (${method} - Index):`, response.status, "Yanıt Metni:", responseText);

            if (responseText.startsWith("<!DOCTYPE html>")) {
                throw new Error(`Sunucudan geçersiz yanıt (HTML). API endpoint'i veya proxy hatası olabilir. Durum: ${response.status}`);
            }

            let errorData: any;
            try {
                errorData = JSON.parse(responseText);
            } catch (parseErr: unknown) {
                const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
                throw new Error(`API'den gelen yanıt JSON formatında değil veya ayrıştırma hatası: ${message}. Yanıt: ${responseText.substring(0, Math.min(responseText.length, 100))}...`);
            }

            if (response.status === 403 || (errorData.error && errorData.error.message.includes("NO_AUTH"))) {
                throw new Error("Erişim reddedildi. Lütfen giriş yapın veya yetkinizi kontrol edin.");
            }
            throw new Error(errorData.error ? errorData.error.message : `HTTP hatası: ${response.status}`);
        }

        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (parseErr: unknown) {
            const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
            throw new Error(`API'den gelen başarılı yanıt JSON formatında değil veya ayrıştırma hatası: ${message}. Yanıt: ${responseText.substring(0, Math.min(responseText.length, 100))}...`);
        }

        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.result as T;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("RPC İsteği Yakalama Hatası (Index):", err);
        throw new Error(errorMessage);
    }
}

async function checkLoginStatus(): Promise<boolean> {
    try {
        const result = await sendRpcRequest<any[]>("list_buildings", { filters: {}, list_options: { limit: 1, offset: 0 } });
        if (result !== null) {
            console.log("Session is active on Index page.");
            return true;
        }
        console.log("Session not active or API returned null on Index page.");
        return false;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn("Ana sayfada oturum kontrol hatası:", errorMessage);
        if (errorMessage.includes("403") || errorMessage.includes("NO_AUTH") || errorMessage.includes("Erişim reddedildi") || errorMessage.includes("geçersiz yanıt (HTML)")) {
            return false;
        }
        return false;
    }
}

const fetchUsers = async () => {
    const res = await fetch("https://randomuser.me/api/?results=40");
    const data = await res.json();
    return data.results;
};

export default function Home() {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = createSignal(false);
    const [loadingAuth, setLoadingAuth] = createSignal(true);

    const [inlineNotif, setInlineNotif] = createSignal(false);

    const handleSelectionChange = (value: string) => {
        console.log("Seçilen:", value);
    };

    const [people, setPeople] = createSignal<any[]>([]);

    const currentUser = () => people()[0];
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

        setLoadingAuth(true);
        try {
            const loggedIn = await checkLoginStatus();
            setIsLoggedIn(loggedIn);

        } catch (err: unknown) { // err artık 'unknown' tipinde
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Anasayfa oturum kontrolü sırasında hata:", errorMessage);
            setIsLoggedIn(false);
        } finally {
            setLoadingAuth(false);
        }
    });

    const filteredSorted = createMemo(() => {
        let list = users() || [];
        if (filterGender() !== "") {
            list = list.filter((u: { gender: string; }) => u.gender === filterGender());
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
        <main class="p-8 space-y-8 text-center mx-auto text-gray-700 dark:text-gray-300">
            <Show when={loadingAuth()}>
                <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #f0f8ff;">
                    <p>Oturum kontrol ediliyor...</p>
                </div>
            </Show>

            <Show when={!loadingAuth()}>
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
                                          d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     fill="none" viewBox="0 0 24 24"
                                     stroke-width="1.5" stroke="currentColor"
                                     class="w-4 h-4 text-blue-600">
                                    <path stroke-linecap="round"
                                          stroke-linejoin="round"
                                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                                </svg>
                            )}
                        </button>

                        <div class="text-left flex flex-col">
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
                        <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Radio Table</p>
                        </div>
                    </div>

                    <RadioGroupTable
                        inline={true}
                        hasDivider={true}
                        buttonsRight={false}
                        boxed={false}
                        initialValue="small"
                        selectedHighlight={false}
                    />
                </section>

                <section>
                    <h2 class="text-left flex flex-col text-lg font-bold text-gray-900 dark:text-gray-100">Toggles</h2>
                    <div class="space-y-4 mt-4">
                        <Toggle/>
                        <Toggle icon="✕"/>
                        <Toggle label="Available to hire" labelPosition="right" icon="✕"/>
                        <Toggle label="Annual billing (Save 10%)" labelPosition="left"/>
                    </div>
                </section>

                <h1 class="max-w-6xl text-6xl text-sky-700 font-thin uppercase my-16">
                    Hello world!
                </h1>

                <Counter/>

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
                    {" "} - {" "}
                    <A href="/building" class="text-sky-600 hover:underline">
                        Building Page
                    </A>
                    {" "} - {" "}
                    <A href="/src/routes/laundry" class="text-sky-600 hover:underline">
                        Laundry Page
                    </A>
                    {" "} - {" "}
                    <A href="/login" class="text-sky-600 hover:underline">
                        Login Page
                    </A>
                </p>

                <hr class="my-12 border-gray-300 dark:border-gray-700 w-full max-w-2xl mx-auto"/>

                <div class="px-4 py-6 flex justify-center">
                    <BadgeExample/>
                </div>

                <hr class="my-12 border-gray-300 dark:border-gray-700 w-full max-w-2xl mx-auto"/>

                <div class="px-4 py-6 flex justify-center max-w-2xl mx-auto">
                    <TextAreas
                        id="ariza-takip-metin-alani"
                        title="Arıza Takip Notları"
                        placeholder="Arızanın detaylarını..."
                        rows={6}
                        initialValue="Müşteri şikayeti: "
                        required
                        onTextChange={(v: string) => console.log("Metin:", v)}
                        pillAction={{
                            label: "Kaydı Tamamla",
                            onClick: (v: string) => alert("Gönderildi: " + v),
                            disabled: false
                        }}
                    />
                </div>

                <Heading title="Kullanıcılar" description="Filtrele, sırala veya kullanıcı ekle">
                    <select
                        value={filterGender()}
                        onInput={(e) => setFilterGender(e.currentTarget.value)}
                        class="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    >
                        <option value="">Filtrele</option>
                        <option value="male">Erkek</option>
                        <option value="female">Kadın</option>
                    </select>

                    <select
                        value={sortField()}
                        onInput={(e) => setSortField(e.currentTarget.value as "name" | "age")}
                        class="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    >
                        <option value="name">İsme Göre</option>
                        <option value="age">Yaşa Göre</option>
                    </select>

                    <button
                        class="bg-white border px-3 py-1 rounded hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
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
                                <div class="border rounded-md p-4 text-left bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                    <img
                                        src={user.picture.large}
                                        alt="avatar"
                                        class="rounded-full w-24 h-24 mx-auto mb-2"
                                    />
                                    <p class="font-semibold">
                                        {user.name.first} {user.name.last}
                                    </p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
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
                            class="border px-3 py-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            class="border px-3 py-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                        />
                        <label class="flex items-center gap-2 text-sm">
                            <input type="checkbox" class="dark:accent-sky-600"/> Aktif mi?
                        </label>
                        <button
                            type="submit"
                            class="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
                        >
                            Kaydet
                        </button>
                    </form>
                </Modal>

                <Show when={currentUser()}>
                    <Avatar
                        isStudent={currentUser()?.isStudent}
                        picture={currentUser()?.picture}
                    />
                </Show>

                <SelectMenus people={people()}/>
            </Show>
        </main>
    );
}