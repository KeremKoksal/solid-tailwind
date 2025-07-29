import { createSignal } from "solid-js";
import Combobox, { type ComboboxOption } from "~/components/Combobox";

const users: ComboboxOption[] = [
  { value: "1", label: "Leslie Alexander", secondaryText: "@lesliealexander" },
  { value: "2", label: "Michael Foster", secondaryText: "@michaelfoster" },
  { value: "3", label: "Dries Vincent", secondaryText: "@driesvincent" },
  { value: "4", label: "Lindsay Walton", secondaryText: "@lindsaywalton" },
  { value: "5", label: "Courtney Henry", secondaryText: "@courtneyhenry" },
  { value: "6", label: "Tom Cook", secondaryText: "@tomcook" },
  { value: "7", label: "Whitney Francis", secondaryText: "@whitneyfrancis" },
];

export default function ComboboxesPage() {
  const [selectedUser, setSelectedUser] = createSignal<string>();
  const [error, setError] = createSignal<string>();

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!selectedUser()) {
      setError("Please select a user");
      return;
    }
    setError(undefined);
    alert(`Selected user: ${users.find(u => u.value === selectedUser())?.label}`);
  };

  return (
    <div class="container mx-auto p-4 max-w-3xl">
      <title>Components - Combobox</title>
      <h1 class="text-2xl font-bold mb-6">Combobox Examples</h1>

      <div class="space-y-8">
        {/* Basic example with form */}
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-medium mb-4">Form Example with Secondary Text</h2>
          <form onSubmit={handleSubmit} class="space-y-4">
            <Combobox
              name="user"
              label="Assigned to"
              placeholder="Select a user"
              options={users}
              value={selectedUser()}
              onChange={setSelectedUser}
              error={error()}
              required
            />
            <div class="flex justify-end">
              <button
                type="submit"
                class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Assign
              </button>
            </div>
          </form>
        </div>

        {/* Read-only example */}
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-medium mb-4">Read-only Example</h2>
          <Combobox
            name="user-readonly"
            label="Current assignee"
            options={users}
            value="2"
            class="pointer-events-none opacity-75"
          />
        </div>
      </div>
    </div>
  );
} 