import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Send,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { submitRating, fetchMyRequests } from "../../store/slices/requestsSlice";
import { addToast } from "../../store/slices/uiSlice";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const Feedback: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myRequests, isLoading } = useAppSelector((state) => state.requests);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"positive" | "issue" | null>(null);

  useEffect(() => {
    dispatch(fetchMyRequests({ status: "delivered" }));
  }, [dispatch]);

  const completedRequests = myRequests.filter(
    (r: any) => r.status === "delivered" && !r.receiverRating
  );

  const handleSubmitRating = async () => {
    if (!selectedRequest || !rating) {
      dispatch(
        addToast({
          type: "error",
          title: "Please select a rating",
        })
      );
      return;
    }

    const result = await dispatch(
      submitRating({
        requestId: selectedRequest,
        rating,
        feedback,
      })
    );

    if (submitRating.fulfilled.match(result)) {
      dispatch(
        addToast({
          type: "success",
          title: "Feedback submitted!",
          message: "Thank you for your feedback",
        })
      );
      setSelectedRequest(null);
      setRating(0);
      setFeedback("");
      setFeedbackType(null);
    }
  };

  const quickFeedback = [
    { label: "Great food quality", icon: ThumbsUp },
    { label: "Easy pickup", icon: ThumbsUp },
    { label: "Friendly donor", icon: ThumbsUp },
    { label: "Food was not as described", icon: AlertTriangle },
    { label: "Pickup location unclear", icon: AlertTriangle },
    { label: "Donor was unavailable", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold mb-2">Feedback</h1>
        <p className="text-green-100">
          Help improve the community with your feedback
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-6">
        {/* Pending Reviews */}
        {completedRequests.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Pending Reviews ({completedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedRequests.map((request: any) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedRequest === request._id
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedRequest(request._id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {request.donationId?.foodName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.donationId?.donorId?.name}
                      </p>
                    </div>
                    {selectedRequest === request._id && (
                      <span className="text-green-600 text-sm">Selected</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Rating Section */}
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Rate Your Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <p className="text-center text-gray-500">
                  {rating === 0 && "Tap to rate"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent!"}
                </p>

                {/* Feedback Type Selection */}
                <div className="flex gap-3">
                  <button
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      feedbackType === "positive"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setFeedbackType("positive")}
                  >
                    <ThumbsUp
                      className={`w-6 h-6 mx-auto mb-2 ${
                        feedbackType === "positive"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="text-sm font-medium">Positive</p>
                  </button>
                  <button
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      feedbackType === "issue"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setFeedbackType("issue")}
                  >
                    <AlertTriangle
                      className={`w-6 h-6 mx-auto mb-2 ${
                        feedbackType === "issue"
                          ? "text-orange-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p className="text-sm font-medium">Report Issue</p>
                  </button>
                </div>

                {/* Quick Feedback Options */}
                <div>
                  <p className="text-sm text-gray-500 mb-3">Quick feedback</p>
                  <div className="flex flex-wrap gap-2">
                    {quickFeedback
                      .filter((f) =>
                        feedbackType === "positive"
                          ? f.icon === ThumbsUp
                          : feedbackType === "issue"
                          ? f.icon === AlertTriangle
                          : true
                      )
                      .map((item) => (
                        <button
                          key={item.label}
                          className={`px-3 py-2 rounded-full text-sm transition-all ${
                            feedback.includes(item.label)
                              ? "bg-green-100 text-green-700 border-2 border-green-500"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          onClick={() =>
                            setFeedback(
                              feedback.includes(item.label)
                                ? feedback.replace(item.label + ". ", "")
                                : feedback + item.label + ". "
                            )
                          }
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Additional comments (optional)
                  </p>
                  <textarea
                    className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Share your experience..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                  onClick={handleSubmitRating}
                  disabled={!rating || isLoading}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tips Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Why Feedback Matters</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your feedback helps donors improve their listings and helps us
                  maintain quality standards across the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Feedback;
