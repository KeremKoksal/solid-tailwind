import { createSignal, JSX } from 'solid-js';

interface Option {
  value: string;
  title: string;
  price: string;
  detail: string;
}

interface RadioGroup4Props {
  initialValue?: string;
  onChange?: (value: string) => void;
}

const RadioGroup_4 = (props: RadioGroup4Props): JSX.Element => {
  const options: Option[] = [
    {
      value: 'startup',
      title: 'Startup',
      price: '$29 / mo ($290 / yr)',
      detail: 'Up to 5 active job postings',
    },
    {
      value: 'business',
      title: 'Business',
      price: '$99 / mo ($990 / yr)',
      detail: 'Up to 25 active job postings',
    },
    {
      value: 'enterprise',
      title: 'Enterprise',
      price: '$249 / mo ($2490 / yr)',
      detail: 'Unlimited active job postings',
    },
  ];

  const [selected, setSelected] = createSignal(props.initialValue || 'startup');

  const handleChange = (value: string) => {
    setSelected(value);
    props.onChange?.(value);
  };

  return (
    <fieldset class="max-w-xxl w-full rounded-md border p-4 space-y-2">
  

  {options.map((option) => {
    const isSelected = selected() === option.value;

    return (
      <label
        for={option.value}
        class={`relative grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 border rounded-md p-4 cursor-pointer transition
          ${isSelected ? 'bg-indigo-50 border-indigo-600' : 'border-gray-300 dark:border-gray-600'}
        `}
      >
        <input
          id={option.value}
          type="radio"
          name="package"
          value={option.value}
          checked={isSelected}
          onChange={() => handleChange(option.value)}
          class="absolute top-0 left-0 opacity-0 w-0 h-0"
        />

        <div
          class={`h-5 w-5 rounded-full border-2 flex items-center justify-center
            ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-250 border-gray-400'}
          `}
        >
          {isSelected && <div class="h-2 w-2 rounded-full bg-white" />}
        </div>

        <span class="text-sm font-medium text-gray-900 dark:text-white">{option.title}</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">{option.price}</span>
        <span class="text-sm text-gray-400 dark:text-gray-500">{option.detail}</span>
      </label>
    );
  })}
</fieldset>

  );
};

export default RadioGroup_4;
