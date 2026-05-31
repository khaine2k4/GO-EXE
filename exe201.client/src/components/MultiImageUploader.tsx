import { useState, useRef, useCallback } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { uploadToCloudinary } from '../services/cloudinaryUpload'

type MultiImageUploaderProps = {
  onUrlsChanged: (urls: string[]) => void
  folder?: string
  initialUrls?: string[]
  label?: string
  maxFiles?: number
  maxSizeMB?: number
}

export default function MultiImageUploader({
  onUrlsChanged,
  folder = 'exe201',
  initialUrls = [],
  label = 'Tải ảnh lên',
  maxFiles = 20,
  maxSizeMB = 10,
}: MultiImageUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))

      if (fileArray.length === 0) {
        setError('Chỉ chấp nhận file ảnh (JPG, PNG, WebP)')
        return
      }

      const oversized = fileArray.find((f) => f.size > maxSizeMB * 1024 * 1024)
      if (oversized) {
        setError(`Ảnh "${oversized.name}" quá lớn. Tối đa ${maxSizeMB}MB`)
        return
      }

      if (urls.length + fileArray.length > maxFiles) {
        setError(`Tối đa ${maxFiles} ảnh`)
        return
      }

      setUploading(true)
      setUploadCount(0)
      setTotalCount(fileArray.length)

      const newUrls: string[] = []
      for (let i = 0; i < fileArray.length; i++) {
        try {
          const result = await uploadToCloudinary(fileArray[i], folder)
          newUrls.push(result.url)
          setUploadCount(i + 1)
        } catch (err) {
          setError(`Upload thất bại: ${fileArray[i].name}`)
          break
        }
      }

      setUploading(false)
      if (newUrls.length > 0) {
        const updated = [...urls, ...newUrls]
        setUrls(updated)
        onUrlsChanged(updated)
      }
    },
    [folder, maxFiles, maxSizeMB, urls, onUrlsChanged]
  )

  function removeUrl(index: number) {
    const updated = urls.filter((_, i) => i !== index)
    setUrls(updated)
    onUrlsChanged(updated)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-xl border border-slate-200">
            <img src={url} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="absolute right-1 top-1 rounded-lg bg-rose-500 p-1 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < maxFiles && (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition ${
              dragActive
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs font-bold text-slate-500">
                  {uploadCount}/{totalCount}
                </span>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                  <Plus className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-xs font-bold text-slate-500">Thêm ảnh</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  )
}
