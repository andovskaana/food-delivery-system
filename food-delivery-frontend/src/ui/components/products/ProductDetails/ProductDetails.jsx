import React from 'react';
import {Box, Button, Card, CardContent, Typography} from "@mui/material";

const ProductDetails = ({details, onAdd, onRemove}) => {
  if (!details) return null;
  return (
    <Card>
      <CardContent>
        <Typography variant="h4">{details.name}</Typography>
        <Typography sx={{my:1}}>{details.description}</Typography>
        <Typography variant="h6">{details.price?.toFixed?.(2)} ден.</Typography>
        {details?.restaurant && (
          <Box sx={{mt:2}}>
            <Typography variant="subtitle2">Restaurant</Typography>
            <Typography>{details.restaurant.name}</Typography>
            <Typography color="text.secondary">{details.restaurant.description}</Typography>
          </Box>
        )}
        <Box sx={{display:'flex', gap:1, mt:2}}>
          <Button variant="contained" onClick={onAdd}>Add to cart</Button>
          {/*<Button onClick={onRemove}>Remove</Button>*/}
        </Box>
      </CardContent>
    </Card>
  )
}
export default ProductDetails;
