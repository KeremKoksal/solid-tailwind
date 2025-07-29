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
            <div class="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
                <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-50">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold">{props.title}</h2>
                        <button onClick={props.onClose} class="text-gray-400 hover:text-gray-600">×</button>
                    </div>
                    {props.children}
                </div>
            </div>
        </Show>
    );
}
