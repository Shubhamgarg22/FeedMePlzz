import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMyDonations, deleteDonation } from "../store/slices/donationsSlice";
import { addToast } from "../store/slices/uiSlice";
import Layout from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

const DonationHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myDonations, isLoading, pagination } = useAppSelector(
    (state) => state.donations
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    dispatch(
      fetchMyDonations({
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
    );
  }, [dispatch, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this donation?")) {
      const result = await dispatch(deleteDonation(id));
      if (deleteDonation.fulfilled.match(result)) {
        dispatch(
          addToast({
            type: "success",
            title: "Donation Deleted",
            message: "The donation has been removed successfully",
          })
        );
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: Clock,
          label: "Available",
        };
      case "accepted":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: CheckCircle2,
          label: "Accepted",
        };
      case "picked_up":
        return {
          color: "bg-purple-100 text-purple-700 border-purple-200",
          icon: Package,
          label: "Picked Up",
        };
      case "delivered":
        return {
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: XCircle,
          label: "Cancelled",
        };
      case "expired":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: XCircle,
          label: "Expired",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
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

  const filteredDonations = myDonations.filter((donation) => {
    const matchesSearch =
      donation.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        ["available", "accepted", "picked_up"].includes(donation.status)) ||
      (activeTab === "completed" && donation.status === "delivered") ||
      (activeTab === "cancelled" &&
        ["cancelled", "expired"].includes(donation.status));

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: myDonations.length,
    active: myDonations.filter((d) =>
      ["available", "accepted", "picked_up"].includes(d.status)
    ).length,
    completed: myDonations.filter((d) => d.status === "delivered").length,
    cancelled: myDonations.filter((d) =>
      ["cancelled", "expired"].includes(d.status)
    ).length,
  };

  return (
    <Layout title="My Donations">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "bg-blue-500" },
            { label: "Active", value: stats.active, color: "bg-green-500" },
            { label: "Completed", value: stats.completed, color: "bg-emerald-500" },
            { label: "Cancelled", value: stats.cancelled, color: "bg-gray-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-2 h-12 rounded-full ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search donations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-sm border">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({stats.cancelled})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDonations.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No donations found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "Start by creating your first donation"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {filteredDonations.map((donation, index) => {
                    const statusConfig = getStatusConfig(donation.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.div
                        key={donation._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                              {/* Image */}
                              {donation.imageUrl && (
                                <div className="md:w-48 h-32 md:h-auto">
                                  <img
                                    src={donation.imageUrl}
                                    alt={donation.foodName}
                                    className="w-full h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
                                  />
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-bold text-gray-800">
                                        {donation.foodName}
                                      </h3>
                                      <Badge
                                        className={`${statusConfig.color} border flex items-center gap-1`}
                                      >
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                      </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Package className="w-4 h-4" />
                                        {donation.quantity} {donation.quantityUnit}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(donation.createdAt)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {donation.pickupLocation.address.substring(
                                          0,
                                          30
                                        )}
                                        ...
                                      </span>
                                    </div>

                                    {donation.description && (
                                      <p className="text-gray-600 mt-2 line-clamp-2">
                                        {donation.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View
                                    </Button>
                                    {donation.status === "available" && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() =>
                                            handleDelete(donation._id)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <Button
                key={i + 1}
                variant={pagination.currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  dispatch(fetchMyDonations({ page: i + 1, status: statusFilter }))
                }
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DonationHistory;
