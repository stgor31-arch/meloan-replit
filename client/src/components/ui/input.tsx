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
    let input = e.target.value.replace(/\D/g, "");
    
    // Always ensure it starts with 7 if there are any digits
    if (input.startsWith("8")) {
      input = "7" + input.substring(1);
    } else if (input.length > 0 && !input.startsWith("7")) {
      input = "7" + input;
    }
    
    // Limit to 11 digits (7 + 10 digits)
    input = input.substring(0, 11);
    
    let formatted = "+7";
    if (input.length > 1) {
      const area = input.substring(1, 4);
      const part1 = input.substring(4, 7);
      const part2 = input.substring(7, 9);
      const part3 = input.substring(9, 11);
      
      if (input.length > 1) formatted += ` (${area}`;
      if (input.length > 4) formatted += `) ${part1}`;
      if (input.length > 7) formatted += `-${part2}`;
      if (input.length > 9) formatted += `-${part3}`;
    }

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

  return (
    <Input
      className={cn("text-center font-mono", className)}
      onChange={handleChange}
      value={value || "+7"}
      ref={ref}
      placeholder="+7 (___) ___-__-__"
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";
