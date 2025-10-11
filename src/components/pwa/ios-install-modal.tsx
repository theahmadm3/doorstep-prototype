
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Doorstep on your iPhone</DialogTitle>
          <DialogDescription>
            To install the app, tap the Share icon and then "Add to Home Screen".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">Follow these simple steps:</p>
          <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
            <li>
              Tap the <span className="font-bold">Share</span> button in your browser's toolbar.
            </li>
            <li>
              Scroll down and tap on{" "}
              <span className="font-bold">"Add to Home Screen"</span>.
            </li>
            <li>Confirm by tapping "Add".</li>
          </ol>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
