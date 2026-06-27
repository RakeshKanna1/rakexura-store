import { Suspense } from "react";
import { TrackingForm } from "@/components/tracking/tracking-form";
export default function TrackPage() { return <div className="shell py-10"><p className="eyebrow mb-3">Live order status</p><h1 className="text-4xl font-bold md:text-5xl">Track your delivery</h1><p className="muted mb-8 mt-3">Use your order reference and WhatsApp number. Customer details are never shown publicly.</p><Suspense><TrackingForm /></Suspense></div>; }
