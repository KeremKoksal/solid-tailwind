import { createSignal, Show, onMount } from 'solid-js';

type ToggleProps = {
  icon?: string;
  label?: string;
  labelPosition?: 'left' | 'right';
  onToggle?: (enabled: boolean) => void;
  isThemeToggle?: boolean;
};

export default function Toggle(props: ToggleProps) {
  const [enabled, setEnabled] = createSignal(false);

  const hasLabel = !!props.label;
  const isLabelLeft = props.labelPosition === 'left';
  const hasIcon = !!props.icon;

  onMount(() => {
    if (props.isThemeToggle) {
      const isDark = document.documentElement.classList.contains('dark');
      setEnabled(isDark);
    }
  });

  const handleClick = () => {
    const newValue = !enabled();
    setEnabled(newValue);

    if (props.isThemeToggle) {
      const html = document.documentElement;

      if (newValue) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }

    props.onToggle?.(newValue);
  };

  return (
    <div class="flex items-center space-x-2">
      <Show when={hasLabel && isLabelLeft}>
        <span class="text-sm text-gray-900 dark:text-gray-100">{props.label}</span>
      </Show>

      <button
        type="button"
        role="switch"
        aria-checked={enabled()}
        onClick={handleClick}
        class={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none
          ${enabled()
            ? 'bg-indigo-600 dark:bg-indigo-500'
            : 'bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-500'}
        `}
      >
        <div
          class={`
            absolute left-0 top-0 h-5 w-5 m-0.5 flex items-center justify-center rounded-full
            bg-white dark:bg-gray-100 shadow ring-1 ring-inset
            transition-transform duration-200 ease-in-out
            ${enabled()
              ? 'translate-x-5 ring-indigo-600 dark:ring-indigo-400'
              : 'translate-x-0 ring-gray-300 dark:ring-gray-500'}
          `}
        >
          <Show when={hasIcon}>
            <span
              class={`text-[7px] font-bold ${
                enabled()
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-300 dark:text-gray-500'
              }`}
              style={{ transform: 'translateY(-1px)' }}
            >
              {enabled() ? '✔' : props.icon}
            </span>
          </Show>
        </div>
      </button>

      <Show when={hasLabel && !isLabelLeft}>
        <span class="text-sm text-gray-900 dark:text-gray-100">{props.label}</span>
      </Show>
    </div>
  );
}
