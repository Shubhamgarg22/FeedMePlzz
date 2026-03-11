import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  Package,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../store/slices/notificationsSlice";
import Layout from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const Notifications: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications, isLoading, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({}));
  }, [dispatch]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "donation_accepted":
        return { icon: Package, color: "bg-blue-100 text-blue-600" };
      case "donation_picked_up":
        return { icon: Package, color: "bg-purple-100 text-purple-600" };
      case "donation_delivered":
        return { icon: Check, color: "bg-green-100 text-green-600" };
      case "donation_expired":
        return { icon: AlertCircle, color: "bg-red-100 text-red-600" };
      case "new_rating":
        return { icon: User, color: "bg-yellow-100 text-yellow-600" };
      default:
        return { icon: Bell, color: "bg-gray-100 text-gray-600" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNotification(id));
  };

  return (
    <Layout title="Notifications">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notifications`
                      : "All caught up!"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </Button>
              )}
            </CardHeader>
          </Card>
        </motion.div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">
                You'll be notified when receivers accept your donations
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {notifications.map((notification, index) => {
                const iconConfig = getNotificationIcon(notification.type);
                const IconComponent = iconConfig.icon;

                return (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                        !notification.isRead
                          ? "bg-green-50/50 border-l-4 border-l-green-500"
                          : ""
                      }`}
                      onClick={() =>
                        !notification.isRead && handleMarkAsRead(notification._id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-xl ${iconConfig.color}`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p
                                  className={`font-medium ${
                                    !notification.isRead
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notification._id);
                                    }}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notification._id);
                                  }}
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
      </div>
    </Layout>
  );
};

export default Notifications;
