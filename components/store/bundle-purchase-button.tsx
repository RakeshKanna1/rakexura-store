"use client";

import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";
import type { Bundle } from "@/types/store";

export function BundlePurchaseButton({ bundle }: { bundle: Bundle }) {
  const addBundle = useCartStore((state) => state.addBundle); const open = useCartStore((state) => state.setDrawerOpen);
  return <button onClick={() => { addBundle(bundle); open(true); toast.success(`${bundle.title} added to cart`); }} className="btn btn-primary mt-6 w-full"><PackagePlus size={18} /> Add bundle to cart</button>;
}
