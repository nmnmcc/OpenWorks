"use client";

import { requestUploadAtom } from "@/atoms/media";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { ImageIcon, XIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface ImageUploadProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly id?: string;
  readonly label?: string;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Empty state:
 * +-------------------------------+
 * | Label?                        |
 * | +---------------------------+ |
 * | |    [icon]                 | |
 * | |  Drop or click to upload  | |
 * | +------ dashed border ------+ |
 * +-------------------------------+
 *
 * With image:
 * +-------------------------------+
 * | Label?                        |
 * | +-------+ [X]                 |
 * | | image |                     |
 * | +-------+                     |
 * +-------------------------------+
 *
 * 拖拽区域 + 隐藏 file input。两步直传：先 POST /media/uploads
 * 申请 presigned URL，再由浏览器 PUT 直传 S3，成功后回填 fileUrl。
 * 接受 jpeg/png/gif/webp/avif/svg。
 * 宽度处置：无同行并列——label、拖拽区、预览图各占一行；拖拽区占满列宽
 * （宽端随父列伸展），预览图 max-h-40 + max-w-full（窄端宽图收缩不溢出），
 * [X] 按钮 absolute 叠加不占行宽。
 * 边界：上传中 → spinner 替换图标。w-fit 预览区
 *       限制图片 max-h-40 + max-w-full + object-contain。
 */
export function ImageUpload({ value, onChange, id, label, className }: ImageUploadProps) {
  const [t] = useT();
  const requestUpload = useAtomSet(requestUploadAtom, { mode: "promise" });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setIsUploading(true);
    try {
      const grant = await requestUpload({
        payload: { contentType: file.type, size: file.size },
      });
      const response = await fetch(grant.uploadUrl, {
        method: "PUT",
        headers: grant.headers,
        body: file,
      });
      if (!response.ok) {
        showApiError(t.errors, response);
        return;
      }
      onChange(grant.fileUrl);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setIsUploading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) upload(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  }

  if (value.length > 0) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label !== undefined && <span className="text-sm font-medium">{label}</span>}
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="max-h-40 max-w-full rounded-lg border object-contain" src={value} />
          <Button
            aria-label={t.common.remove}
            className="absolute top-1 right-1"
            onClick={() => onChange("")}
            size="icon-sm"
            type="button"
            variant="secondary"
          >
            <XIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label !== undefined && (
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        className={cn(
          "text-muted-foreground hover:border-primary/50 hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging && "border-primary bg-muted/50",
        )}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
        type="button"
      >
        {isUploading ? <Spinner /> : <ImageIcon className="size-6" />}
        <span className="text-sm">{isUploading ? t.upload.uploading : t.upload.dropOrClick}</span>
      </button>
      <input
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
        className="hidden"
        id={id}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
