import { createSignal, JSX } from 'solid-js';

interface Option {
  value: string;
  label: string;
  description: string;
}

interface RadioGroup_2Props {
  inline?: boolean;
  onChange?: (value: string) => void;
  initialValue?: string;
}

const RadioGroup_2 = (props: RadioGroup_2Props): JSX.Element => {
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
    <fieldset class="rounded-md border p-4">
      <div class={props.inline ? 'flex gap-6' : 'space-y-4'}>
        {options.map((option) => {
          const isSelected = selectedValue() === option.value;
          return (
            <label
              class="flex items-start gap-3 cursor-pointer"
              for={option.value}
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

             <div class={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center
  ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}
`}>
  {isSelected && (
    <div class="h-2 w-2 rounded-full bg-white" />
  )}
</div>


              <div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{option.label}</span>
                <p class="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default RadioGroup_2;
