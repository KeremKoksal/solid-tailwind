// src/components/Modal.tsx
import { Component, JSX, Show } from 'solid-js';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: JSX.Element;
}

const Modal: Component<ModalProps> = (props) => {
    return (
        <Show when={props.isOpen}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">{props.title}</h3>
                        <button
                            class="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={props.onClose}
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {props.children}
                </div>
            </div>
        </Show>
    );
};

export default Modal;