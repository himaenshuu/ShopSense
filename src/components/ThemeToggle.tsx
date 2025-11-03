import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant={variant}
      size={size === "icon" && showLabel ? "default" : size}
      onClick={toggleTheme}
      className={`transition-all duration-200 ${className}`}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <>
          <Moon className="w-5 h-5" />
          {showLabel && <span className="ml-2">Dark Mode</span>}
        </>
      ) : (
        <>
          <Sun className="w-5 h-5" />
          {showLabel && <span className="ml-2">Light Mode</span>}
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
