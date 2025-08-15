import LoginForm from "../components/LoginForm";

export default function Login() {
    const handleSuccess = () => {
        location.href = "/building_isil";
    };

    return (
        <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
            <div class="w-full max-w-sm sm:max-w-md space-y-8">
                <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
                    <div class="text-center">
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            Giriş Yap
                        </h1>
                        <p class="text-sm text-gray-600 mb-6">
                            Hesabınıza giriş yapın
                        </p>
                    </div>
                    <LoginForm onSuccess={handleSuccess} />
                </div>
            </div>
        </div>
    );
}