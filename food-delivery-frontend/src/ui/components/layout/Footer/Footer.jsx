import * as React from "react";
import {
    Box,
    Container,
    Grid,
    Stack,
    Typography,
    Link as MUILink,
    IconButton,
    Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <Box component="footer" sx={{ mt: 6, bgcolor: "background.paper", color: "text.secondary" }}>
            {/* thin orange accent to echo the AppBar primary color */}
            <Box sx={{ height: 2, bgcolor: "primary.main" }} />

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }} justifyContent="space-evenly">
                <Grid container spacing={3} alignItems="flex-start">
                    {/* Brand + short blurb + socials */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                            Ana2AnaFoodDelivery
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                            Fast & fresh delivery from local favorites.
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" aria-label="Facebook" color="inherit">
                                <FacebookIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" aria-label="Instagram" color="inherit">
                                <InstagramIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" aria-label="Twitter" color="inherit">
                                <TwitterIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Grid>

                    {/* Links */}
                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" sx={{ color: "text.primary", mb: 1 }}>
                            Company
                        </Typography>
                        <Stack spacing={0.5}>
                            <MUILink component={RouterLink} to="/about" color="inherit" underline="hover" variant="body2">
                                About
                            </MUILink>
                            <MUILink component={RouterLink} to="/careers" color="inherit" underline="hover" variant="body2">
                                Careers
                            </MUILink>
                            <MUILink component={RouterLink} to="/press" color="inherit" underline="hover" variant="body2">
                                Press
                            </MUILink>
                            <MUILink component={RouterLink} to="/blog" color="inherit" underline="hover" variant="body2">
                                Blog
                            </MUILink>
                        </Stack>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" sx={{ color: "text.primary", mb: 1 }}>
                            Support
                        </Typography>
                        <Stack spacing={0.5}>
                            <MUILink component={RouterLink} to="/help" color="inherit" underline="hover" variant="body2">
                                Help Center
                            </MUILink>
                            <MUILink component={RouterLink} to="/contact" color="inherit" underline="hover" variant="body2">
                                Contact
                            </MUILink>
                            <MUILink component={RouterLink} to="/faq" color="inherit" underline="hover" variant="body2">
                                FAQs
                            </MUILink>
                            <MUILink component={RouterLink} to="/partner" color="inherit" underline="hover" variant="body2">
                                Become a Partner
                            </MUILink>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Bottom bar */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-evenly"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                >
                    <Typography variant="caption">
                        © {year} Ana2AnaFoodDelivery, Inc. · 1234 Market Street, Skopje, North Macedonia
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <MUILink component={RouterLink} to="/privacy" color="inherit" underline="hover" variant="caption">
                            Privacy
                        </MUILink>
                        <MUILink component={RouterLink} to="/terms" color="inherit" underline="hover" variant="caption">
                            Terms
                        </MUILink>
                        <MUILink component={RouterLink} to="/cookies" color="inherit" underline="hover" variant="caption">
                            Cookies
                        </MUILink>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
