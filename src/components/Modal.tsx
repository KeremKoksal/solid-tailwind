import { JSX, Show } from "solid-js";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: JSX.Element;
};

export default function Modal(props: ModalProps) {
    return (
        <Show when={props.open}>
            <div
                class="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/20 backdrop-blur-sm"
                style="position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
                <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative z-[10000]">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold">{props.title}</h2>
                        <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                    </div>
                    {props.children}
                </div>
            </div>
        </Show>
    );
}