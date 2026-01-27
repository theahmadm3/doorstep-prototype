
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PostOrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantId: string;
}

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-8 w-8 cursor-pointer transition-colors",
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )}
          onClick={() => setRating(i + 1)}
        />
      ))}
    </div>
  );
};

export default function PostOrderReviewModal({
  isOpen,
  onClose,
  restaurantName,
  restaurantId,
}: PostOrderReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmitReview = () => {
    // This is a mock submission for now.
    // TODO: Replace with an API call to submit the review.
    console.log({
      restaurantId,
      rating,
      comment,
    });

    toast({
      title: "Review Submitted!",
      description: `Thank you for reviewing ${restaurantName}.`,
    });
    
    // Reset state and close
    setRating(0);
    setComment("");
    onClose();
  };

  // Reset state when modal is closed without submitting
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">How was your order from {restaurantName}?</DialogTitle>
          <DialogDescription>
            Your feedback helps us and other customers.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <StarRating rating={rating} setRating={setRating} />
          <Textarea
            placeholder="Tell us more about your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button onClick={handleSubmitReview} disabled={rating === 0}>
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
