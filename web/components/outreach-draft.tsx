"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Check, X } from "lucide-react";
import type { OutreachStatus } from "@/lib/types";

interface OutreachDraftProps {
  draft: string;
  status: OutreachStatus;
  onApprove: () => void;
  onSkip: () => void;
}

export function OutreachDraft({
  draft,
  status,
  onApprove,
  onSkip,
}: OutreachDraftProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gc-muted hover:text-gc-text transition-colors w-full py-1">
        <ChevronRight
          className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span>View Outreach Draft</span>
        {status === "approved" && (
          <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200">
            Approved
          </Badge>
        )}
        {status === "skipped" && (
          <Badge
            variant="secondary"
            className="ml-auto bg-gray-100 text-gray-500"
          >
            Skipped
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div
          className={`border-l-2 border-gc-red pl-4 py-2 text-sm leading-relaxed whitespace-pre-line ${
            status === "skipped" ? "opacity-50" : "text-gc-text/90"
          }`}
        >
          {draft}
        </div>
        {status === "drafted" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onApprove}
              className="bg-gc-green hover:bg-emerald-700 text-white"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              className="text-gc-muted hover:text-gc-text"
            >
              <X className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
