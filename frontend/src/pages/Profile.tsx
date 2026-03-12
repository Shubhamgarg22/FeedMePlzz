import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Camera,
  Save,
  Loader2,
  Package,
  Star,
  Award,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, updateUserProfile } from "../store/slices/authSlice";
import { addToast } from "../store/slices/uiSlice";
import { Card, CardContent } from "../components/ui/card";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { myRequests } = useAppSelector((state) => state.requests);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    organizationName: user?.organizationName || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    zipCode: user?.address?.zipCode || "",
  });

  const totalClaims = myRequests.length;
  const activeClaims = myRequests.filter((r: any) =>
    ["accepted", "picked_up"].includes(r.status)
  ).length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await dispatch(
        updateUserProfile({
          name: formData.name,
          phone: formData.phone,
          organizationName: formData.organizationName,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
        } as any)
      ).unwrap();
      dispatch(
        addToast({ type: "success", title: "Profile updated successfully!" })
      );
      setIsEditing(false);
    } catch {
      dispatch(
        addToast({ type: "error", title: "Failed to update profile" })
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 pt-12 pb-20">
        <h1 className="text-xl font-bold mb-0.5">Profile</h1>
        <p className="text-orange-100 text-sm">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-12 mb-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || "R"
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {user?.name || "Receiver"}
                </h2>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email || ""}
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
                <Package className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <div className="text-2xl font-bold text-orange-500">
                  {totalClaims}
                </div>
                <p className="text-xs text-gray-500">Claims</p>
              </div>
              <div className="text-center">
                <Star className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div className="text-2xl font-bold text-blue-500">
                  {activeClaims}
                </div>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="text-center">
                <Award className="w-5 h-5 mx-auto text-purple-500 mb-1" />
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

      {/* Personal Information */}
      <div className="px-4 space-y-3">
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Personal Information
              </h2>
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isLoading}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <span className="flex items-center gap-1">
                    <Save className="w-3.5 h-3.5" /> Save
                  </span>
                ) : (
                  "Edit"
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" /> Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3" /> Organization
                </label>
                <input
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Organization name (optional)"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Address
            </h2>
            <div className="space-y-3">
              <input
                name="street"
                placeholder="Street"
                value={formData.street}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <input
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              <input
                name="zipCode"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        {[
          {
            icon: Bell,
            label: "Notifications",
            description: "Manage notification preferences",
            color: "bg-yellow-100 text-yellow-600",
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
        ].map((item) => (
          <Card
            key={item.label}
            className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
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
        ))}

        {/* Logout Button */}
        <Card
          className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
      </div>

      {/* App Version */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Food Share v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sign Out?
              </h3>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
