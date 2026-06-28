import React from 'react';
import {Box, Button, Card, CardContent, Chip, Typography} from "@mui/material";

const mkd = (value) => `${Number(value || 0).toFixed(2)} ден.`;

const ProductDetails = ({details, onAdd, onRemove}) => {
  if (!details) return null;

  const originalPrice = Number(details.price || 0);
  const discountedPrice = Number(details.discountedPrice || originalPrice);
  const hasPromotion = Number.isFinite(discountedPrice) && discountedPrice < originalPrice;

  return (
    <Card>
      <CardContent>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
          <Typography variant="h4">{details.name}</Typography>
          {hasPromotion && (
            <Chip
              color="warning"
              label={details.promotionName || `${details.discountPercent || ''}% off`}
              sx={{fontWeight: 700}}
            />
          )}
        </Box>
        <Typography sx={{my:1}}>{details.description}</Typography>

        <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1, my: 1}}>
          {hasPromotion && (
            <Typography variant="h6" color="text.disabled" sx={{textDecoration: 'line-through'}}>
              {mkd(originalPrice)}
            </Typography>
          )}
          <Typography variant="h6" sx={{fontWeight: hasPromotion ? 800 : 500, color: hasPromotion ? 'success.main' : 'text.primary'}}>
            {mkd(hasPromotion ? discountedPrice : originalPrice)}
          </Typography>
        </Box>

        {details?.restaurant && (
          <Box sx={{mt:2}}>
            <Typography variant="subtitle2">Restaurant</Typography>
            <Typography>{details.restaurant.name}</Typography>
            <Typography color="text.secondary">{details.restaurant.description}</Typography>
          </Box>
        )}
        <Box sx={{display:'flex', gap:1, mt:2}}>
          <Button variant="contained" onClick={onAdd} disabled={details.isAvailable === false || details.quantity <= 0}>
            {details.quantity <= 0 ? "Out of stock" : "Add to cart"}
          </Button>
          {/*<Button onClick={onRemove}>Remove</Button>*/}
        </Box>
      </CardContent>
    </Card>
  )
}
export default ProductDetails;
