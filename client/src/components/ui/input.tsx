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
  const formatValue = (val: string) => {
    // Keep only digits
    let digits = val.replace(/\D/g, "");
    
    // If it starts with 8, change to 7
    if (digits.startsWith("8")) {
      digits = "7" + digits.substring(1);
    }
    
    // If it doesn't start with 7 and isn't empty, add 7
    if (digits.length > 0 && !digits.startsWith("7")) {
      digits = "7" + digits;
    }

    // Limit to 11 digits
    digits = digits.substring(0, 11);

    // Format: +7 (XXX) XXX-XX-XX
    let formatted = "+7";
    if (digits.length > 1) {
      formatted += " (" + digits.substring(1, 4);
    }
    if (digits.length >= 5) {
      formatted += ") " + digits.substring(4, 7);
    }
    if (digits.length >= 8) {
      formatted += "-" + digits.substring(7, 9);
    }
    if (digits.length >= 10) {
      formatted += "-" + digits.substring(9, 11);
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatValue(e.target.value);
    
    if (onChange) {
      const event = {
        ...e,
        target: {
          ...e.target,
          value: formatted
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow deleting with Backspace even if formatting is present
    if (e.key === "Backspace") {
      const input = e.currentTarget;
      const val = input.value;
      // If we only have "+7", don't delete further
      if (val === "+7") {
        e.preventDefault();
      }
    }
  };

  return (
    <Input
      className={cn("text-center font-mono h-12 text-lg", className)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      value={value || "+7"}
      ref={ref}
      placeholder="+7 (___) ___-__-__"
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";
