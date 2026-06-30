import { createBrowserRouter, Navigate } from "react-router-dom";
import RouteError from "@/components/route-error";
import Login from "@/pages/Login";
import Menu from "@/pages/Menu";
import VerifyOtp from "@/pages/VerifyOtp";
import Signup from "@/pages/signup/Signup";
import SignupRider from "@/pages/signup/SignupRider";
import SignupVendor from "@/pages/signup/SignupVendor";
import RiderSignup from "@/pages/rider/RiderSignup";
import RestaurantDetail from "@/pages/restaurants/RestaurantDetail";
import SecretLogin from "@/pages/secret/SecretLogin";
import NotFound from "@/pages/NotFound";
import RequireAuth from "@/components/auth/require-auth";

import CustomerLayout from "@/pages/customer/CustomerLayout";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerOrders from "@/pages/customer/Orders";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerSearch from "@/pages/customer/Search";
import CustomerRestaurantDetail from "@/pages/customer/RestaurantDetail";
import CustomerRestaurantList from "@/pages/customer/RestaurantListPage";

import VendorLayout from "@/pages/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorOrders from "@/pages/vendor/Orders";
import VendorAnalytics from "@/pages/vendor/Analytics";
import VendorConfig from "@/pages/vendor/Config";
import VendorPayouts from "@/pages/vendor/Payouts";
import VendorDiscounts from "@/pages/vendor/Discounts";
import VendorProfile from "@/pages/vendor/Profile";
import VendorSignup from "@/pages/vendor/Signup";

import RiderLayout from "@/pages/rider/RiderLayout";
import RiderDashboard from "@/pages/rider/Dashboard";
import RiderOrders from "@/pages/rider/Orders";
import RiderPayouts from "@/pages/rider/Payouts";
import RiderProfile from "@/pages/rider/Profile";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminConfig from "@/pages/admin/Config";
import AdminRiders from "@/pages/admin/Riders";
import AdminVendors from "@/pages/admin/Vendors";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  // Alias so the many `navigate("/login")` call sites (logout, OTP + partner
  // fallbacks) resolve to the login screen instead of the 404 page.
  { path: "/login", element: <Login /> },
  { path: "/menu", element: <Menu /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signup/rider", element: <SignupRider /> },
  { path: "/signup/vendor", element: <SignupVendor /> },
  { path: "/rider/signup", element: <RiderSignup /> },
  { path: "/restaurants/:restaurantId", element: <RestaurantDetail /> },
  { path: "/secret/non-accessible/to/customers/login", element: <SecretLogin /> },
  {
    path: "/customer",
    element: (
      <RequireAuth allow="customer">
        <CustomerLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <CustomerDashboard /> },
      { path: "orders", element: <CustomerOrders /> },
      { path: "profile", element: <CustomerProfile /> },
      { path: "search", element: <CustomerSearch /> },
      { path: "restaurants/:restaurantId", element: <CustomerRestaurantDetail /> },
      { path: "section/:type", element: <CustomerRestaurantList /> },
    ],
  },
  // Public vendor signup — self-contained page, must stay outside the guarded
  // /vendor group (it renders its own layout, not the vendor sidebar).
  { path: "/vendor/signup", element: <VendorSignup /> },
  {
    path: "/vendor",
    element: (
      <RequireAuth allow="restaurant">
        <VendorLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <VendorDashboard /> },
      { path: "orders", element: <VendorOrders /> },
      { path: "analytics", element: <VendorAnalytics /> },
      { path: "config", element: <VendorConfig /> },
      { path: "payouts", element: <VendorPayouts /> },
      { path: "discounts", element: <VendorDiscounts /> },
      { path: "profile", element: <VendorProfile /> },
    ],
  },
  {
    path: "/rider",
    element: (
      <RequireAuth allow="driver">
        <RiderLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <RiderDashboard /> },
      { path: "orders", element: <RiderOrders /> },
      { path: "payouts", element: <RiderPayouts /> },
      { path: "profile", element: <RiderProfile /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAuth allow="admin">
        <AdminLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "config", element: <AdminConfig /> },
      { path: "riders", element: <AdminRiders /> },
      { path: "vendors", element: <AdminVendors /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
