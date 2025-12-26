import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, onChange, value, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    // Extract only digits
    let digits = inputVal.replace(/\D/g, "");
    
    // Handle the leading 7/8 logic
    if (digits.length > 0) {
      if (digits.startsWith("8")) {
        digits = "7" + digits.substring(1);
      } else if (!digits.startsWith("7")) {
        digits = "7" + digits;
      }
    } else {
      // If user clears everything, reset to empty or +7
      digits = "";
    }

    // Limit to 11 digits
    digits = digits.substring(0, 11);

    // Format: +7 (XXX) XXX-XX-XX
    let formatted = "";
    if (digits.length > 0) {
      formatted = "+7";
      if (digits.length > 1) {
        formatted += " (" + digits.substring(1, 4);
      }
      if (digits.length > 4) {
        formatted += ") " + digits.substring(4, 7);
      }
      if (digits.length > 7) {
        formatted += "-" + digits.substring(7, 9);
      }
      if (digits.length > 9) {
        formatted += "-" + digits.substring(9, 11);
      }
    } else {
        formatted = "+7";
    }

    if (onChange) {
      // Create a shallow copy of the event and override the target value
      const newEvent = Object.create(e);
      Object.defineProperty(newEvent, 'target', {
        value: { ...e.target, value: formatted },
        writable: false
      });
      onChange(newEvent);
    }
  };

  return (
    <Input
      className={cn("text-center font-mono h-12 text-lg", className)}
      onChange={handleChange}
      value={value || "+7"}
      ref={ref}
      placeholder="+7 (___) ___-__-__"
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";
