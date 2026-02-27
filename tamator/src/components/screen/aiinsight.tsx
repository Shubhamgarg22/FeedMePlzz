import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Clock,
  MapPin,
  Award,
  Leaf,
  Users,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchMyRequests } from "../../store/slices/requestsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const AIInsight: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myRequests } = useAppSelector((state) => state.requests);

  useEffect(() => {
    dispatch(fetchMyRequests({}));
  }, [dispatch]);

  const completedCount = myRequests.filter((r: any) => r.status === "delivered").length;
  const totalMeals = myRequests.reduce(
    (sum, r: any) => sum + (r.donationId?.quantity || 0),
    0
  );
  const co2Saved = totalMeals * 2.5;

  const insights = [
    {
      title: "Peak Activity Times",
      description:
        "Based on your pickup history, most donations are available between 2 PM - 6 PM. Plan your routes accordingly!",
      icon: Clock,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Optimal Routes",
      description:
        "Picking up donations in clusters can save up to 30% of travel time. Try accepting nearby donations together.",
      icon: MapPin,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Popular Food Types",
      description:
        "Bakery items and cooked meals have the shortest pickup windows. Prioritize these for faster turnaround.",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const achievements = [
    {
      title: "First Pickup",
      description: "Completed your first food rescue!",
      earned: completedCount >= 1,
      icon: Award,
    },
    {
      title: "Eco Warrior",
      description: "Saved 10kg of CO2 emissions",
      earned: co2Saved >= 10,
      icon: Leaf,
    },
    {
      title: "Community Hero",
      description: "Rescued 50+ meals",
      earned: totalMeals >= 50,
      icon: Users,
    },
    {
      title: "Consistent Volunteer",
      description: "Completed 10 deliveries",
      earned: completedCount >= 10,
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h1 className="text-2xl font-bold">AI Insights</h1>
        </div>
        <p className="text-purple-100">
          Personalized analytics to maximize your impact
        </p>
      </div>

      {/* Impact Stats */}
      <div className="px-4 -mt-4 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Your Impact</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-3xl font-bold text-blue-600">
                  {completedCount}
                </div>
                <p className="text-sm text-gray-500">Deliveries</p>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-3xl font-bold text-green-600">
                  {totalMeals}
                </div>
                <p className="text-sm text-gray-500">Meals Rescued</p>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-3xl font-bold text-emerald-600">
                  {co2Saved.toFixed(1)}kg
                </div>
                <p className="text-sm text-gray-500">CO₂ Saved</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Smart Recommendations
        </h3>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${insight.color}`}
                    >
                      <insight.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`border-0 shadow-md ${
                  achievement.earned ? "bg-gradient-to-br from-yellow-50 to-amber-50" : ""
                }`}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      achievement.earned
                        ? "bg-yellow-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <achievement.icon
                      className={`w-6 h-6 ${
                        achievement.earned ? "text-yellow-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <h4
                    className={`font-bold ${
                      achievement.earned ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.description}
                  </p>
                  {achievement.earned && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      ✓ Earned
                    </span>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="px-4 mt-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Weekly Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Active Days</span>
                <span className="font-bold">5 / 7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Avg Response Time</span>
                <span className="font-bold">8 mins</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-100">Rating</span>
                <span className="font-bold">{user?.rating?.toFixed(1) || "5.0"} ⭐</span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-sm text-indigo-100">
                  Great work! You're in the top 10% of volunteers this week. 🎉
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsight;
