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
  const [displayValue, setDisplayValue] = React.useState(value?.toString() || "+7");

  React.useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // If user tries to delete the +7, put it back
    if (!input.startsWith("+7")) {
      if (input.startsWith("7")) input = "+" + input;
      else if (input.startsWith("8")) input = "+7" + input.substring(1);
      else input = "+7" + input.replace(/\D/g, "");
    }

    // Extract digits only for formatting (excluding the initial +7)
    const digits = input.substring(2).replace(/\D/g, "").substring(0, 10);
    
    let formatted = "+7";
    if (digits.length > 0) {
      formatted += " (" + digits.substring(0, 3);
      if (digits.length >= 4) {
        formatted += ") " + digits.substring(3, 6);
      }
      if (digits.length >= 7) {
        formatted += "-" + digits.substring(6, 8);
      }
      if (digits.length >= 9) {
        formatted += "-" + digits.substring(8, 10);
      }
    }

    setDisplayValue(formatted);

    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
          name: props.name
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <Input
      className={cn("text-center font-mono h-12 text-lg", className)}
      onChange={handleChange}
      value={displayValue}
      ref={ref}
      placeholder="+7 (___) ___-__-__"
      type="tel"
      {...props}
    />
  );
});
PhoneInput.displayName = "PhoneInput";
