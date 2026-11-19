import { LandingSocialProofCard } from "@/components/landing/landing-social-proof";
import {
  type LandingSocialProof,
  getLandingSocialProof,
} from "@/lib/landing";

export async function LandingSocialProofSection() {
  let proof: LandingSocialProof | null = null;

  try {
    proof = await getLandingSocialProof();
  } catch (error) {
    console.error("Landing social proof section failed", error);
  }

  if (!proof) {
    return null;
  }

  return <LandingSocialProofCard proof={proof} />;
}