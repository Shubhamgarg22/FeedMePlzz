import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  MapPin,
  Clock,
  Info,
  X,
  Loader2,
  CheckCircle,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createDonation } from "../store/slices/donationsSlice";
import { addToast } from "../store/slices/uiSlice";
import { uploadDonationImage, compressImage } from "../services/storage";
import Layout from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const DonationForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.donations);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    foodName: "",
    foodType: "",
    description: "",
    quantity: "",
    quantityUnit: "meals",
    expiryTime: "",
    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",
    pickupStartTime: "",
    pickupEndTime: "",
    specialInstructions: "",
    allergens: [] as string[],
    isVegetarian: false,
    isVegan: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const foodTypes = [
    { value: "cooked", label: "Cooked Food" },
    { value: "packaged", label: "Packaged Food" },
    { value: "fresh_produce", label: "Fresh Produce" },
    { value: "bakery", label: "Bakery Items" },
    { value: "dairy", label: "Dairy Products" },
    { value: "other", label: "Other" },
  ];

  const quantityUnits = [
    { value: "meals", label: "Meals" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "items", label: "Items" },
    { value: "servings", label: "Servings" },
    { value: "boxes", label: "Boxes" },
  ];

  const commonAllergens = [
    "Nuts",
    "Dairy",
    "Gluten",
    "Eggs",
    "Soy",
    "Shellfish",
    "Fish",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      dispatch(
        addToast({
          type: "error",
          title: "Invalid file type",
          message: "Please select an image file",
        })
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      dispatch(
        addToast({
          type: "error",
          title: "File too large",
          message: "Image must be less than 5MB",
        })
      );
      return;
    }

    // Compress image
    const compressedFile = await compressImage(file);
    setImageFile(compressedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(compressedFile);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      dispatch(
        addToast({
          type: "error",
          title: "Location not supported",
          message: "Geolocation is not supported by your browser",
        })
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          pickupLat: position.coords.latitude.toString(),
          pickupLng: position.coords.longitude.toString(),
        }));
        dispatch(
          addToast({
            type: "success",
            title: "Location detected",
            message: "Your location has been added",
          })
        );
      },
      (error) => {
        dispatch(
          addToast({
            type: "error",
            title: "Location error",
            message: "Unable to get your location",
          })
        );
      }
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.foodName.trim()) {
      newErrors.foodName = "Food name is required";
    }
    if (!formData.foodType) {
      newErrors.foodType = "Food type is required";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }
    if (!formData.expiryTime) {
      newErrors.expiryTime = "Expiry time is required";
    }
    if (!formData.pickupAddress.trim()) {
      newErrors.pickupAddress = "Pickup address is required";
    }
    if (!formData.pickupLat || !formData.pickupLng) {
      newErrors.pickupLat = "Location coordinates are required";
    }
    if (!formData.pickupStartTime) {
      newErrors.pickupStartTime = "Pickup start time is required";
    }
    if (!formData.pickupEndTime) {
      newErrors.pickupEndTime = "Pickup end time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      dispatch(
        addToast({
          type: "error",
          title: "Validation Error",
          message: "Please fill in all required fields",
        })
      );
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = "";

      // Upload image if present
      if (imageFile && user?.id) {
        imageUrl = await uploadDonationImage(imageFile, user.id);
      }

      // Create donation
      const result = await dispatch(
        createDonation({
          foodType: formData.foodType,
          foodName: formData.foodName,
          description: formData.description,
          quantity: parseFloat(formData.quantity),
          quantityUnit: formData.quantityUnit,
          expiryTime: formData.expiryTime,
          pickupLocation: {
            address: formData.pickupAddress,
            lat: parseFloat(formData.pickupLat),
            lng: parseFloat(formData.pickupLng),
          },
          pickupStartTime: formData.pickupStartTime,
          pickupEndTime: formData.pickupEndTime,
          imageUrl,
          specialInstructions: formData.specialInstructions,
          allergens: formData.allergens,
          isVegetarian: formData.isVegetarian,
          isVegan: formData.isVegan,
        })
      );

      if (createDonation.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: "success",
            title: "Donation Created!",
            message: "Your food donation has been listed successfully",
          })
        );
        navigate("/dashboard");
      }
    } catch (error) {
      dispatch(
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to create donation",
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout title="Add Donation">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Create Food Donation
            </CardTitle>
            <p className="text-gray-600">
              Share your surplus food with those in need
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-semibold">
                  Food Photo
                </Label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    imagePreview
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-sm text-gray-400">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ position: "relative", top: 0 }}
                  />
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="foodName" className="text-gray-700 font-semibold">
                    Food Name *
                  </Label>
                  <Input
                    id="foodName"
                    name="foodName"
                    placeholder="e.g., Fresh Vegetable Curry"
                    value={formData.foodName}
                    onChange={handleChange}
                    className={errors.foodName ? "border-red-500" : ""}
                  />
                  {errors.foodName && (
                    <p className="text-sm text-red-500">{errors.foodName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    Food Type *
                  </Label>
                  <Select
                    value={formData.foodType}
                    onValueChange={(value) =>
                      handleSelectChange("foodType", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.foodType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {foodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.foodType && (
                    <p className="text-sm text-red-500">{errors.foodType}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Description</Label>
                <Textarea
                  name="description"
                  placeholder="Describe the food items..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Quantity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Quantity *</Label>
                  <Input
                    type="number"
                    name="quantity"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500">{errors.quantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">Unit</Label>
                  <Select
                    value={formData.quantityUnit}
                    onValueChange={(value) =>
                      handleSelectChange("quantityUnit", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quantityUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expiry & Pickup Times */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expiry Time *
                  </Label>
                  <Input
                    type="datetime-local"
                    name="expiryTime"
                    value={formData.expiryTime}
                    onChange={handleChange}
                    className={errors.expiryTime ? "border-red-500" : ""}
                  />
                  {errors.expiryTime && (
                    <p className="text-sm text-red-500">{errors.expiryTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    Pickup Start *
                  </Label>
                  <Input
                    type="datetime-local"
                    name="pickupStartTime"
                    value={formData.pickupStartTime}
                    onChange={handleChange}
                    className={errors.pickupStartTime ? "border-red-500" : ""}
                  />
                  {errors.pickupStartTime && (
                    <p className="text-sm text-red-500">
                      {errors.pickupStartTime}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-semibold">
                    Pickup End *
                  </Label>
                  <Input
                    type="datetime-local"
                    name="pickupEndTime"
                    value={formData.pickupEndTime}
                    onChange={handleChange}
                    className={errors.pickupEndTime ? "border-red-500" : ""}
                  />
                  {errors.pickupEndTime && (
                    <p className="text-sm text-red-500">{errors.pickupEndTime}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 font-semibold">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Pickup Location *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    Use Current Location
                  </Button>
                </div>

                <Input
                  name="pickupAddress"
                  placeholder="Full pickup address"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  className={errors.pickupAddress ? "border-red-500" : ""}
                />
                {errors.pickupAddress && (
                  <p className="text-sm text-red-500">{errors.pickupAddress}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Latitude</Label>
                    <Input
                      name="pickupLat"
                      placeholder="Latitude"
                      value={formData.pickupLat}
                      onChange={handleChange}
                      className={errors.pickupLat ? "border-red-500" : ""}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Longitude</Label>
                    <Input
                      name="pickupLng"
                      placeholder="Longitude"
                      value={formData.pickupLng}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Dietary Info */}
              <div className="space-y-4">
                <Label className="text-gray-700 font-semibold">
                  Dietary Information
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVegetarian"
                      checked={formData.isVegetarian}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-gray-700">Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVegan"
                      checked={formData.isVegan}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-gray-700">Vegan</span>
                  </label>
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Contains Allergens
                </Label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergens.map((allergen) => (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => handleAllergenToggle(allergen)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.allergens.includes(allergen)
                          ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">
                  <Info className="w-4 h-4 inline mr-1" />
                  Special Instructions
                </Label>
                <Textarea
                  name="specialInstructions"
                  placeholder="Any special handling or pickup instructions..."
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isUploading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isLoading || isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Create Donation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default DonationForm;
