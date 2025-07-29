import { createSignal } from "solid-js";
import Input from "~/components/Input";
import { EmailIcon, HelpIcon, ErrorIcon } from "~/components/icons";

export default function InputsPage() {
  const [countryCode, setCountryCode] = createSignal("US");

  return (
    <div class="container mx-auto p-4 max-w-3xl">
      <title>Components - Inputs</title>
      <h1 class="text-2xl font-bold mb-6">Input Examples</h1>

      <div class="space-y-8">
        {/* Basic Input with overlapping label */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Basic Input with overlapping label</h2>
          <Input
            label="Name"
            placeholder="Jane Smith"
          />
        </div>

        {/* Input with leading icon */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Input with leading icon</h2>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leadingIcon={EmailIcon}
          />
        </div>

        {/* Input with trailing icon */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Input with trailing icon</h2>
          <Input
            label="Account number"
            placeholder="000-00-0000"
            trailingIcon={HelpIcon}
          />
        </div>

        {/* Input with leading and trailing add-ons */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Input with leading and trailing add-ons</h2>
          <Input
            label="Price"
            type="number"
            placeholder="0.00"
            leadingText="$"
            trailingText="USD"
          />
        </div>

        {/* Input with leading dropdown */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Input with leading dropdown</h2>
          <Input
            label="Phone number"
            type="tel"
            placeholder="123-456-7890"
            leadingDropdown={{
              options: [
                { value: "US", label: "US" },
                { value: "CA", label: "CA" },
                { value: "EU", label: "EU" }
              ],
              value: countryCode(),
              onChange: setCountryCode
            }}
          />
        </div>

        {/* Input with validation error */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Input with validation error</h2>
          <Input
            label="Email"
            type="email"
            value="invalid-email"
            error="Not a valid email address."
            leadingIcon={ErrorIcon}
          />
        </div>
      </div>
    </div>
  );
} 