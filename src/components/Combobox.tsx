import { createSignal, For, Show } from "solid-js";

export interface ComboboxOption {
  value: string;
  label: string;
  secondaryText?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  class?: string;
}

export default function Combobox(props: ComboboxProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal("");
  const [selected, setSelected] = createSignal<ComboboxOption | null>(
    props.value ? props.options.find(opt => opt.value === props.value) || null : null
  );

  const filtered = () => {
    const term = searchTerm().toLowerCase();
    return term === "" ? props.options : props.options.filter(opt => 
      opt.label.toLowerCase().includes(term) ||
      opt.secondaryText?.toLowerCase().includes(term)
    );
  };

  const handleSelect = (option: ComboboxOption) => {
    setSelected(option);
    setSearchTerm("");
    setIsOpen(false);
    props.onChange?.(option.value);
  };

  const handleInputChange = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value;
    setSearchTerm(value);
    setIsOpen(true);
    if (value === "") {
      setSelected(null);
      props.onChange?.("");
    }
  };

  return (
    <div class={`relative ${props.class || ''}`}>
      {/* Label */}
      <Show when={props.label}>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
          {props.required && <span class="text-red-500 ml-1">*</span>}
        </label>
      </Show>

      {/* Input Container */}
      <div class="relative">
        <input
          type="text"
          name={props.name}
          class={`w-full rounded-md border ${props.error ? 'border-red-300' : 'border-gray-300'} 
            bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none 
            focus:ring-1 focus:ring-indigo-500 sm:text-sm text-gray-900`}
          placeholder={props.placeholder}
          value={searchTerm() || (selected() ? selected()?.label : "")}
          onFocus={() => setIsOpen(true)}
          onInput={handleInputChange}
          onClick={() => setIsOpen(true)}
        />

        {/* Dropdown Toggle Button */}
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center px-2"
          onClick={() => setIsOpen(!isOpen())}
        >
          <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
          </svg>
        </button>

        {/* Secondary Text for Selected Value */}
        <Show when={selected() && !searchTerm() && selected()?.secondaryText}>
          {/* If secondary text should shown, change color from white */}
          <span class="absolute inset-y-0 right-8 flex items-center pr-2 text-white text-sm">
            {selected()?.secondaryText}
          </span>
        </Show>
      </div>

      {/* Dropdown */}
      <Show when={isOpen()}>
        <div class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <For each={filtered()}>
            {(option) => (
              <div
                class="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-600 group"
                onClick={() => handleSelect(option)}
              >
                <div class="flex items-center">
                  <span class={`font-normal block truncate ${selected()?.value === option.value ? 'text-indigo-600' : 'text-gray-900'} group-hover:text-white`}>
                    {option.label}
                  </span>
                  <Show when={option.secondaryText}>
                    <span class="ml-2 truncate text-gray-500 group-hover:text-indigo-200">
                      {option.secondaryText}
                    </span>
                  </Show>
                </div>
                <Show when={selected()?.value === option.value}>
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-hover:text-white">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Error */}
      <Show when={props.error}>
        <p class="mt-2 text-sm text-red-600">{props.error}</p>
      </Show>
    </div>
  );
} 