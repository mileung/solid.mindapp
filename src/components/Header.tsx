import { createSignal } from "solid-js";

export default function Header() {
  const [count, setCount] = createSignal(0);
  return (
    <button
      class="increment"
      onClick={() => setCount(count() + 1)}
      type="button"
    >
      Clicks: {count()}
    </button>
  );
}
