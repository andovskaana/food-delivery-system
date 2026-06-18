import React from 'react';
import {Grid} from "@mui/material";
import ProductCard from "../ProductCard/ProductCard.jsx";

const ProductGrid = ({items, onAdd}) => {
  return (
    <Grid container spacing={2}>
      {items.map(p => (
        <Grid item key={p.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard p={p} onAdd={onAdd}/>
        </Grid>
      ))}
    </Grid>
  )
}
export default ProductGrid;
