import React from 'react';
import {Box, Card, CardContent, Rating, Typography} from "@mui/material";

const ReviewList = ({reviews}) => {
  if (!reviews?.length) return <Typography>No reviews yet.</Typography>;
  return (
    <Box sx={{display:'grid', gap:1}}>
      {reviews.map((r, idx) => (
        <Card key={idx}><CardContent>
          <Rating readOnly value={r.rating} max={5}/>
          {r.comment && <Typography sx={{mt:1}}>{r.comment}</Typography>}
          <Typography variant="caption" color="text.secondary">{r.username || r.user || ""}</Typography>
        </CardContent></Card>
      ))}
    </Box>
  )
}
export default ReviewList;
