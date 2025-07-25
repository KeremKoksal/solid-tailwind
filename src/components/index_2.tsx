import { createSignal } from 'solid-js';
import ListWithDescription from '~/components/RadioGroup_2'; 
import RadioGroup_3 from '~/components/RadioGroup_3'; 
import RadioGroup_4 from '~/components/RadioGroup_4'; 

export default function Home() {
  const [isInline, setIsInline] = createSignal(false);

  const handleChange = (value: string) => {
    console.log('Oda seçimi:', value);
  };

  const handleFoodChange = (value: string) => {
    console.log('Yemek tercihi:', value);
  };

  const handlePackageChange = (value: string) => {
    console.log('Paket tercihi:', value);
  };

  return (
    <main class="p-6 space-y-6">
      
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setIsInline(!isInline())}
      >
        {isInline() ? 'Dikey Görünüm' : 'Yatay Görünüm'}
      </button>

      <ListWithDescription inline={isInline()} onChange={handleChange} />

      
      <section>
        <RadioGroup_3 initialValue="fries" onChange={handleFoodChange} />
      </section>

      
      <section>
        <RadioGroup_4 initialValue="startup" onChange={handlePackageChange} />
      </section>
    </main>
  );
}
