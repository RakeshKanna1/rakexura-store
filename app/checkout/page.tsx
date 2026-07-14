import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="shell py-10">
      <p className="eyebrow mb-3">Secure checkout</p>
      <h1 className="mb-8 text-4xl font-bold md:text-5xl">Complete your order</h1>
      <CheckoutForm />
    </div>
  );
}
