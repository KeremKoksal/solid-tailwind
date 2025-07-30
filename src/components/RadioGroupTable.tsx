
import {createSignal, JSX} from 'solid-js';

interface Option {
  value: string;
  label: string;
  description: string;
}

interface RadioGroupTableProps {
  inline?: boolean;
  onChange?: (value: string) => void;
  initialValue?: string;
  hasDivider?: boolean;
  buttonsRight?: boolean;
  boxed?: boolean;
  selectedHighlight?: boolean;
}

const RadioGroupTable = (props: RadioGroupTableProps): JSX.Element => {
  const options: Option[] = [
    {
      value: 'small',
      label: 'Small',
      description: '4 GB RAM / 2 CPUS / 80 GB SSD Storage',
    },
    {
      value: 'medium',
      label: 'Medium',
      description: '8 GB RAM / 4 CPUS / 160 GB SSD Storage',
    },
    {
      value: 'large',
      label: 'Large',
      description: '16 GB RAM / 8 CPUS / 320 GB SSD Storage',
    },
  ];

  const [selectedValue, setSelectedValue] = createSignal(props.initialValue || 'small');

  const handleChange = (value: string) => {
    setSelectedValue(value);
    props.onChange?.(value);
  };

  return (
      <fieldset class="rounded-md border p-4 bg-gray-250 dark:bg-gray-900">
        <div class={props.inline ? 'flex gap-6' : 'space-y-0'}>
          {options.map((option, index) => {
            const isSelected = selectedValue() === option.value;

            const borderClass =
                props.hasDivider && index !== 0 && !props.inline
                    ? 'border-t border-gray-300 dark:border-gray-700'
                    : '';

            const highlightClass =
                props.selectedHighlight && isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-700'
                    : props.boxed
                        ? 'bg-gray-250 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : '';

            const baseClass = props.boxed
                ? 'border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 my-2 transition'
                : 'px-4 py-2';

            return (
                <label
                    for={option.value}
                    class={`flex justify-between items-center w-full ${highlightClass} ${baseClass} ${borderClass}`}
                >
                  <input
                      id={option.value}
                      type="radio"
                      name="custom-radio"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => handleChange(option.value)}
                      class="hidden"
                  />

                  <div
                      class={`flex w-full items-start ${
                          props.buttonsRight ? 'justify-between' : 'gap-3'
                      }`}
                  >
                    {!props.buttonsRight && (
                        <div
                            class={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 self-center
                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}
                        >
                          {isSelected && <div class="h-2 w-2 rounded-full bg-white"/>}
                        </div>
                    )}

                    <div class="flex-1 text-left">
                  <span class="block text-sm font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                      <p class="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>

                    {props.buttonsRight && (
                        <div
                            class={`h-5 w-5 rounded-full border-2 flex items-center justify-center ml-4 shrink-0 self-center
                    ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}
                        >
                          {isSelected && <div class="h-2 w-2 rounded-full bg-white"/>}
                        </div>
                    )}
                  </div>
                </label>
            );
          })}
        </div>
      </fieldset>
  );
};

export default RadioGroupTable;
