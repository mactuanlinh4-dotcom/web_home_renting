"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface MaskedTextProps {
  value: string;
  type?: "phone" | "idCard" | "custom";
  className?: string;
  copyable?: boolean;
}

/**
 * Che số điện thoại hoặc CCCD theo đúng định dạng:
 * SĐT (10 số): 038****123 (3 số đầu + **** + 3 số cuối)
 * CCCD (12 số): 001****890 (3 số đầu + **** + 3 số cuối)
 */
export function maskSensitiveValue(val: string, type: "phone" | "idCard" | "custom" = "custom"): string {
  if (!val) return "—";
  const clean = val.trim();

  if (type === "phone" && clean.length >= 7) {
    const start = clean.slice(0, 3);
    const end = clean.slice(-3);
    return `${start}****${end}`;
  }

  if (type === "idCard" && clean.length >= 8) {
    const start = clean.slice(0, 3);
    const end = clean.slice(-3);
    return `${start}****${end}`;
  }

  // Mặc định nếu độ dài đủ lớn
  if (clean.length > 6) {
    const start = clean.slice(0, 3);
    const end = clean.slice(-3);
    return `${start}****${end}`;
  }

  return "******";
}

export function MaskedText({
  value,
  type = "custom",
  className = "",
  copyable = true,
}: MaskedTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-slate-400 italic text-xs">—</span>;
  }

  const displayedText = isVisible ? value : maskSensitiveValue(value, type);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Đã sao chép vào bộ nhớ tạm");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible((prev) => !prev);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm ${className}`}>
      <span
        className={`font-semibold tracking-wider transition-colors ${
          isVisible ? "text-slate-900 bg-blue-50/70 px-1 py-0.5 rounded border border-blue-200" : "text-slate-700"
        }`}
      >
        {displayedText}
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleVisibility}
            className="flex size-6 items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label={isVisible ? "Ẩn thông tin" : "Hiện thông tin đầy đủ"}
          >
            {isVisible ? <EyeOff className="size-3.5 text-blue-600" /> : <Eye className="size-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isVisible ? "Bấm để che lại" : "Bấm để xem đầy đủ"}
        </TooltipContent>
      </Tooltip>

      {copyable && isVisible && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              className="flex size-6 items-center justify-center rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label="Sao chép"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {copied ? "Đã sao chép" : "Sao chép số"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
