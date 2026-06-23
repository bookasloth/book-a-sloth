import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProduct,
  sendOtp,
  verifyOtp,
  createProductOrder,
  verifyProductPayment,
  freeDownloadProduct,
  downloadProduct,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { gaClientId } from "../services/analytics";
import toast from "react-hot-toast";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const TYPE_ICONS = {
  pdf: "📄",
  template: "🗂️",
  ebook: "📚",
  prompt_pack: "✨",
  resource: "🔗",
  other: "📦",
};
const TYPE_LABELS = {
  pdf: "PDF",
  template: "Template",
  ebook: "eBook",
  prompt_pack: "Prompt Pack",
  resource: "Resource",
  other: "Digital Product",
};

// Only treat http(s) URLs as navigable. Anything else (javascript:, data:, …)
// is rejected so a malicious stored URL can't be opened as a link.
const safeUrl = (url) =>
  /^https?:\/\//i.test(String(url || "")) ? url : null;

const ProductPurchase = () => {
  const { profileSlug: username, productId } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // step: 'details' | 'otp' | 'payment' | 'done'
  const [step, setStep] = useState("details");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [downloadToken, setDownloadToken] = useState("");
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getProduct(productId)
      .then(({ data }) => setProduct(data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSendOtp = async () => {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    setOtpSending(true);
    try {
      await sendOtp({ email, phone, name });
      toast.success("Verification code sent to your email!");
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      if (product.price === 0) {
        // Free product — the server verifies the OTP itself (single-use), so we
        // pass the raw code straight through rather than pre-consuming it via
        // verify-otp. The download token is issued only on a valid OTP.
        const { data } = await freeDownloadProduct({
          product_id: product.id,
          buyer_name: name,
          buyer_email: email,
          buyer_phone: phone,
          otp,
        });
        setDownloadToken(data.download_token);
        setStep("done");
        toast.success("Download ready!");
      } else {
        // Paid product — verify the OTP here; payment is verified separately.
        const { data: result } = await verifyOtp({ email, otp });
        if (!result.verified) {
          toast.error("Verification failed");
          return;
        }
        setStep("payment");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Payment gateway failed to load");
      return;
    }
    setPaymentLoading(true);
    try {
      const { data: order } = await createProductOrder({
        product_id: product.id,
      });
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "Book A Sloth",
        description: product.title,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          try {
            const { data } = await verifyProductPayment({
              product_id: product.id,
              buyer_name: name,
              buyer_email: email,
              buyer_phone: phone,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              ga_client_id: gaClientId(),   // join server GA4 hit to this web session
            });
            setDownloadToken(data.download_token);
            setStep("done");
            toast.success("Payment successful!");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#4f46e5" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await downloadProduct(downloadToken);
      setDownloadInfo(data);
      const url = safeUrl(data.file_url);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Download link is invalid. Contact the seller.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!product)
    return (
      <div className="text-center py-20 text-gray-400">Product not found</div>
    );

  const host = product.profiles;

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <div className="app-container py-8 max-w-2xl">
        <Link
          to={`/${username}`}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {host?.name}'s profile
        </Link>

        {/* Product card */}
        <div className="fb-card overflow-hidden mb-6">
          {product.thumbnail_url && (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {TYPE_ICONS[product.type] || "📦"}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {TYPE_LABELS[product.type]}
                  </span>
                </div>
                <h1 className="text-xl font-bold">{product.title}</h1>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-primary">
                  {product.price === 0 ? "Free" : `₹${product.price}`}
                </p>
                {product.price > 0 && (
                  <p className="text-xs text-gray-400">+ ₹10 platform fee</p>
                )}
              </div>
            </div>
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
              {host?.profile_image ? (
                <img
                  src={host.profile_image}
                  alt={host.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {host?.name?.charAt(0)}
                </div>
              )}
              <p className="text-sm text-gray-500">
                by{" "}
                <span className="font-medium text-gray-700">{host?.name}</span>
              </p>
              <span className="text-xs text-gray-400 ml-auto">
                {product.purchase_count} sold
              </span>
            </div>
          </div>
        </div>

        {/* Purchase flow */}
        <div className="fb-card p-5 sm:p-6">
          {/* Step: details */}
          {step === "details" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                {product.price === 0
                  ? "Get this for free"
                  : "Complete your purchase"}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="fb-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="fb-input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Download link will be sent here
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="fb-input"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      For order-related contact. Your verification code is sent to your email.
                    </p>
                  </div>
                </div>
                {product.price > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Product</span>
                      <span>₹{product.price}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Platform fee</span>
                      <span>₹10</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{product.price + 10}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSendOtp}
                  disabled={otpSending || !name || !email}
                  className="btn w-full bg-primary text-white py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {otpSending ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div className="text-center max-w-xs mx-auto">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="font-bold mb-1">Check your email</h2>
              <p className="text-sm text-gray-500 mb-5">
                Code sent to <strong>{email}</strong>
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                autoFocus
                className="w-full border-2 rounded-xl px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:border-primary mb-4"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <button
                onClick={handleVerify}
                disabled={verifying || otp.length !== 6}
                className="btn w-full bg-primary text-white py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {verifying
                  ? "Verifying..."
                  : product.price === 0
                    ? "Verify & Get Download"
                    : "Verify & Continue to Payment"}
              </button>
              <button
                onClick={handleSendOtp}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600"
              >
                Resend code
              </button>
            </div>
          )}

          {/* Step: payment */}
          {step === "payment" && (
            <div className="text-center max-w-xs mx-auto">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h2 className="font-bold mb-1">Complete Payment</h2>
              <p className="text-sm text-gray-500 mb-5">
                You'll receive a secure download link after payment
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-left mb-5">
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">₹{product.price + 10}</span>
                </div>
              </div>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="btn w-full bg-indigo-600 text-white py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {paymentLoading
                  ? "Opening payment..."
                  : `Pay ₹${product.price + 10} with Razorpay`}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                UPI · Card · Wallet accepted
              </p>
            </div>
          )}

          {/* Step: done */}
          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-700 mb-1">
                {product.price === 0 ? "You got it!" : "Purchase Complete!"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {downloadInfo
                  ? `${downloadInfo.downloads_remaining} download${downloadInfo.downloads_remaining !== 1 ? "s" : ""} remaining`
                  : "Ready to download"}
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn w-full bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {downloading ? "Opening..." : `Download ${product.title}`}
              </button>
              <p className="text-xs text-gray-400">
                Link expires in 24 hours · Max 3 downloads · A copy has been
                sent to {email}
              </p>
              <Link
                to={`/${username}`}
                className="block mt-4 text-sm text-primary hover:underline"
              >
                Back to {host?.name}'s profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPurchase;
