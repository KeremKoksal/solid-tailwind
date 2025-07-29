import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, createSignal, Show } from "solid-js";

import Nav from "~/components/Nav";
import Textareas from "~/components/Textareas/Textareas";
import "./app.css";

export default function App() {
    const [showForm, setShowForm] = createSignal(false);

    const handleSubmit = (data: any) => {

        console.log('Arıza Kaydedildi:', data);
        setShowForm(false);
        // Burada API'ye gönderme işlemi yapılabilir
    };

    return (
        <Router
            root={(props) => (

                <>
                    <Nav />
                    <button
                        onClick={() => setShowForm(true)}
                        class="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
                    >
                        + Yeni Arıza Bildirimi
                    </button>

                    <Show when={showForm()}>
                        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div class="bg-white rounded-xl w-full max-w-3xl relative">
                                <Textareas onSubmit={handleSubmit} />
                                <button
                                    onClick={() => setShowForm(false)}
                                    class="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </Show>

                    <Suspense>{props.children}</Suspense>
                </>
            )}
        >
            <FileRoutes />
        </Router>
    );
}

