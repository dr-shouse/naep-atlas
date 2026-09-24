import { TIP_URL } from "../config";

// Optional tip via a Stripe Payment Link. Hidden while TIP_URL is empty.
export default function TipJar() {
  if (!TIP_URL) return null;
  return (
    <a href={TIP_URL} target="_blank" rel="noopener noreferrer" className="tip"
      title="Optional tip. NAEP Atlas is free; this unlocks nothing.">
      Tip jar
    </a>
  );
}
