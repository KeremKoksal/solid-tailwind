
import { createSignal } from 'solid-js';
import RadioGroup from '~/components/RadioGroup';
import Toggle from '~/components/Toggle';
import RadioGroup_2 from '~/components/RadioGroup_2';
import RadioGroup_3 from '~/components/RadioGroup_3';
import RadioGroup_4 from '~/components/RadioGroup_4';

export default function Home() {
  const [inlineNotif, setInlineNotif] = createSignal(false);
  const [inlineRoom, setInlineRoom] = createSignal(false);

  const handleSelectionChange = (value: string) => {
    console.log("Seçilen:", value);
  };

  return (
    <main class="p-8 space-y-8">
      <section>
        <div class="mb-4 flex items-center space-x-2">
          <button
            class="p-1 rounded-full border border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={() => setInlineNotif(!inlineNotif())}
            aria-label="Görünüm Değiştir"
          >
            {inlineNotif() ? (
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor"
                class="w-4 h-4 text-blue-600">
                <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor"
                class="w-4 h-4 text-blue-600">
                <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>

          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              How do you prefer to receive notifications?
            </p>
          </div>
        </div>

        <RadioGroup
          inline={inlineNotif()}
          initialValue="email"
          onChange={handleSelectionChange}
        />


      </section>

      <section>
        <div class="mb-4 flex items-center space-x-2">
          <button
            class="p-1 rounded-full border border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={() => setInlineRoom(!inlineRoom())}
            aria-label="Görünüm Değiştir"
          >
            {inlineRoom() ? (
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor"
                class="w-4 h-4 text-purple-600">
                <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                stroke-width="1.5" stroke="currentColor"
                class="w-4 h-4 text-blue-600">
                <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>

          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">List with description</p>

          </div>
        </div>

        <RadioGroup_2
          inline={inlineRoom()}
          initialValue="small"
          onChange={(val) => console.log("List with description seçimi:", val)}
        />
      </section>


      <section>
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Simple list with radio on the right</p>

        </div>

        <RadioGroup_3
          initialValue="none"
          onChange={(val) => console.log("Simple list with radio on the right seçimi:", val)}
        />
      </section>


      <section>
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Simple Table</p>

        </div>

        <RadioGroup_4
          initialValue="startup"
          onChange={(val) => console.log("Simple Table seçimi:", val)}
        />
      </section>




      <section>
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Toggles</h2>

        <div class="space-y-4 mt-4">
          <Toggle />
          <Toggle icon="✕" />
          <Toggle label="Available to hire" labelPosition="right" icon="✕" />
          <Toggle label="Annual billing (Save 10%)" labelPosition="left" />
        </div>
      </section>
    </main>

  );
}
