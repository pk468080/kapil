/**
 * pages/Upgrade.jsx — Plan upgrade page with Razorpay integration.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createOrder, getMe, getPlans, verifyPayment } from "../services/api";

export default function Upgrade() {
  const { user, authLogin, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getPlans().then((data) => setPlans(data.plans)).catch(() => {});
  }, []);

  if (user?.plan === "pro" || success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">You&apos;re on Pro!</h2>
          <p className="text-slate-500 mb-6">Enjoy unlimited searches and AI explanations.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  async function handleUpgrade() {
    setError("");
    setLoading(true);
    try {
      const order = await createOrder();

      // Load Razorpay script dynamically
      await loadRazorpayScript();

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Legal Mapper",
        description: "Pro Plan",
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Refresh user data
            const me = await getMe();
            authLogin(token, me);
            setSuccess(true);
          } catch {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email || "" },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">⚖️ Upgrade to Pro</h1>
          <p className="text-slate-500 mt-2">Unlock all features of Legal Mapper</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-sm p-6 border-2 ${
                plan.name === "pro"
                  ? "border-indigo-500 ring-2 ring-indigo-200"
                  : "border-slate-200"
              }`}
            >
              {plan.name === "pro" && (
                <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  RECOMMENDED
                </span>
              )}
              <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.label}</h3>
              <p className="text-2xl font-bold text-indigo-700 mb-4">
                {plan.price === 0
                  ? "Free"
                  : `₹${(plan.price / 100).toFixed(0)}/month`}
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.name === "pro" && (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {loading ? "Processing…" : "Upgrade Now"}
                </button>
              )}
              {plan.name === "free" && (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full border border-slate-300 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  Continue Free
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Payments are processed securely by Razorpay. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
