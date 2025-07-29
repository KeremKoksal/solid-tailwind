import { JSX, Show, For, splitProps, createMemo } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leadingIcon?: () => JSX.Element;
  trailingIcon?: () => JSX.Element;
  leadingText?: string;
  trailingText?: string;
  leadingDropdown?: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  };
}

export default function Input(props: InputProps) {
  const [local, inputProps] = splitProps(props, [
    'label',
    'error',
    'leadingIcon',
    'trailingIcon',
    'leadingText',
    'trailingText',
    'leadingDropdown',
    'class'
  ]);

  const hasLeadingElement = createMemo(() => 
    !!(local.leadingIcon || local.leadingText)
  );

  const hasTrailingElement = createMemo(() => 
    !!(local.trailingIcon || local.trailingText)
  );

  return (
    <div class="relative pt-2">
      {/* Input Container */}
      <div class="relative">
        {/* Overlapping Label */}
        <label
          class={`absolute -top-6 inline-block px-1 text-xs text-white font-medium z-10
          ${local.error ? 'text-red-600' : 'text-gray-700'}`}
        >
          {local.label}
        </label>

        <div class="relative flex rounded-md shadow-sm">
          {/* Leading Dropdown */}
          <Show when={local.leadingDropdown}>
            <div class="flex">
              <select
                class="rounded-l-md border-0 bg-gray-50 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 
                       focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                value={local.leadingDropdown?.value}
                onChange={(e) => local.leadingDropdown?.onChange(e.currentTarget.value)}
              >
                <For each={local.leadingDropdown?.options || []}>
                  {(option) => (
                    <option value={option.value} class="bg-white text-gray-900">
                      {option.label}
                    </option>
                  )}
                </For>
              </select>
            </div>
          </Show>

          {/* Leading Text or Icon */}
          <Show when={local.leadingIcon || local.leadingText}>
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {local.leadingIcon?.() || <span class="text-gray-700 sm:text-sm">{local.leadingText}</span>}
            </div>
          </Show>

          {/* Input Element */}
          <input
            {...inputProps}
            class={`flex-1 rounded-md ${local.leadingDropdown ? 'rounded-l-none' : ''} border-0 py-2 bg-white text-gray-900 shadow-sm ring-1 ring-inset 
              ${local.error ? 'ring-red-300' : 'ring-gray-300'} 
              placeholder:text-gray-500
              focus:ring-2 focus:ring-inset focus:ring-indigo-600 
              sm:text-sm sm:leading-6
              ${hasLeadingElement() ? 'pl-10' : 'pl-3'}
              ${hasTrailingElement() ? 'pr-10' : 'pr-3'}
              ${local.class || ''}`}
            style={{
              "background-color": "rgb(255, 255, 255)",
              "color": "rgb(17, 24, 39)"
            }}
          />

          {/* Trailing Text or Icon */}
          <Show when={local.trailingIcon || local.trailingText}>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {local.trailingIcon?.() || <span class="text-gray-700 sm:text-sm">{local.trailingText}</span>}
            </div>
          </Show>
        </div>
      </div>

      {/* Error Message */}
      <Show when={local.error}>
        <p class="mt-2 text-sm text-red-600">{local.error}</p>
      </Show>
    </div>
  );
} 