import { createSignal, JSX } from 'solid-js';

interface Option {
  value: string;
  label: string;
}

interface RadioGroup3Props {
  initialValue?: string;
  onChange?: (value: string) => void;
}

const RadioGroup_3 = (props: RadioGroup3Props): JSX.Element => {
  const options: Option[] = [
    { value: 'none', label: 'None' },
    { value: 'beans', label: 'Baked beans' },
    { value: 'coleslaw', label: 'Coleslaw' },
    { value: 'fries', label: 'French fries' },
    { value: 'salad', label: 'Garden salad' },
    { value: 'potatoes', label: 'Mashed potatoes' },
  ];

  const [selected, setSelected] = createSignal(props.initialValue || 'none');

  const handleChange = (value: string) => {
    setSelected(value);
    props.onChange?.(value);
  };

  return (
    <fieldset class="rounded-md border p-4 divide-y divide-gray-200 dark:divide-gray-600">
      

      {options.map((option) => {
        const isSelected = selected() === option.value;
        return (
          <label
            for={option.value}
            class="flex items-center justify-between py-3 cursor-pointer"
          >
            <span class="text-sm text-gray-900 dark:text-gray-100">{option.label}</span>

            <input
              type="radio"
              id={option.value}
              name="radio-right"
              value={option.value}
              checked={isSelected}
              onChange={() => handleChange(option.value)}
              class="hidden"
            />

            <div class={`h-5 w-5 rounded-full border-2 flex items-center justify-center 
              ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-250 border-gray-400'}
            `}>
              {isSelected && <div class="h-2 w-2 rounded-full bg-white" />}
            </div>
          </label>
        );
      })}
    </fieldset>
  );
};

export default RadioGroup_3;
