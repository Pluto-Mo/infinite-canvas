"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle, Maximize2, Minimize2, X } from "lucide-react";
import { Button, Popover } from "antd";

import { ModelPicker } from "@/components/model-picker";
import { defaultConfig, type AiConfig } from "@/lib/ai-config";
import { canvasThemes } from "@/lib/canvas-theme";
import { useAiConfigStore } from "@/stores/use-ai-config-store";
import { useConfigDialogStore } from "@/stores/use-config-dialog-store";
import { useThemeStore } from "@/stores/use-theme-store";
import { CanvasPromptLibrary } from "./canvas-prompt-library";
import { CanvasSizePicker } from "./canvas-size-picker";
import { CanvasNodeType, type CanvasGenerationMode, type CanvasNodeData } from "../types";

export type CanvasNodeGenerationMode = CanvasGenerationMode;

export type ReferenceImageInfo = { id: string; src: string; title: string };

type CanvasNodePromptPanelProps = {
  node: CanvasNodeData;
  isRunning: boolean;
  referenceImages?: ReferenceImageInfo[];
  onPromptChange: (nodeId: string, prompt: string) => void;
  onConfigChange: (nodeId: string, patch: Partial<CanvasNodeData["metadata"]>) => void;
  onGenerate: (nodeId: string, mode: CanvasNodeGenerationMode, prompt: string) => void;
  onClose?: () => void;
};

