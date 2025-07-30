import {createSignal, JSX} from 'solid-js';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  inline?: boolean;
}

const RadioGroup = (props: RadioGroupProps): JSX.Element => {
  const [selectedValue, setSelectedValue] = createSignal(props.initialValue || 'email');

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    setSelectedValue(target.value);
    if (props.onChange) {
      props.onChange(target.value);
    }
  };

  const options: RadioOption[] = [
    {value: 'email', label: 'Email'},
    {value: 'phone', label: 'Phone (SMS)'},
    {value: 'push', label: 'Push notification'},
  ];

  return (
      <div class={props.inline ? 'mt-4 flex space-x-6' : 'mt-4 space-y-4'}>
        {options.map((option) => (
            <label for={option.value} class="flex items-center space-x-3 cursor-pointer">
              <input
                  id={option.value}
                  name="notification-method"
                  type="radio"
                  value={option.value}
                  checked={selectedValue() === option.value}
                  onChange={handleChange}
                  class="sr-only peer"
              />
              <div
                  class={`h-5 w-5 rounded-full border-2 flex items-center justify-center
    transition duration-200
    ${selectedValue() === option.value
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-400 bg-gray-250 dark:border-gray-600'}
  `}
              >
                {selectedValue() === option.value && (
                    <div class="h-2 w-2 rounded-full bg-white"/>
                )}
              </div>

              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {option.label}
          </span>
            </label>
        ))}
      </div>
  );
};

export default RadioGroup;
