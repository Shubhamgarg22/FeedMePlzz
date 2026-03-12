import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Package,
  Phone,
  RefreshCw,
  Filter,
  Search,
  X,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchDonations, setFilters } from "../../store/slices/donationsSlice";
import { acceptDonation } from "../../store/slices/requestsSlice";
import { addToast, setCurrentLocation } from "../../store/slices/uiSlice";
import { Card, CardContent } from "../../components/ui/card";

const getUnitLabel = (unit: string) =>
  ({
    meals: "Meals",
    kg: "Kg",
    items: "Items",
    servings: "Servings",
    boxes: "Boxes",
    pieces: "Pieces",
    packets: "Packets",
    plates: "Plates",
  } as Record<string, string>)[unit] || unit;

const BrowseFood: React.FC = () => {
  const dispatch = useAppDispatch();
  const { donations, isLoading, filters } = useAppSelector(
    (state) => state.donations
  );
  const { currentLocation } = useAppSelector((state) => state.ui);

  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [claiming, setClaiming] = useState(false);

  const distance = filters.distance || 10;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          dispatch(setCurrentLocation({ lat: latitude, lng: longitude }));
          dispatch(
            fetchDonations({
              status: "available",
              lat: latitude,
              lng: longitude,
              radius: distance,
            })
          );
        },
        () => {
          dispatch(fetchDonations({ status: "available" }));
        }
      );
    } else {
      dispatch(fetchDonations({ status: "available" }));
    }
  }, [dispatch, distance]);

  const handleRefresh = () => {
    if (currentLocation) {
      dispatch(
        fetchDonations({
          status: "available",
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius: distance,
        })
      );
    } else {
      dispatch(fetchDonations({ status: "available" }));
    }
  };

  const handleClaim = async (donation: any) => {
    setClaiming(true);
    const result = await dispatch(acceptDonation({ donationId: donation._id }));
    setClaiming(false);
    if (acceptDonation.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Claimed!",
          message:
            "You've claimed this donation. Contact the donor to arrange pickup.",
        })
      );
      setSelectedDonation(null);
      handleRefresh();
    } else {
      dispatch(
        addToast({
          type: "error",
          title: "Failed",
          message:
            (result.payload as string) || "Could not claim this donation",
        })
      );
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHrs > 0 && diffHrs < 24) return `${diffHrs}h left`;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredDonations = donations.filter((d: any) => {
    if (
      searchTerm &&
      !d.foodName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filters.foodType !== "all" && d.foodType !== filters.foodType)
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Available Food</h1>
            <p className="text-orange-100 text-sm mt-0.5">
              {filteredDonations.length} donation
              {filteredDonations.length !== 1 ? "s" : ""} near you
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
          <input
            type="text"
            placeholder="Search food..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-orange-200 text-sm focus:outline-none focus:bg-white/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-orange-200" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${
            showFilters
              ? "bg-orange-50 border-orange-300 text-orange-700"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </button>
        {["all", "cooked", "packaged", "fresh_produce", "bakery"].map(
          (type) => (
            <button
              key={type}
              onClick={() => dispatch(setFilters({ foodType: type }))}
              className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${
                filters.foodType === type
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {type === "all"
                ? "All"
                : type === "fresh_produce"
                ? "Fresh"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="px-4 pb-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Distance:</span>
              <select
                value={distance}
                onChange={(e) =>
                  dispatch(setFilters({ distance: Number(e.target.value) } as any))
                }
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Donation Cards */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse" />
          ))
        ) : filteredDonations.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">
              No food available right now
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Pull to refresh or try different filters
            </p>
          </div>
        ) : (
          filteredDonations.map((donation: any) => (
            <Card
              key={donation._id}
              className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => setSelectedDonation(donation)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {donation.imageUrl && (
                    <div className="w-28 min-h-[120px] flex-shrink-0">
                      <img
                        src={donation.imageUrl}
                        alt={donation.foodName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {donation.foodName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          by{" "}
                          {donation.donorId?.organizationName ||
                            donation.donorId?.name ||
                            "Anonymous"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                        {donation.quantity}{" "}
                        {getUnitLabel(donation.quantityUnit)}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs capitalize">
                        {donation.foodType?.replace("_", " ")}
                      </span>
                      {donation.isVegetarian && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
                          🌱 Veg
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {donation.pickupLocation?.address && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {donation.pickupLocation.address.substring(0, 25)}
                        </span>
                      )}
                      {donation.expiryTime && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTime(donation.expiryTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Donation Detail Bottom Sheet */}
      {selectedDonation && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedDonation(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-5">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {selectedDonation.imageUrl && (
                <img
                  src={selectedDonation.imageUrl}
                  alt={selectedDonation.foodName}
                  className="w-full h-44 object-cover rounded-xl mb-4"
                />
              )}

              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedDonation.foodName}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Donated by{" "}
                {selectedDonation.donorId?.organizationName ||
                  selectedDonation.donorId?.name ||
                  "Anonymous"}
              </p>

              {selectedDonation.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {selectedDonation.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Quantity</p>
                  <p className="font-semibold text-gray-800">
                    {selectedDonation.quantity}{" "}
                    {getUnitLabel(selectedDonation.quantityUnit)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Type</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {selectedDonation.foodType?.replace("_", " ")}
                  </p>
                </div>
                {selectedDonation.expiryTime && (
                  <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Best Before</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(selectedDonation.expiryTime).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                )}
              </div>

              {selectedDonation.pickupLocation?.address && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {selectedDonation.pickupLocation.address}
                  </p>
                </div>
              )}

              {selectedDonation.allergens?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1.5">
                    ⚠️ Contains allergens
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDonation.allergens.map((a: string) => (
                      <span
                        key={a}
                        className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedDonation.specialInstructions && (
                <div className="p-3 bg-yellow-50 rounded-xl mb-4">
                  <p className="text-xs text-yellow-600 font-medium mb-0.5">
                    Instructions
                  </p>
                  <p className="text-sm text-yellow-800">
                    {selectedDonation.specialInstructions}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedDonation.donorId?.phone && (
                  <a
                    href={`tel:${selectedDonation.donorId.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50"
                  >
                    <Phone className="w-4 h-4" />
                    Call Donor
                  </a>
                )}
                <button
                  onClick={() => handleClaim(selectedDonation)}
                  disabled={claiming}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {claiming ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {claiming ? "Claiming..." : "Claim This Food"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BrowseFood;
