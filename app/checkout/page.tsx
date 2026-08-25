import { CheckoutForm } from "@/components/checkout/checkout-form";
import { BackButton } from "@/components/layout/back-button";

export default function CheckoutPage() {
  return (
    <div className="shell py-10">
      <BackButton href="/cart" label="Back to Cart" className="mb-4" />
      <p className="eyebrow mb-3">Secure checkout</p>
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">Complete your order</h1>
      <CheckoutForm />
    </div>
  );
}
