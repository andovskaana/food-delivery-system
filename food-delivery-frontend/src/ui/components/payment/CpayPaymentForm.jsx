import React, { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    Stack,
    TextField,
    Typography,
    Alert,
    Chip,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/**
 * Demo Macedonian cPay/CASYS-style payment form.
 * 
 * ⚠️  DEMO ONLY — This is a visual simulation of a cPay payment.
 *      No real card data is stored or processed.
 *      In a real integration, the merchant POSTs form parameters to:
 *      https://www.cpay.com.mk/client/Page/default.aspx?xml_id=/mkMK/.loginToPay/
 * 
 * cPay parameters (per official spec):
 *   AmountToPay, AmountCurrency, Details1, Details2,
 *   PayToMerchant, MerchantName, PaymentOKURL, PaymentFailURL
 */
const CpayPaymentForm = ({ payment, order, onSuccess, onFailure, busy, setBusy }) => {
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [errors, setErrors] = useState({});

    const formatCardNumber = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(.{4})/g, "$1 ").trim();
    };

    const formatExpiry = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits;
    };

    const validate = () => {
        const newErrors = {};
        if (cardNumber.replace(/\s/g, "").length !== 16)
            newErrors.cardNumber = "Card number must be 16 digits";
        if (!cardHolder.trim())
            newErrors.cardHolder = "Cardholder name is required";
        if (!/^\d{2}\/\d{2}$/.test(expiry))
            newErrors.expiry = "Format: MM/YY";
        if (cvv.length < 3)
            newErrors.cvv = "CVV must be 3 or 4 digits";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePay = async () => {
        if (!validate()) return;
        setBusy(true);
        // Simulate processing delay (realistic UX)
        await new Promise(r => setTimeout(r, 1800));
        // Demo: card ending in 0000 simulates failure, everything else succeeds
        const lastFour = cardNumber.replace(/\s/g, "").slice(-4);
        if (lastFour === "0000") {
            onFailure("Card declined (demo failure: use any other card number)");
        } else {
            onSuccess();
        }
        setBusy(false);
    };

    const amountMKD = payment?.amount ?? order?.total ?? 0;

    return (
        <Box>
            {/* DEMO WARNING BANNER */}
            <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{ mb: 2, borderRadius: 2 }}
            >
                <strong>DEMO PAYMENT — НЕ ВИСТИНСКА ТРАНСАКЦИЈА</strong><br />
                Ова е симулација на cPay плаќање. Не внесувајте вистински податоци од картичка.
                Користете кои било тест-броеви. (Картичка завршена со 0000 = неуспешно плаќање)
            </Alert>

            {/* Merchant/Order Info Box (as cPay would show) */}
            <Card
                variant="outlined"
                sx={{
                    mb: 2,
                    background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
                    color: "white",
                    borderRadius: 2,
                }}
            >
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Трговец / Merchant
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                                Ana2Ana Food Delivery
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Нарачка #{order?.id} · MKD
                            </Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Износ / Amount
                            </Typography>
                            <Typography variant="h5" fontWeight={800}>
                                {amountMKD?.toFixed(2)} МКД
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {/* Card Form */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CreditCardIcon />
                            <Typography variant="subtitle1" fontWeight={700}>
                                Податоци за картичка / Card Details
                            </Typography>
                            <Chip
                                label="DEMO"
                                size="small"
                                color="warning"
                                sx={{ ml: 1 }}
                            />
                        </Stack>
                    }
                    sx={{ pb: 0 }}
                />
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Број на картичка / Card Number"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                error={!!errors.cardNumber}
                                helperText={errors.cardNumber}
                                inputProps={{ maxLength: 19 }}
                                InputProps={{
                                    startAdornment: <CreditCardIcon sx={{ mr: 1, color: "text.secondary" }} />,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Носач на картичка / Cardholder Name"
                                placeholder="ИМЕ ПРЕЗИМЕ / FIRSTNAME LASTNAME"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                                error={!!errors.cardHolder}
                                helperText={errors.cardHolder}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Важи до / Expiry"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                error={!!errors.expiry}
                                helperText={errors.expiry}
                                inputProps={{ maxLength: 5 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="CVV"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                error={!!errors.cvv}
                                helperText={errors.cvv}
                                type="password"
                                inputProps={{ maxLength: 4 }}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Security note */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: "text.secondary" }}>
                        <LockIcon fontSize="small" />
                        <Typography variant="caption">
                            Плаќањето е заштитено со SSL/HTTPS шифрирање (DEMO)
                        </Typography>
                    </Stack>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handlePay}
                        disabled={busy}
                        sx={{
                            background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
                            fontWeight: 700,
                            py: 1.5,
                            borderRadius: 2,
                        }}
                    >
                        {busy ? "Обработка... / Processing..." : `Плати ${amountMKD?.toFixed(2)} МКД / Pay`}
                    </Button>

                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
                        Reference: {payment?.providerIntentId ?? "—"} · cPay DEMO · Не вистинска трансакција
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default CpayPaymentForm;
