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
                    pwd: pwd(),
                }),
            });

            if (res.ok) {
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
        <div class="space-y-4 sm:space-y-6">
            <input
                class="w-full border border-gray-300 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Kullanıcı Adı"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
            />
            <input
                type="password"
                class="w-full border border-gray-300 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Şifre"
                value={pwd()}
                onInput={(e) => setPwd(e.currentTarget.value)}
            />
            <button
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-sm sm:text-base font-medium transition-colors"
                onClick={handleLogin}
            >
                Giriş Yap
            </button>
            {error() && (
                <p class="text-red-600 text-sm sm:text-base text-center mt-2">
                    {error()}
                </p>
            )}
        </div>
    );
}