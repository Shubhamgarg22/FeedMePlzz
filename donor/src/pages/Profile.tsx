import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Camera,
  Save,
  Loader2,
  Award,
  Package,
  Star,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateUserProfile } from "../store/slices/authSlice";
import { addToast } from "../store/slices/uiSlice";
import { uploadProfileImage } from "../services/storage";
import Layout from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    organizationName: user?.organizationName || "",
    organizationType: user?.organizationType || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    zipCode: user?.address?.zipCode || "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const organizationTypes = [
    { value: "restaurant", label: "Restaurant" },
    { value: "event", label: "Event/Catering" },
    { value: "individual", label: "Individual" },
    { value: "ngo", label: "NGO/Charity" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadProfileImage(file, user.id);
      await dispatch(updateUserProfile({ profileImage: imageUrl }));
      dispatch(
        addToast({
          type: "success",
          title: "Profile photo updated",
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          type: "error",
          title: "Failed to upload image",
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await dispatch(
      updateUserProfile({
        name: formData.name,
        phone: formData.phone,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
      })
    );

    if (updateUserProfile.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Profile updated successfully",
        })
      );
      setIsEditing(false);
    }
  };

  const stats = [
    {
      label: "Total Donations",
      value: user?.totalDonations || 0,
      icon: Package,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Meals Shared",
      value: (user?.totalDonations || 0) * 10,
      icon: Award,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Rating",
      value: user?.rating?.toFixed(1) || "5.0",
      icon: Star,
      color: "text-yellow-600 bg-yellow-100",
    },
  ];

  return (
    <Layout title="Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <CardContent className="relative pt-0 pb-6">
              {/* Avatar */}
              <div className="absolute -top-16 left-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-gray-600" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* User Info */}
              <div className="ml-40 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {user?.name}
                    </h1>
                    <p className="text-gray-500">{user?.email}</p>
                    {user?.organizationName && (
                      <p className="text-green-600 font-medium mt-1">
                        {user.organizationName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.isVerified ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        Pending Verification
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input value={user?.email || ""} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organization Name
                    </Label>
                    <Input
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Organization Type</Label>
                    <Select
                      value={formData.organizationType}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, organizationType: value }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address */}
                <div className="pt-4 border-t">
                  <Label className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm text-gray-500">Street Address</Label>
                      <Input
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">City</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">State</Label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">ZIP Code</Label>
                      <Input
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
