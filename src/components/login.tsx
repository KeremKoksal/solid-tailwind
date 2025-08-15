import { createSignal } from "solid-js";
interface Props {
    onSuccess?: () => void;
}
export default function LoginForm(props: Props) {
    const [username, setUsername] = createSignal("");
    const [pwd, setPwd] = createSignal("");
    const [error, setError] = createSignal("");
    const handleLogin = async () => {
        try {
            const res = await fetch("https://dema.cc.metu.edu.tr/api/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username(),
                    pwd: pwd()
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem("auth-token", data.token);
                }
                props.onSuccess?.();
            } else {
                const data = await res.json();
                setError(data.message || "Giriş başarısız");
            }
        } catch {
            setError("Sunucuya ulaşılamıyor");
        }
    };
    return (
        <form class="space-y-5">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
                <input
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kullanıcı Adı"
                    value={username()}
                    onInput={(e) => setUsername(e.currentTarget.value)}
                />
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Şifre</label>
                <input
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Şifre"
                    value={pwd()}
                    onInput={(e) => setPwd(e.currentTarget.value)}
                />
            </div>
            <button
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                onClick={handleLogin}
                type="button"
            >
                Giriş Yap
            </button>
            {error() && (
                <p class="text-sm text-red-600 text-center mt-2">{error()}</p>
            )}
        </form>
    );
}