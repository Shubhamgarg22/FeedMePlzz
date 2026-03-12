import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Save,
  Loader2,
  Package,
  Star,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateUserProfile } from "../../store/slices/authSlice";
import { addToast } from "../../store/slices/uiSlice";
import { Card, CardContent } from "../../components/ui/card";

const ReceiverProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

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
        })
      ).unwrap();
      dispatch(addToast({ type: "success", title: "Profile updated" }));
      setIsEditing(false);
    } catch {
      dispatch(addToast({ type: "error", title: "Failed to update profile" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.name}</h1>
            <p className="text-orange-100 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <Package className="w-5 h-5 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold text-gray-800">
              {user?.totalPickups || 0}
            </p>
            <p className="text-xs text-gray-400">Claims</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <Star className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-gray-800">
              {user?.rating?.toFixed(1) || "N/A"}
            </p>
            <p className="text-xs text-gray-400">Rating</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="px-4 mt-4 space-y-3">
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Personal Information
              </h2>
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isLoading}
                className="text-sm font-medium text-orange-600"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm opacity-60"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
                />
                <input
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
                />
              </div>
              <input
                name="zipCode"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-60"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceiverProfile;
