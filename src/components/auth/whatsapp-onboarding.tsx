
"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState } from "react";

interface WhatsappOnboardingProps {
  onConfirm: () => void;
}

const WHATSAPP_NUMBER = "+14155238886";
const WHATSAPP_MESSAGE = "Join opposite-tank";

export default function WhatsappOnboarding({ onConfirm }: WhatsappOnboardingProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(WHATSAPP_MESSAGE);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 py-4 text-center">
      <p>Tap the button below to open WhatsApp and send the pre-filled message.</p>
      
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">Send this message:</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="font-mono text-lg font-semibold text-foreground bg-background p-2 rounded-md flex-grow">
            {WHATSAPP_MESSAGE}
          </p>
          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      <Button asChild className="w-full" size="lg">
        <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
          Open WhatsApp
        </Link>
      </Button>

      <p className="text-xs text-center text-muted-foreground pt-2">
        After sending the message, come back here and click "Continue".
      </p>

      <div className="border-t pt-4">
        <Button onClick={onConfirm} className="w-full">Continue</Button>
      </div>
    </div>
  );
}
