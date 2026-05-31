import { useState, useRef, useCallback } from 'react'
import { X, Loader2, CheckCircle2, ImageIcon } from 'lucide-react'
import { uploadToCloudinary } from '../services/cloudinaryUpload'

type ImageUploaderProps = {
  onUploaded: (url: string) => void
  folder?: string
  currentUrl?: string
  label?: string
  accept?: string
  maxSizeMB?: number
}

export default function ImageUploader({
  onUploaded,
  folder = 'exe201',
  currentUrl,
  label = 'Tải ảnh lên',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 10,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setDone(false)

      if (!file.type.startsWith('image/')) {
        setError('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)')
        return
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Ảnh quá lớn. Tối đa ${maxSizeMB}MB`)
        return
      }

      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)
      setUploading(true)

      try {
        const result = await uploadToCloudinary(file, folder)
        setPreview(result.url)
        onUploaded(result.url)
        setDone(true)
        setTimeout(() => setDone(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload thất bại')
        setPreview(currentUrl || null)
      } finally {
        setUploading(false)
        URL.revokeObjectURL(localPreview)
      }
    },
    [folder, maxSizeMB, onUploaded, currentUrl]
  )

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function clearPreview() {
    setPreview(null)
    setError(null)
    onUploaded('')
  }

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      {preview ? (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200">
          <img src={preview} alt="Preview" className="aspect-video w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition group-hover:bg-black/40">
            {uploading ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-xs font-black text-slate-900">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lên...
              </div>
            ) : done ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white">
                <CheckCircle2 className="h-4 w-4" /> Hoàn tất!
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl bg-white/90 px-4 py-2 text-xs font-black text-slate-900 opacity-0 transition hover:bg-white group-hover:opacity-100"
                >
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  onClick={clearPreview}
                  className="rounded-xl bg-rose-500 p-2 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition ${
            dragActive
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <ImageIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-center">
                <span className="text-sm font-black text-slate-700">
                  Kéo thả ảnh vào đây
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-400">
                  hoặc click để chọn • JPG, PNG, WebP • Tối đa {maxSizeMB}MB
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  )
}
