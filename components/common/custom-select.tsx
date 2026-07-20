"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type CustomSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  label?: string;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = true,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchQuery
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full items-center justify-between rounded-md border border-white/15 bg-black/40 px-4 text-sm font-medium text-white transition-all hover:border-[#8b5cf6]/50 focus:border-[#8b5cf6] focus:outline-none select-none cursor-pointer"
      >
        <span className={selectedOption ? "text-white font-medium truncate" : "text-[#8991a6] truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#8991a6] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-[#8b5cf6]" : ""
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute left-0 right-0 top-full z-[999] overflow-hidden rounded-lg border border-white/15 bg-[#0e0b1f] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            {/* Optional Search Filter */}
            {searchable && options.length > 5 && (
              <div className="relative mb-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8991a6]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  autoFocus
                  className="h-9 w-full rounded-md border border-white/10 bg-black/50 pl-9 pr-3 text-xs text-white placeholder-[#656d82] outline-none focus:border-[#8b5cf6]/60"
                />
              </div>
            )}

            {/* Options List */}
            <div data-lenis-prevent className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#8b5cf6] text-white"
                          : "text-[#d0d6e5] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate font-semibold">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={`block text-[10px] truncate ${isSelected ? "text-white/80" : "text-[#8991a6]"}`}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={16} className="shrink-0 ml-2 text-white" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-[#8991a6]">No matching options</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
