import * as React from "react"
import { cn, labelClasses } from "./utils"

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(labelClasses, className)}
    {...props}
  />
))
Label.displayName = "Label"
