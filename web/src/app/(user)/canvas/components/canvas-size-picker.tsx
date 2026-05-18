"use client";

import { useState } from "react";
import { Input, Select } from "antd";

import { cn } from "@/lib/utils";

const sizeOptions = ["1:1", "3:2", "2:3", "auto"];

type CanvasSizePickerProps = {
  value: string;
  className?: string;
  onChange: (value: string) => void;
};

export function CanvasSizePicker({ value, className, onChange }: CanvasSizePickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const options = (value && !sizeOptions.includes(value) ? [...sizeOptions, value] : sizeOptions).map((size) => ({ value: size, label: size }));
  const submit = () => {
    const next = custom.trim();
    if (!next) return;
    onChange(next);
    setCustom("");
    setOpen(false);
  };

  return (
    <Select
      open={open}
      className={cn("canvas-control-select h-8", className)}
      value={value || undefined}
      placeholder="比例"
      options={options}
      popupMatchSelectWidth={false}
      onOpenChange={setOpen}
      onChange={onChange}
      popupRender={(menu) => (
        <div className="w-40" onMouseDown={(event) => event.stopPropagation()}>
          {menu}
          <div className="border-t border-stone-200 p-2 dark:border-stone-700">
            <Input size="small" value={custom} placeholder="自定义比例" onChange={(event) => setCustom(event.target.value)} onPressEnter={submit} onBlur={submit} />
          </div>
        </div>
      )}
    />
  );
}
