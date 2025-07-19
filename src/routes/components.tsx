
import Card from "~/components/Card";

export default function Components() {
  return (
    <div class="container mx-auto p-4 space-y-6">
      <title>Components - Card Examples</title>
      <h1 class="text-2xl font-bold mb-6">Card Component Examples</h1>

      <Card
        header="Card with Header and Footer"
        footer="Last updated recently"
      >
        <div class="text-gray-700">
          This is a card with both header and footer.
        </div>
      </Card>

      <Card
        header="Card with Header Only"
      >
        <div class="text-gray-700">
          This card only has a header.
        </div>
      </Card>

      <Card
        footer="Card footer content"
      >
        <div class="text-gray-700">
          This card only has a footer.
        </div>
      </Card>

      <Card>
        <div class="text-gray-700">
          This is a basic card without header and footer.
        </div>
      </Card>
    </div>
  );
}
