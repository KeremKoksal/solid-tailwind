import { useLocation } from "@solidjs/router";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
      path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";
  return (
      <nav class="bg-sky-800">
        <ul class="container flex items-center p-3 text-gray-200">
          <li className={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <a href="/">Home</a>
          </li>
          <li className={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <a href="/about">About</a>
          </li>
          <li className={`border-b-2 ${active("/cards")} mx-1.5 sm:mx-6`}>
            <a href="/cards">Cards</a>
          </li>
          <li className={`border-b-2 ${active("/comboboxes")} mx-1.5 sm:mx-6`}>
            <a href="/comboboxes">Comboboxes</a>
          </li>
          <li className={`border-b-2 ${active("/inputs")} mx-1.5 sm:mx-6`}>
            <a href="/inputs">Inputs</a>
          </li>
          <li className={`border-b-2 ${active("/buttons")} mx-1.5 sm:mx-6`}>
            <a href="/buttons">Buttons</a>
          </li>
          <li className={`border-b-2 ${active("/users")} mx-1.5 sm:mx-6`}>
            <a href="/users">Data Grid</a>
          </li>
          <li className={`border-b-2 ${active("/building")} mx-1.5 sm:mx-6`}>
            <a href="/building">Buildings</a>
          </li>
        </ul>
      </nav>

  );
}