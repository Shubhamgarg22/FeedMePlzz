import React, { useEffect, useState } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchMyRequests } from "../../store/slices/requestsSlice";
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

const MyClaims: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myRequests, isLoading } = useAppSelector((state) => state.requests);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchMyRequests({}));
  }, [dispatch]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          color: "bg-orange-100 text-orange-700",
          icon: Clock,
          label: "Claimed",
        };
      case "picked_up":
        return {
          color: "bg-blue-100 text-blue-700",
          icon: Package,
          label: "Picked Up",
        };
      case "delivered":
        return {
          color: "bg-green-100 text-green-700",
          icon: CheckCircle2,
          label: "Completed",
        };
      case "cancelled":
        return {
          color: "bg-red-100 text-red-700",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700",
          icon: Package,
          label: status,
        };
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const filteredRequests = myRequests.filter((request: any) => {
    const matchesSearch = request.donationId?.foodName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        ["accepted", "picked_up"].includes(request.status)) ||
      (activeTab === "completed" &&
        ["delivered", "cancelled"].includes(request.status));
    return matchesSearch !== false && matchesTab;
  });

  const stats = {
    total: myRequests.length,
    active: myRequests.filter((r: any) =>
      ["accepted", "picked_up"].includes(r.status)
    ).length,
    completed: myRequests.filter((r: any) =>
      ["delivered", "cancelled"].includes(r.status)
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 pt-12 pb-5">
        <h1 className="text-xl font-bold mb-0.5">My Claims</h1>
        <p className="text-orange-100 text-sm">{stats.total} total claims</p>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-3">
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-bold text-orange-500">{stats.active}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-bold text-green-500">
              {stats.completed}
            </p>
            <p className="text-xs text-gray-400">Done</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "completed", label: "Done" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 rounded-xl animate-pulse"
            />
          ))
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No claims yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Browse food and claim donations
            </p>
          </div>
        ) : (
          filteredRequests.map((request: any) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            return (
              <Card
                key={request._id}
                className="border border-gray-100 shadow-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {request.donationId?.imageUrl && (
                      <div className="w-24 min-h-[100px] flex-shrink-0">
                        <img
                          src={request.donationId.imageUrl}
                          alt={request.donationId.foodName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {request.donationId?.foodName || "Food"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {request.donationId?.donorId?.name || "Donor"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 flex-shrink-0 ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(
                            request.acceptedAt || request.createdAt
                          )}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Package className="w-3 h-3" />
                          {request.donationId?.quantity}{" "}
                          {getUnitLabel(
                            request.donationId?.quantityUnit || ""
                          )}
                        </span>
                      </div>

                      {request.donationId?.pickupLocation?.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {request.donationId.pickupLocation.address.substring(
                              0,
                              45
                            )}
                          </span>
                        </div>
                      )}

                      {request.status === "accepted" &&
                        request.donationId?.donorId?.phone && (
                          <a
                            href={`tel:${request.donationId.donorId.phone}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-orange-600 font-medium"
                          >
                            <Phone className="w-3 h-3" />
                            Contact Donor
                          </a>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyClaims;
