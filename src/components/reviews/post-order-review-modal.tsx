

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
import { submitRestaurantReview } from "@/lib/api";
import { User, ReviewPayload } from "@/lib/types";

interface PostOrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantId: string;
}

const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

   useEffect(() => {
    if (isOpen) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }
  }, [isOpen]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmitReview = async () => {
     if (!user) {
        toast({
            title: "Not Logged In",
            description: "You must be logged in to submit a review.",
            variant: "destructive",
        });
        return;
    }
    
    if (rating === 0) {
        toast({
            title: "Rating Required",
            description: "Please select a star rating before submitting.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReviewPayload = {
        restaurant: restaurantId,
        user: user.id,
        rating: rating,
        comment: comment,
      };

      await submitRestaurantReview(restaurantId, payload);

      toast({
        title: "Review Submitted!",
        description: `Thank you for reviewing ${restaurantName}.`,
      });
      
      onClose();

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit review.";
        toast({
            title: "Submission Failed",
            description: message,
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


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
          <Button onClick={handleSubmitReview} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
