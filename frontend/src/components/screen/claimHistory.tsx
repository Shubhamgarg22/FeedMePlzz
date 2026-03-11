import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  MapPin,
  Star,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchMyRequests } from "../../store/slices/requestsSlice";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

const ClaimHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myRequests, isLoading } = useAppSelector((state) => state.requests);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchMyRequests({}));
  }, [dispatch]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          color: "bg-blue-100 text-blue-700",
          icon: Clock,
          label: "Accepted",
        };
      case "picked_up":
        return {
          color: "bg-purple-100 text-purple-700",
          icon: Package,
          label: "Picked Up",
        };
      case "delivered":
        return {
          color: "bg-green-100 text-green-700",
          icon: CheckCircle,
          label: "Delivered",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredRequests = myRequests.filter((request) => {
    const matchesSearch = request.donationId?.foodName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        ["accepted", "picked_up"].includes(request.status)) ||
      (activeTab === "completed" && request.status === "delivered");

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: myRequests.length,
    active: myRequests.filter((r: any) =>
      ["accepted", "picked_up"].includes(r.status)
    ).length,
    completed: myRequests.filter((r: any) => r.status === "delivered").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold mb-2">Claim History</h1>
        <p className="text-green-100">Track all your food rescue pickups</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4 mb-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search pickups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          {[
            { key: "all", label: `All (${stats.total})` },
            { key: "active", label: `Active (${stats.active})` },
            { key: "completed", label: `Done (${stats.completed})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-green-600 shadow"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))
        ) : filteredRequests.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pickups found</p>
              <p className="text-sm text-gray-400 mt-1">
                Start accepting donations to see your history
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((request: any, index: number) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-0">
                      <div className="flex">
                        {request.donationId?.imageUrl && (
                          <div className="w-24 h-full min-h-[100px]">
                            <img
                              src={request.donationId.imageUrl}
                              alt={request.donationId.foodName}
                              className="w-full h-full object-cover rounded-l-xl"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-gray-800">
                                {request.donationId?.foodName || "Food Pickup"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {request.donationId?.donorId?.name || "Anonymous Donor"}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(request.acceptedAt || request.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {request.donationId?.quantity}{" "}
                              {request.donationId?.quantityUnit}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {request.donationId?.pickupLocation?.address?.substring(
                                0,
                                40
                              )}
                              ...
                            </span>
                          </div>

                          {request.status === "delivered" && request.donorRating && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">
                                {request.donorRating}/5
                              </span>
                              <span className="text-xs text-gray-500">
                                from donor
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ClaimHistory;
