import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PlusCircle,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  Leaf,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMyDonations, fetchDonationStats } from "../store/slices/donationsSlice";
import Layout from "../components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myDonations, stats, isLoading } = useAppSelector((state) => state.donations);

  useEffect(() => {
    dispatch(fetchMyDonations({ limit: 5 }));
    dispatch(fetchDonationStats());
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-200";
      case "accepted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "picked_up":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const statCards = [
    {
      title: "Total Donations",
      value: stats?.totalDonations || 0,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Donations",
      value: stats?.availableDonations || 0,
      icon: Clock,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Completed",
      value: stats?.completedDonations || 0,
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Meals Donated",
      value: stats?.totalQuantity || 0,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 lg:p-8 text-white shadow-xl shadow-green-500/20"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-green-100 mt-2">
                Thank you for being part of the food rescue community.
              </p>
            </div>
            <Link to="/donate">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 shadow-lg"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Donation
              </Button>
            </Link>
          </div>

          {/* Impact Stats */}
          <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats?.totalQuantity || 0}</p>
              <p className="text-sm text-green-100">Meals Donated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {((stats?.totalQuantity || 0) * 2.5).toFixed(0)}
              </p>
              <p className="text-sm text-green-100">kg CO₂ Saved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats?.completedDonations || 0}</p>
              <p className="text-sm text-green-100">Successful Pickups</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {user?.rating?.toFixed(1) || "5.0"}
              </p>
              <p className="text-sm text-green-100">Donor Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">
                        {stat.title}
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    >
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Donations & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Donations */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  Recent Donations
                </CardTitle>
                <Link
                  to="/history"
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-gray-100 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : myDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No donations yet</p>
                    <Link to="/donate">
                      <Button className="mt-4" variant="outline">
                        Create Your First Donation
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myDonations.slice(0, 5).map((donation) => (
                      <motion.div
                        key={donation._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {donation.foodName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {donation.quantity} {donation.quantityUnit} •{" "}
                            {formatDate(donation.createdAt)}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusColor(donation.status)} border`}
                        >
                          {donation.status.replace("_", " ")}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/donate">
                  <Button className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Add New Donation
                  </Button>
                </Link>
                <Link to="/history">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-5 h-5 mr-2" />
                    View Donation History
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    View Impact Report
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Leaf className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Donation Tip
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Adding photos to your donations increases pickup rates by
                      40%! Make sure to capture your food items clearly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
