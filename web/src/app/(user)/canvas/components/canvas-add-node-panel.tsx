"use client";

import { useEffect, useRef } from "react";
import { ImageIcon, Type, Upload } from "lucide-react";

import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";

type CanvasAddNodePanelProps = {
  position: { x: number; y: number };
  onAddText: () => void;
  onAddImage: () => void;
  onUpload: () => void;
  onClose: () => void;
};

export function CanvasAddNodePanel({ position, onAddText, onAddImage, onUpload, onClose }: CanvasAddNodePanelProps) {
  const theme = canvasThemes[useThemeStore((state) => state.theme)];
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed z-[80] w-52 rounded-2xl border p-2 shadow-2xl backdrop-blur"
      style={{ left: position.x, top: position.y, background: theme.toolbar.panel, borderColor: theme.toolbar.border }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1 px-2 pt-1 text-[11px] font-medium opacity-40" style={{ color: theme.node.text }}>添加节点</div>
      <PanelItem icon={<Type className="size-4" />} title="文本" desc="添加文本内容节点" theme={theme} onClick={() => { onAddText(); onClose(); }} />
      <PanelItem icon={<ImageIcon className="size-4" />} title="图片" desc="添加空白图片节点" theme={theme} onClick={() => { onAddImage(); onClose(); }} />
      <div className="my-1 h-px" style={{ background: theme.toolbar.border }} />
      <PanelItem icon={<Upload className="size-4" />} title="上传" desc="上传本地图片" theme={theme} onClick={() => { onUpload(); onClose(); }} />
    </div>
  );
}

function PanelItem({ icon, title, desc, theme, onClick }: { icon: React.ReactNode; title: string; desc: string; theme: (typeof canvasThemes)[keyof typeof canvasThemes]; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:opacity-80"
      style={{ color: theme.node.text }}
      onClick={onClick}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: theme.node.fill }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-5">{title}</div>
        <div className="text-[11px] leading-4 opacity-50">{desc}</div>
      </div>
    </button>
  );
}
