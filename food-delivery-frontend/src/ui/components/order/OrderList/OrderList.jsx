import React, { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, IconButton, TextField, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import productRepository from "../../../../repository/productRepository.js";

/**
 * Normalize the order payload and group duplicate products into one line.
 * Works with either:
 *  - OrderDto with `items` / `orderItems`
 *  - DisplayOrderDto with flat `Products` array (quantity is assumed 1 each)
 */
const normalizeAndGroup = (order) => {
  if (!order) return [];

  // Prefer itemized structures if present
  const raw = Array.isArray(order.orderItems) && order.orderItems.length
      ? order.orderItems
      : Array.isArray(order.items) && order.items.length
          ? order.items
          : Array.isArray(order.Products) && order.Products.length
              ? order.Products.map(p => ({
                productId: p.id,
                productName: p.name,
                imageUrl: p.imageUrl,
                unitPriceSnapshot: p.price,
                quantity: 1
              }))
              : [];

  // Group by productId (fallback to productName)
  const map = new Map();
  for (const it of raw) {
    const id = it.productId ?? it.ProductId ?? it.product?.id ?? it.id ?? it.name ?? it.productName;
    const name = it.productName ?? it.ProductName ?? it.product?.name ?? it.name ?? "Item";
    const unit = Number(it.unitPriceSnapshot ?? it.unitPrice ?? it.price ?? it.product?.price ?? 0);
    const qty = Number(it.quantity ?? 1);
    const imageUrl = it.imageUrl ?? it.product?.imageUrl;

    const prev = map.get(id);
    if (!prev) {
      map.set(id, { productId: id, productName: name, unitPrice: unit, quantity: qty, imageUrl });
    } else {
      prev.quantity += qty;
    }
  }
  return Array.from(map.values());
};

const lineTotal = (i) => Number(i.quantity ?? 1) * Number(i.unitPrice ?? 0);

const OrderList = ({ order, onCheckout, onCancel, refresh }) => {
  const items = useMemo(() => normalizeAndGroup(order), [order]);
  const [busyId, setBusyId] = useState(null);

  const total =
      Number(order?.total ??
          items.reduce((sum, it) => sum + lineTotal(it), 0));

  const updateByDelta = async (productId, delta) => {
    try {
      setBusyId(productId);
      if (delta > 0) {
        for (let i = 0; i < delta; i++) await productRepository.addToOrder(productId);
      } else if (delta < 0) {
        for (let i = 0; i < Math.abs(delta); i++) await productRepository.removeFromOrder(productId);
      }
      if (typeof refresh === "function") await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const setQuantity = async (productId, currentQty, newQtyRaw) => {
    const newQty = Math.max(0, Number.isFinite(+newQtyRaw) ? +newQtyRaw : 0);
    const delta = newQty - currentQty;
    await updateByDelta(productId, delta);
  };

  if (!items.length) {
    return (
        <Card>
          <CardContent>
            <Typography variant="h5">Your Cart</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography color="text.secondary">No items yet.</Typography>
          </CardContent>
        </Card>
    );
  }

  return (
      <Card>
        <CardContent>
          <Typography variant="h5">Your Cart</Typography>
          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {items.map((it) => (
                <Box key={it.productId ?? it.productName}
                     sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 2 }}>
                  <Typography>{it.productName}</Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={() => updateByDelta(it.productId, -1)}
                        disabled={busyId === it.productId || (it.quantity ?? 1) <= 0}
                        aria-label="decrease quantity"
                    >
                      <RemoveIcon />
                    </IconButton>

                    <TextField
                        size="small"
                        value={it.quantity}
                        onChange={(e) => setQuantity(it.productId, it.quantity, e.target.value)}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, style: { textAlign: 'center', width: 56 } }}
                    />

                    <IconButton
                        size="small"
                        onClick={() => updateByDelta(it.productId, +1)}
                        disabled={busyId === it.productId}
                        aria-label="increase quantity"
                    >
                      <AddIcon />
                    </IconButton>

                    <Typography sx={{ minWidth: 90, textAlign: 'right' }}>
                      {lineTotal(it).toFixed(2)} ден.
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={() => setQuantity(it.productId, it.quantity, 0)}
                        disabled={busyId === it.productId}
                        aria-label="remove item"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
            ))}
          </Box>

          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">{Number(total || 0).toFixed(2)} ден.</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={onCheckout}>Checkout</Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Box>
        </CardContent>
      </Card>
  );
};

export default OrderList;