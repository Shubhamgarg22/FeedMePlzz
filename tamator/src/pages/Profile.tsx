import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Star,
  Award,
  Truck,
  Camera,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { Card, CardContent } from "../components/ui/card";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { myRequests } = useAppSelector((state) => state.requests);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const completedDeliveries = myRequests.filter(
    (r: any) => r.status === "delivered"
  ).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    {
      icon: User,
      label: "Edit Profile",
      description: "Update your personal information",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Manage notification preferences",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: Truck,
      label: "Vehicle Settings",
      description: "Update vehicle information",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      description: "Manage your account security",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: Settings,
      label: "App Settings",
      description: "Preferences and configurations",
      color: "bg-gray-100 text-gray-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 pt-12 pb-20">
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-green-100">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-12 mb-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "V"}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {user?.name || "Volunteer"}
                </h2>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email || "volunteer@example.com"}
                </p>
                {user?.phone && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedDeliveries}
                </div>
                <p className="text-xs text-gray-500">Deliveries</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  {user?.rating?.toFixed(1) || "5.0"}
                  <Star className="w-4 h-4 fill-yellow-600" />
                </div>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {user?.isVerified ? "✓" : "○"}
                </div>
                <p className="text-xs text-gray-500">
                  {user?.isVerified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badge */}
      <div className="px-4 mb-6">
        <Card className="border-0 shadow-md bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">
                  {completedDeliveries >= 10
                    ? "Food Hero"
                    : completedDeliveries >= 5
                    ? "Rising Star"
                    : "New Volunteer"}
                </h3>
                <p className="text-sm text-gray-600">
                  {completedDeliveries >= 10
                    ? "You've made a significant impact!"
                    : `${10 - completedDeliveries} more deliveries to next level`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.label}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-red-100"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-100 text-red-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-600">Sign Out</h4>
                  <p className="text-sm text-gray-500">
                    Log out of your account
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* App Version */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>FoodRescue Volunteer v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sign Out?</h3>
              <p className="text-gray-600">
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
