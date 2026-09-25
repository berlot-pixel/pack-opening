import type { Metadata } from "next";
import { Amis } from "@/components/Amis";

export const metadata: Metadata = { title: "Amis — Pack Opening" };

export default function PageAmis() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Amis</h1>
        <p className="mt-2 text-sm text-white/60">Ajoute tes amis avec leur pseudo</p>
      </div>
      <Amis />
    </div>
  );
}
