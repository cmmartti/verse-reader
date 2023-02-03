import React from "react";

export function RadioButtons({
   value,
   onChange,
   options = [],
   name,
}: {
   value: string;
   onChange?: (value: string) => void;
   options?: {
      value: string;
      children: React.ReactNode;
      inputProps?: React.DetailedHTMLProps<
         React.InputHTMLAttributes<HTMLInputElement>,
         HTMLInputElement
      >;
   }[];
   name: string;
}) {
   let htmlId = React.useId();

   let changeHandler = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         if (event.target.checked) {
            onChange?.(event.target.value);
         }
      },
      [onChange]
   );

   return (
      <>
         {options.map((option, i) => (
            <React.Fragment key={i}>
               <input
                  {...option.inputProps}
                  id={htmlId + i}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={changeHandler}
               />
               <label htmlFor={htmlId + i}>{option.children}</label>
            </React.Fragment>
         ))}
      </>
   );
}
