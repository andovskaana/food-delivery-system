import React, { useEffect, useState, useMemo } from "react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Divider,
    Grid, Stack, Typography, Alert as MuiAlert, Tooltip,
    TextField, CircularProgress, Tab, Tabs,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaymentsIcon from "@mui/icons-material/Payments";
import useOrder from "../../../hooks/useOrder.js";
import paymentRepository from "../../../repository/paymentRepository.js";
import orderRepository from "../../../repository/orderRepository.js";
import { useNavigate } from "react-router";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Alert from "../../../common/Alert.jsx";
import CpayPaymentForm from "../../components/payment/CpayPaymentForm.jsx";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
    const { order, loading, refresh } = useOrder();
    const [stripePayment, setStripePayment] = useState(null);
    const [cpayPayment, setCpayPayment] = useState(null);
    const [busy, setBusy] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [paymentTab, setPaymentTab] = useState(0); // 0 = cPay, 1 = Stripe

    const navigate = useNavigate();

    // Load payment intents
    useEffect(() => {
        if (!order?.id) return;
        // Load cPay intent (default/primary)
        paymentRepository.createCpayIntent(order.id).then((res) => setCpayPayment(res.data));
        // Load Stripe intent (alternative)
        paymentRepository.createIntent(order.id).then((res) => setStripePayment(res.data));
    }, [order?.id]);

    const summary = useMemo(() => {
        const items = order?.items ?? [];
        const subtotal = order?.subtotal ?? items.reduce((acc, it) => acc + (it.price ?? 0) * (it.quantity ?? 1), 0);
        const delivery = order?.deliveryFee ?? 0;
        const discount = order?.discount ?? 0;
        const platformFee = order?.platformFee ?? 0;
        const total = order?.total ?? subtotal + delivery + platformFee - discount;
        return { items, subtotal, delivery, discount, platformFee, total, currency: order?.currency ?? "MKD" };
    }, [order]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) { setCouponError("Please enter a coupon code"); return; }
        setCouponLoading(true); setCouponError("");
        try {
            const res = await orderRepository.applyCoupon(couponCode.trim());
            if (res.data.success) {
                setAppliedCoupon({ code: res.data.couponCode, discountPercent: res.data.discountPercent });
                setCouponCode("");
                await refresh();
            } else { setCouponError(res.data.message || "Invalid coupon code"); }
        } catch { setCouponError("Failed to apply coupon. Please try again."); }
        finally { setCouponLoading(false); }
    };

    const handleRemoveCoupon = async () => {
        setCouponLoading(true);
        try { await orderRepository.removeCoupon(); setAppliedCoupon(null); await refresh(); }
        catch { setCouponError("Failed to remove coupon"); }
        finally { setCouponLoading(false); }
    };

    // cPay success
    const handleCpaySuccess = async () => {
        if (!cpayPayment?.id) return;
        setBusy(true);
        await paymentRepository.simulateSuccess(cpayPayment.id);
        await orderRepository.confirmPending();
        setBusy(false);
        setAlertMessage("Плаќањето успешно! Нарачката е потврдена. / Payment succeeded! Order confirmed.");
        setAlertOpen(true);
        setTimeout(() => navigate("/"), 1500);
    };

    const handleCpayFailure = async (msg) => {
        if (!cpayPayment?.id) return;
        await paymentRepository.simulateFailure(cpayPayment.id);
        setAlertMessage(msg || "Плаќањето неуспешно. Обидете се повторно.");
        setAlertOpen(true);
    };

    // Stripe success
    const handleStripeSuccess = async () => {
        await orderRepository.confirmPending();
        setAlertMessage("Payment succeeded! Order confirmed.");
        setAlertOpen(true);
        navigate("/");
    };

    // Stripe demo simulate
    const simulateStripeSuccess = async () => {
        if (!stripePayment?.id) return;
        setBusy(true);
        await paymentRepository.simulateSuccess(stripePayment.id);
        await orderRepository.confirmPending();
        setBusy(false);
        setAlertMessage("Payment succeeded! Order confirmed.");
        setAlertOpen(true);
        navigate("/");
    };

    const simulateStripeFailure = async () => {
        if (!stripePayment?.id) return;
        setBusy(true);
        await paymentRepository.simulateFailure(stripePayment.id);
        setBusy(false);
        setAlertMessage("Payment failed (simulated). Try again.");
        setAlertOpen(true);
    };

    if (loading) return <Typography>Loading…</Typography>;
    if (!order) return <Typography>No pending order to pay.</Typography>;

    const hasStripeClientSecret = !!stripePayment?.clientSecret;

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Checkout</Typography>
            </Stack>

            <Grid container spacing={3}>
                {/* LEFT: Payment */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 4px 18px rgba(16,24,40,.06)" }}>
                        <CardHeader
                            title={
                                <Stack direction="row" alignItems="center" spacing={1.25}>
                                    <PaymentsIcon color="primary" />
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Payment Method</Typography>
                                </Stack>
                            }
                            sx={{ pb: 0 }}
                        />
                        <CardContent>
                            <Tabs
                                value={paymentTab}
                                onChange={(_, v) => setPaymentTab(v)}
                                sx={{ mb: 2 }}
                            >
                                <Tab
                                    label={
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <span>cPay (МКД)</span>
                                            <Chip label="ГЛАВНО / PRIMARY" size="small" color="primary" />
                                        </Stack>
                                    }
                                />
                                <Tab
                                    label={
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <span>Stripe</span>
                                            <Chip label="АЛТЕРНАТИВА" size="small" variant="outlined" />
                                        </Stack>
                                    }
                                />
                            </Tabs>

                            {/* TAB 0: cPay */}
                            {paymentTab === 0 && (
                                <CpayPaymentForm
                                    payment={cpayPayment}
                                    order={order}
                                    onSuccess={handleCpaySuccess}
                                    onFailure={handleCpayFailure}
                                    busy={busy}
                                    setBusy={setBusy}
                                />
                            )}

                            {/* TAB 1: Stripe */}
                            {paymentTab === 1 && (
                                <Box>
                                    <MuiAlert severity="info" sx={{ mb: 2 }}>
                                        Stripe is available as an alternative payment method.
                                        {!hasStripeClientSecret && " Running in demo mode (no client secret)."}
                                    </MuiAlert>

                                    {hasStripeClientSecret ? (
                                        <Elements stripe={stripePromise} options={{ clientSecret: stripePayment.clientSecret }}>
                                            <StripeForm
                                                clientSecret={stripePayment.clientSecret}
                                                busy={busy}
                                                setBusy={setBusy}
                                                onPaid={handleStripeSuccess}
                                                setAlertMessage={setAlertMessage}
                                                setAlertOpen={setAlertOpen}
                                            />
                                        </Elements>
                                    ) : (
                                        <Stack direction="row" spacing={1}>
                                            <Button disabled={!stripePayment || busy} variant="contained" onClick={simulateStripeSuccess}>
                                                Simulate success
                                            </Button>
                                            <Button disabled={!stripePayment || busy} onClick={simulateStripeFailure}>
                                                Simulate failure
                                            </Button>
                                        </Stack>
                                    )}

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, color: "text.secondary" }}>
                                        <LockOutlinedIcon fontSize="small" />
                                        <Typography variant="caption">
                                            Test card:{" "}
                                            <Tooltip title="Card: 4242 4242 4242 4242 · any future date · any CVC">
                                                <strong>4242 4242 4242 4242</strong>
                                            </Tooltip>
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* RIGHT: Order Summary */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 3, boxShadow: "0 4px 18px rgba(16,24,40,.06)" }}>
                        <CardHeader title={<Typography variant="h6" sx={{ fontWeight: 800 }}>Order Summary</Typography>} sx={{ pb: 1.5 }} />
                        <CardContent>
                            <Stack spacing={1.25}>
                                {(summary.items.length
                                        ? summary.items
                                        : [{ name: "Your items", quantity: 1, unitPriceSnapshot: summary.subtotal }]
                                ).map((it, idx) => (
                                    <Stack key={it.id ?? it.name ?? idx} direction="row" justifyContent="space-between" sx={{ color: "text.secondary" }}>
                                        <Typography variant="body2">{it.quantity ? `${it.quantity} × ` : ""}{it.name ?? "Item"}</Typography>
                                        <Typography variant="body2">{((it.unitPriceSnapshot ?? it.price ?? 0) * (it.quantity ?? 1)).toFixed(2)} {summary.currency}</Typography>
                                    </Stack>
                                ))}
                                <Divider sx={{ my: 0.75 }} />

                                {/* Coupon */}
                                <Box sx={{ py: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        <LocalOfferIcon fontSize="small" color="primary" />
                                        <Typography variant="subtitle2" fontWeight={600}>Have a coupon?</Typography>
                                    </Stack>
                                    {appliedCoupon || summary.discount > 0 ? (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, bgcolor: "success.lighter", borderRadius: 2, border: "1px solid", borderColor: "success.light" }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <CheckCircleIcon color="success" fontSize="small" />
                                                <Typography variant="body2" fontWeight={600} color="success.dark">
                                                    {appliedCoupon?.code || "Discount"} applied
                                                </Typography>
                                            </Stack>
                                            <Button size="small" color="error" onClick={handleRemoveCoupon} disabled={couponLoading}>Remove</Button>
                                        </Box>
                                    ) : (
                                        <Stack direction="row" spacing={1}>
                                            <TextField size="small" placeholder="Enter coupon code" value={couponCode}
                                                       onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                                       error={!!couponError} helperText={couponError} sx={{ flex: 1 }} disabled={couponLoading} />
                                            <Button variant="outlined" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} sx={{ minWidth: 80 }}>
                                                {couponLoading ? <CircularProgress size={20} /> : "Apply"}
                                            </Button>
                                        </Stack>
                                    )}
                                </Box>

                                <Divider sx={{ my: 0.75 }} />
                                <Row label="Subtotal" value={summary.subtotal} currency={summary.currency} />
                                {summary.discount > 0 && <Row label="Discount" value={-summary.discount} currency={summary.currency} highlight="success" />}
                                <Row label={summary.delivery === 0 ? "Delivery (FREE)" : "Delivery"} value={summary.delivery} currency={summary.currency} highlight={summary.delivery === 0 ? "success" : null} />
                                {summary.platformFee > 0 && <Row label="Platform Fee" value={summary.platformFee} currency={summary.currency} />}
                                <Divider sx={{ my: 0.75 }} />
                                <Row label="Total" value={summary.total} currency={summary.currency} strong />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Alert open={alertOpen} onClose={() => setAlertOpen(false)} message={alertMessage} />
        </Box>
    );
};

