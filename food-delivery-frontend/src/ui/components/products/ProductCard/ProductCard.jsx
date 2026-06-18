import React from 'react';
import {Card, CardContent, CardActions, Typography, Button} from "@mui/material";
import {Link} from "react-router";

const ProductCard = ({p, onAdd}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{p.name}</Typography>
        <Typography variant="body2" color="text.secondary">{p.description}</Typography>
        <Typography variant="subtitle1" sx={{mt:1}}>{p.price?.toFixed?.(2)} ден.</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/products/${p.id}`}>Details</Button>
        {onAdd && <Button size="small" onClick={() => onAdd(p.id)}>Add to cart</Button>}
      </CardActions>
    </Card>
  )
}
export default ProductCard;
