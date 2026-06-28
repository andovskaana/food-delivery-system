import React from 'react';
import {Box, Card, CardContent, CardActions, Typography, Button, Chip} from "@mui/material";
import {Link} from "react-router";

const mkd = (value) => `${Number(value || 0).toFixed(2)} ден.`;

const ProductCard = ({p, onAdd}) => {
  const originalPrice = Number(p.price || 0);
  const discountedPrice = Number(p.discountedPrice || originalPrice);
  const hasPromotion = Number.isFinite(discountedPrice) && discountedPrice < originalPrice;

  return (
    <Card>
      <CardContent>
        <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start'}}>
          <Typography variant="h6">{p.name}</Typography>
          {hasPromotion && (
            <Chip
              size="small"
              color="warning"
              label={p.promotionName || `${p.discountPercent || ''}% off`}
              sx={{fontWeight: 700}}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">{p.description}</Typography>
        <Box sx={{mt:1, display: 'flex', gap: 1, alignItems: 'baseline'}}>
          {hasPromotion && (
            <Typography variant="body2" color="text.disabled" sx={{textDecoration: 'line-through'}}>
              {mkd(originalPrice)}
            </Typography>
          )}
          <Typography variant="subtitle1" sx={{fontWeight: hasPromotion ? 800 : 500, color: hasPromotion ? 'success.main' : 'text.primary'}}>
            {mkd(hasPromotion ? discountedPrice : originalPrice)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/products/${p.id}`}>Details</Button>
        {onAdd && <Button size="small" onClick={() => onAdd(p.id)}>Add to cart</Button>}
      </CardActions>
    </Card>
  )
}
export default ProductCard;
