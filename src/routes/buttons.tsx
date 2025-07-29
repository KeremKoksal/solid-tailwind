import Button from "~/components/Button";
import ButtonGroup from "~/components/ButtonGroup";

function ChevronLeftIcon() {
  return (
    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
    </svg>
  );
}

export default function ButtonsPage() {
  return (
    <div class="container mx-auto p-4 max-w-4xl">
      <title>Components - Buttons</title>
      <h1 class="text-2xl font-bold mb-6">Button Examples</h1>

      <div class="space-y-8">
        {/* Basic Buttons */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Basic Buttons</h2>
          <div class="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="soft">Soft Button</Button>
            <Button variant="white">White Button</Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Button Sizes</h2>
          <div class="flex flex-wrap items-center gap-4">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </div>

        {/* Rounded Buttons */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Rounded Buttons</h2>
          <div class="flex flex-wrap gap-4">
            <Button shape="rounded" variant="rounded">Rounded Primary</Button>
            <Button shape="rounded" variant="secondary" leadingIcon={HeartIcon}>
              Like
            </Button>
            <Button shape="rounded" variant="rounded" trailingIcon={ChevronRightIcon}>
              Continue
            </Button>
          </div>
        </div>

        {/* Circular Icon Buttons */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Circular Icon Buttons</h2>
          <div class="flex flex-wrap items-center gap-4">
            <Button shape="circular" variant="circular" size="xs" leadingIcon={PlusIcon} />
            <Button shape="circular" variant="circular" size="sm" leadingIcon={HeartIcon} />
            <Button shape="circular" variant="circular" size="md" leadingIcon={ChevronRightIcon} />
            <Button shape="circular" variant="circular" size="lg" leadingIcon={PlusIcon} />
            <Button shape="circular" variant="circular" size="xl" leadingIcon={HeartIcon} />
          </div>
        </div>

        {/* Button Groups */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Button Groups</h2>
          <div class="flex flex-wrap gap-4">
            <ButtonGroup>
              <Button variant="secondary" groupPosition="first">Years</Button>
              <Button variant="secondary" groupPosition="middle">Months</Button>
              <Button variant="secondary" groupPosition="last">Days</Button>
            </ButtonGroup>

            <ButtonGroup>
              <Button variant="white" groupPosition="first" leadingIcon={ChevronLeftIcon}>
                Previous
              </Button>
              <Button variant="white" groupPosition="last" trailingIcon={ChevronRightIcon}>
                Next
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Full Width Button */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Full Width Button</h2>
          <Button fullWidth leadingIcon={PlusIcon}>
            Create New Project
          </Button>
        </div>

        {/* Disabled State */}
        <div class="space-y-4">
          <h2 class="text-lg font-medium">Disabled State</h2>
          <div class="flex flex-wrap gap-4">
            <Button disabled>Disabled Primary</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
            <Button shape="rounded" variant="rounded" disabled>Disabled Rounded</Button>
            <Button shape="circular" variant="circular" leadingIcon={HeartIcon} disabled />
          </div>
        </div>
      </div>
    </div>
  );
} 