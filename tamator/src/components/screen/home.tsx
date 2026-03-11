import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Package,
  Navigation,
  Phone,
  AlertCircle,
  Filter,
  RefreshCw,
  CheckCircle,
  Map,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchNearbyDonations,
  fetchAvailableDonations,
  setFilters,
} from "../../store/slices/donationsSlice";
import {
  acceptDonation,
  updateRequestStatus,
  fetchMyRequests,
} from "../../store/slices/requestsSlice";
import { addToast, setCurrentLocation } from "../../store/slices/uiSlice";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { nearbyDonations, availableDonations, isLoading, filters } =
    useAppSelector((state) => state.donations);
  const { activeRequest, myRequests } = useAppSelector((state) => state.requests);
  const { currentLocation } = useAppSelector((state) => state.ui);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setCurrentLocation({ lat: latitude, lng: longitude }));
          dispatch(
            fetchNearbyDonations({ lat: latitude, lng: longitude, radius: filters.distance })
          );
        },
        (error) => {
          dispatch(
            addToast({
              type: "warning",
              title: "Location access denied",
              message: "Enable location for nearby donations",
            })
          );
          dispatch(fetchAvailableDonations({}));
        }
      );
    }

    // Fetch active requests
    dispatch(fetchMyRequests({ status: "accepted,picked_up" }));
  }, [dispatch, filters.distance]);

  const handleAcceptDonation = async (donation: any) => {
    const result = await dispatch(acceptDonation({ donationId: donation._id }));
    if (acceptDonation.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Donation Accepted!",
          message: "Navigate to pickup location",
        })
      );
      setSelectedDonation(null);
      setShowBottomSheet(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!activeRequest) return;
    
    const result = await dispatch(
      updateRequestStatus({ requestId: activeRequest._id, status })
    );
    
    if (updateRequestStatus.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title:
            status === "picked_up" ? "Pickup Confirmed!" : "Delivery Complete!",
        })
      );
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return "N/A";
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const donations = currentLocation ? nearbyDonations : availableDonations;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(" ")[0] || "Receiver"}!</h1>
            <p className="text-green-100 text-sm">
              {myRequests.filter((r) => r.status === "delivered").length} deliveries completed
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => {
              if (currentLocation) {
                dispatch(
                  fetchNearbyDonations({
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    radius: filters.distance,
                  })
                );
              } else {
                dispatch(fetchAvailableDonations({}));
              }
            }}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-green-100">
          <MapPin className="w-4 h-4" />
          <span>
            {currentLocation
              ? "Showing nearby donations"
              : "Enable location for better results"}
          </span>
        </div>
      </div>

      {/* Active Request Banner */}
      <AnimatePresence>
        {activeRequest && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 -mt-4 mb-4"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-semibold">Active Pickup</span>
                  </div>
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs capitalize">
                    {activeRequest.status.replace("_", " ")}
                  </span>
                </div>

                <p className="font-bold mb-1">
                  {activeRequest.donationId?.foodName || "Food Pickup"}
                </p>
                <p className="text-sm text-blue-100 mb-3">
                  {activeRequest.donationId?.pickupLocation?.address}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${activeRequest.donationId?.pickupLocation?.lat},${activeRequest.donationId?.pickupLocation?.lng}`,
                        "_blank"
                      )
                    }
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Navigate
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-white/20 hover:bg-white/30"
                    onClick={() =>
                      window.open(
                        `tel:${activeRequest.donationId?.donorId?.phone}`
                      )
                    }
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-white/20">
                  {activeRequest.status === "accepted" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-white text-blue-600"
                      onClick={() => handleUpdateStatus("picked_up")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm Pickup
                    </Button>
                  )}
                  {activeRequest.status === "picked_up" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-white text-blue-600"
                      onClick={() => handleUpdateStatus("delivered")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          Available Donations ({donations.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-1" />
          Filter
        </Button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Distance</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      value={filters.distance}
                      onChange={(e) =>
                        dispatch(setFilters({ distance: Number(e.target.value) }))
                      }
                    >
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={20}>20 km</option>
                      <option value={50}>50 km</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Food Type</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      value={filters.foodType}
                      onChange={(e) =>
                        dispatch(setFilters({ foodType: e.target.value }))
                      }
                    >
                      <option value="all">All Types</option>
                      <option value="cooked">Cooked</option>
                      <option value="packaged">Packaged</option>
                      <option value="fresh_produce">Fresh Produce</option>
                      <option value="bakery">Bakery</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.vegetarianOnly}
                      onChange={(e) =>
                        dispatch(setFilters({ vegetarianOnly: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Vegetarian Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.veganOnly}
                      onChange={(e) =>
                        dispatch(setFilters({ veganOnly: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Vegan Only</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donations List */}
      <div className="px-4 pb-24 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))
        ) : donations.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No donations available nearby</p>
              <p className="text-sm text-gray-400 mt-1">
                Try expanding your search radius
              </p>
            </CardContent>
          </Card>
        ) : (
          donations.map((donation: any, index: number) => (
            <motion.div
              key={donation._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedDonation(donation);
                  setShowBottomSheet(true);
                }}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {donation.imageUrl && (
                      <div className="w-28 h-full min-h-[120px]">
                        <img
                          src={donation.imageUrl}
                          alt={donation.foodName}
                          className="w-full h-full object-cover rounded-l-xl"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {donation.foodName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {donation.donorId?.organizationName ||
                              donation.donorId?.name}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {formatDistance(donation.distance)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs capitalize">
                          {donation.foodType?.replace("_", " ")}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {donation.quantity} {donation.quantityUnit}
                        </span>
                        {donation.isVegetarian && (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                            🌱 Veg
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Pickup by {formatTime(donation.pickupEndTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {showBottomSheet && selectedDonation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowBottomSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

                {selectedDonation.imageUrl && (
                  <img
                    src={selectedDonation.imageUrl}
                    alt={selectedDonation.foodName}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                )}

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedDonation.foodName}
                </h2>

                <p className="text-gray-600 mb-4">
                  {selectedDonation.description || "No description provided"}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-bold">
                      {selectedDonation.quantity} {selectedDonation.quantityUnit}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-bold">
                      {formatDistance(selectedDonation.distance)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Pickup Window</p>
                    <p className="font-bold">
                      {formatTime(selectedDonation.pickupStartTime)} -{" "}
                      {formatTime(selectedDonation.pickupEndTime)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Donor</p>
                    <p className="font-bold">
                      {selectedDonation.donorId?.name}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Pickup Location</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      {selectedDonation.pickupLocation?.address}
                    </span>
                  </div>
                </div>

                {selectedDonation.allergens?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Contains Allergens
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDonation.allergens.map((a: string) => (
                        <span
                          key={a}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedDonation.pickupLocation?.lat},${selectedDonation.pickupLocation?.lng}`,
                        "_blank"
                      )
                    }
                  >
                    <Map className="w-5 h-5 mr-2" />
                    View Map
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    onClick={() => handleAcceptDonation(selectedDonation)}
                    disabled={!!activeRequest || isLoading}
                  >
                    {activeRequest
                      ? "Complete Current Pickup"
                      : "Accept & Navigate"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
