import React from 'react'
import { createRoutesFromElements, Route } from 'react-router'
import Layout from './ui/components/layout/Layout/Layout.jsx'
import HomePage from './ui/pages/HomePage/HomePage.jsx'
import ProductPage from './ui/pages/ProductPage/ProductPage.jsx'
import RestaurantPage from './ui/pages/RestaurantPage/RestaurantPage.jsx'
import CartPage from './ui/pages/CartPage/CartPage.jsx'
import LoginPage from './ui/pages/LoginPage/LoginPage.jsx'
import RegisterPage from './ui/pages/RegisterPage/RegisterPage.jsx'
import CheckoutPage from './ui/pages/CheckoutPage/CheckoutPage.jsx'
import TrackOrderPage from './ui/pages/TrackOrderPage/TrackOrderPage.jsx'
import ProtectedRoute from './ui/components/routing/ProtectedRoute/ProtectedRoute.jsx'
import ProfilePage from "./ui/pages/ProfilePage";
import MyOrdersPage from './ui/pages/MyOrdersPage/MyOrdersPage.jsx'
import ForgotPasswordPage from './ui/pages/ForgotPasswordPage.jsx'
import CourierDashboard from './ui/pages/Courier/CourierDashboard/CourierDashboard.jsx'
import RecommendationsPage from './ui/pages/RecommendationsPage.jsx'

// Admin pages
import AdminDashboard from './ui/pages/Admin/AdminDashboard/AdminDashboard.jsx'
import AdminUsers from './ui/pages/Admin/Users/AdminUsers.jsx'
import AdminRestaurants from './ui/pages/Admin/Restaurants/AdminRestaurants.jsx'
import AdminProducts from './ui/pages/Admin/Products/AdminProducts.jsx'

// Restaurant Owner pages
import OwnerDashboard from './ui/pages/RestaurantOwner/OwnerDashboard.jsx'

const App = () => null

App.routes = createRoutesFromElements(
    <Route element={<Layout/>}>
        {/* Public routes */}
        <Route index element={<HomePage/>}/>
        <Route path="/restaurants/:id" element={<RestaurantPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Customer routes */}
        <Route path="/products/:id" element={<ProductPage/>}/>
        <Route path="/cart" element={<ProtectedRoute role={"CUSTOMER"}/>}>
            <Route index element={<CartPage/>}/>
        </Route>
        <Route path="/checkout" element={<ProtectedRoute role={"CUSTOMER"}/>}>
            <Route index element={<CheckoutPage/>}/>
        </Route>
        <Route path="/orders/my-orders" element={<ProtectedRoute role={"CUSTOMER"}/>}>
            <Route index element={<MyOrdersPage/>}/>
        </Route>
        <Route path="orders/track/:orderId" element={<ProtectedRoute role={"CUSTOMER"}/>}>
            <Route index element={<TrackOrderPage/>}/>
        </Route>

        {/* Courier routes */}
        <Route path="/courier" element={<ProtectedRoute role={"COURIER"}/>}>
            <Route index element={<CourierDashboard/>}/>
        </Route>

        {/* Restaurant Owner routes */}
        <Route path="/owner" element={<ProtectedRoute role={"RESTAURANT_OWNER"}/>}>
            <Route index element={<OwnerDashboard/>}/>
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role={"ADMIN"}/>}>
            <Route index element={<AdminDashboard/>}/>
            <Route path="users" element={<AdminUsers/>}/>
            <Route path="restaurants" element={<AdminRestaurants/>}/>
            <Route path="products" element={<AdminProducts/>}/>
        </Route>

        {/* User routes */}
        <Route path="/user/me" element={<ProfilePage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
    </Route>
)

export default App
