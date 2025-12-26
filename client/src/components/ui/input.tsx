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
    let val = e.target.value;
    if (!val.startsWith("+7")) {
        val = "+7" + val.replace(/\D/g, '').substring(0, 10);
    } else {
        const digits = val.substring(2).replace(/\D/g, '').substring(0, 10);
        val = "+7" + digits;
    }
    
    if (onChange) {
      e.target.value = val;
      const event = {
        ...e,
        target: {
          ...e.target,
          value: val
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
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";
