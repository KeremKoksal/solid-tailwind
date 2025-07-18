import { createSignal } from "solid-js";
export default function SelectMenus(props: { people: { name: string; username: string }[] }) {
 const [selected, setSelected] = createSignal<string | null>(null);

 return (
     <div class="w-72 mx-auto text-left dark:text-shadow-black-300">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
       Assigned to
      </label>
      <select
          class="block w-full pl-3 pr-10 py-2 text-base dark:border-white dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md border border-solid border-gray-400"
          value={selected() ?? ""}
          onInput={(e) => {
           const val = e.currentTarget.value;
           setSelected(val !== "" ? val : null);
          }}
      >
       <option value="" disabled selected>
        Choose...
       </option>
       {props.people.map((person) => (
           <option value={person.username}>
            {person.name} @{person.username}
           </option>
       ))}
      </select>
     </div>
 );
}
