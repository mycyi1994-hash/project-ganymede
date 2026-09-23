import type { Metadata } from "next";
import ProofClient from "./ProofClient";

export const metadata: Metadata = {
  title: "Proof of NAV · Ganymede Index",
  description: "Live NAV of a tokenized US tech stock basket on X Layer, anchored on chain and verifiable in your browser.",
};

export default function ProofPage() {
  return <ProofClient />;
}