export default CheckoutPage;

function Row({ label, value = 0, currency = "MKD", strong = false, highlight = null }) {
    const color = highlight === "success" ? "success.main" : highlight === "error" ? "error.main" : "inherit";
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant={strong ? "subtitle2" : "body2"} sx={{ fontWeight: strong ? 700 : 400, color: highlight ? color : "inherit" }}>
                {label}
            </Typography>
            <Typography variant={strong ? "subtitle2" : "body2"} sx={{ fontWeight: strong ? 800 : 500, color: highlight ? color : "inherit" }}>
                {value < 0 ? "-" : ""}{Math.abs(Number(value)).toFixed(2)} {currency}
            </Typography>
        </Stack>
    );
}

function StripeForm({ clientSecret, busy, setBusy, onPaid, setAlertMessage, setAlertOpen }) {
    const stripe = useStripe();
    const elements = useElements();

    const handlePay = async () => {
        if (!stripe || !elements) return;
        setBusy(true);
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: elements.getElement(CardElement) },
        });
        setBusy(false);
        if (error) { setAlertMessage(error.message || "Payment failed"); setAlertOpen(true); return; }
        if (paymentIntent?.status === "succeeded") { await onPaid(); }
        else { setAlertMessage(`Payment status: ${paymentIntent?.status ?? "unknown"}`); setAlertOpen(true); }
    };

    return (
        <Stack spacing={1.5}>
            <Box sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: "16px" } } }} />
            </Box>
            <Button variant="contained" size="large" onClick={handlePay} disabled={busy || !stripe} sx={{ borderRadius: 2, fontWeight: 700 }}>
                Pay Securely with Stripe
            </Button>
        </Stack>
    );
}