export function CanvasNodePromptPanel({ node, isRunning, referenceImages, onPromptChange, onConfigChange, onGenerate, onClose }: CanvasNodePromptPanelProps) {
  const globalConfig = useAiConfigStore((state) => state.config);
  const openConfigDialog = useConfigDialogStore((state) => state.openConfigDialog);
  const theme = canvasThemes[useThemeStore((state) => state.theme)];
  const mode = defaultMode(node.type);
  const config = buildNodeConfig(globalConfig, node, mode);
  const hasTextContent = node.type === CanvasNodeType.Text && Boolean(node.metadata?.content?.trim());
  const hasImageContent = node.type === CanvasNodeType.Image && Boolean(node.metadata?.content);
  const isEditingExistingContent = hasTextContent || hasImageContent;
  const [prompt, setPrompt] = useState(isEditingExistingContent ? "" : node.metadata?.prompt || "");
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrompt(isEditingExistingContent ? "" : node.metadata?.prompt || "");
  }, [isEditingExistingContent, node.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!panelRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      e.stopPropagation();
      if (expanded) {
        setExpanded(false);
      } else {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [expanded, onClose]);

  const updatePrompt = (value: string) => {
    setPrompt(value);
    if (!isEditingExistingContent) onPromptChange(node.id, value);
  };

  const submit = () => {
    const text = prompt.trim();
    if (!text || isRunning) return;
    onGenerate(node.id, mode, text);
    setPrompt("");
  };

  const refs = referenceImages?.length ? referenceImages : undefined;

  const panelContent = (
    <div
      ref={panelRef}
      className={`rounded-2xl border p-3 shadow-2xl backdrop-blur transition-all duration-200 ${expanded ? "w-[680px]" : ""}`}
      style={{ background: theme.toolbar.panel, borderColor: theme.toolbar.border, color: theme.node.text }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      {/* Reference images row */}
      {refs ? (
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {refs.map((img) => (
            <img key={img.id} src={img.src} alt={img.title} className="size-10 shrink-0 rounded-lg border object-cover" style={{ borderColor: theme.node.stroke }} title={img.title} draggable={false} />
          ))}
        </div>
      ) : null}

      <textarea
        value={prompt}
        onChange={(event) => updatePrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.ctrlKey || event.metaKey || event.shiftKey) return;
          event.preventDefault();
          submit();
        }}
        className={`thin-scrollbar w-full resize-none rounded-xl border px-3 py-2 text-sm leading-5 outline-none transition-all duration-200 ${expanded ? "h-64" : "h-24"}`}
        style={{ background: theme.node.fill, borderColor: theme.node.stroke, color: theme.node.text }}
        placeholder={mode === "image" ? hasImageContent ? "请输入你想要把这张图修改成什么" : "描述要生成的图片内容" : hasTextContent ? "请输入你想要将本段文本修改成什么" : "请输入你想要生成的文本内容"}
      />

      <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CanvasPromptLibrary onSelect={updatePrompt} />
          <ModelPicker config={config} value={config.model} onChange={(model) => onConfigChange(node.id, { model })} onMissingConfig={() => openConfigDialog(true)} />
          {mode === "image" ? (
            <CanvasSizePicker className="w-[92px] shrink-0 !h-10" value={config.size} onChange={(value) => onConfigChange(node.id, { size: value })} />
          ) : null}
          {mode === "image" ? (
            <CountPicker value={Math.floor(Math.abs(Number(config.count)) || 1)} onChange={(value) => onConfigChange(node.id, { count: value })} theme={theme} />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-70"
            style={{ color: theme.node.text }}
            onClick={() => expanded ? setExpanded(false) : setExpanded(true)}
            title={expanded ? "收起" : "放大输入层"}
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          {expanded ? (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-70"
              style={{ color: theme.node.text }}
              onClick={() => { setExpanded(false); onClose?.(); }}
              title="关闭"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Button
            type="primary"
            shape="circle"
            className="!h-10 !w-10 !min-w-10 shrink-0"
            disabled={isRunning || !prompt.trim()}
            onClick={submit}
            icon={isRunning ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            aria-label="生成"
          />
        </div>
      </div>
    </div>
  );

  if (expanded) {
    return createPortal(
      <div className="fixed inset-0 z-[9998] flex items-center justify-center" onClick={() => setExpanded(false)}>
        <div onClick={(e) => e.stopPropagation()}>{panelContent}</div>
      </div>,
      document.body,
    );
  }

  return panelContent;
}

function defaultMode(type: CanvasNodeData["type"]): CanvasNodeGenerationMode {
  return type === CanvasNodeType.Text ? "text" : "image";
}

function buildNodeConfig(globalConfig: AiConfig, node: CanvasNodeData, mode: CanvasNodeGenerationMode): AiConfig {
  const defaultModel = mode === "image" ? globalConfig.imageModel : globalConfig.textModel;
  return {
    ...globalConfig,
    model: node.metadata?.model || defaultModel || globalConfig.model || defaultConfig.model,
    quality: globalConfig.quality || defaultConfig.quality,
    size: node.metadata?.size || globalConfig.size || defaultConfig.size,
    count: String(node.metadata?.count || (mode === "image" ? 3 : globalConfig.count) || defaultConfig.count),
  };
}

const COUNT_OPTIONS = [1, 2, 3, 4, 6, 8];

function CountPicker({ value, onChange, theme }: { value: number; onChange: (v: number) => void; theme: (typeof canvasThemes)[keyof typeof canvasThemes] }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="top"
      arrow={false}
      overlayInnerStyle={{ padding: 0 }}
      content={
        <div
          className="flex gap-1 rounded-xl p-1.5"
          style={{ background: `linear-gradient(135deg, ${theme.toolbar.panel}, ${theme.node.fill})` }}
        >
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className="grid size-8 place-items-center rounded-lg text-sm font-medium transition hover:scale-105"
              style={{
                background: n === value ? theme.toolbar.activeBg : "transparent",
                color: n === value ? theme.toolbar.activeText : theme.node.text,
              }}
              onClick={() => { onChange(n); setOpen(false); }}
            >
              {n}
            </button>
          ))}
        </div>
      }
    >
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition hover:opacity-80"
        style={{ borderColor: theme.node.stroke, color: theme.node.text }}
      >
        {value}
      </button>
    </Popover>
  );
}
