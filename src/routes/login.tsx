// src/routes/Login.tsx
import LoginForm from "../components/login";

export default function Login() {
    const handleSuccess = () => {
        location.href = "/building";
    };

    return (
        <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
                <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Giriş Yap</h1>
                <LoginForm onSuccess={handleSuccess} />
            </div>
        </div>
    );
}
