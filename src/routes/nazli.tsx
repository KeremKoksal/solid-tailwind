import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";

export default function NazliLoginPage() {
    const [username, setUsername] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [error, setError] = createSignal("");
    const [loading, setLoading] = createSignal(false);
    const navigate = useNavigate();

    const handleLogin = async (e: Event) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("https://dema.cc.metu.edu.tr/api/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username(),
                    pwd: password(),
                }),
            });

            if (response.ok) {
                navigate("/buildingNazli");
            } else {
                setError("Kullanıcı adı veya şifre hatalı");
            }
        } catch (err) {
            setError("Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="min-h-screen flex items-center justify-center bg-gray-100">
            <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 class="text-2xl font-bold text-center mb-6">Giriş Yap</h2>

                <form onSubmit={handleLogin} class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={username()}
                            onInput={(e) => setUsername(e.currentTarget.value)}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading()}
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            value={password()}
                            onInput={(e) => setPassword(e.currentTarget.value)}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={loading()}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading()}
                        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {loading() ? "Giriş yapılıyor..." : "Giriş Yap"}
                    </button>

                    {error() && (
                        <p class="text-red-500 text-sm text-center mt-2">
                            {error()}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
