"use client";

import React from "react";
import { ArrowUp, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputBoxProps {
  onSend?: (message: string) => void;
  placeholder?: string;
  className?: string;
  isSubmitting?: boolean;
}

export function PromptInputBox({
  onSend = () => {},
  placeholder = "Type your message here...",
  className,
  isSubmitting = false,
}: PromptInputBoxProps) {
  const [input, setInput] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);

  const hasContent = input.trim().length > 0;

  const sendMessage = () => {
    if (!hasContent) return;
    onSend(input);
    setInput("");
  };

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-white/10 bg-[#141414] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setIsRecording((value) => !value)}
          disabled={isSubmitting}
          className={cn(
            "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white/75 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/8 hover:text-white",
            isRecording && "bg-white text-[#1F2023] hover:bg-white",
            isSubmitting && "cursor-not-allowed opacity-60 hover:translate-y-0",
          )}
          aria-label="Voice input"
        >
          <Mic className="h-4 w-4" />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) {
              return;
            }

            event.preventDefault();
            sendMessage();
          }}
          className="max-h-40 min-h-23 w-full resize-none overflow-y-auto rounded-[1.1rem] border-0 bg-transparent py-2.5 pl-0 pr-1 text-left text-sm leading-6 text-white placeholder:text-white/30 focus:outline-none sm:min-h-26 sm:text-[15px]"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!hasContent || isSubmitting}
          className={cn(
            "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-sm transition duration-200 hover:-translate-y-0.5",
            hasContent
              ? "bg-white text-[#1F2023] hover:bg-white"
              : "bg-white/15 text-white/35",
            isSubmitting && "cursor-not-allowed opacity-60 hover:translate-y-0",
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 border-t border-white/10 pt-2" />
    </div>
  );
}
