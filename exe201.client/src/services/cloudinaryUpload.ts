import api from './api'

type SignatureResponse = {
  timestamp: number
  signature: string
  apiKey: string
  cloudName: string
  folder?: string
}

type CloudinaryUploadResult = {
  url: string
  publicId: string
}

async function getSignature(folder?: string): Promise<SignatureResponse> {
  const params = folder ? { folder } : {}
  const res = await api.get<SignatureResponse>('/upload/signature', { params })
  return res.data
}

export async function uploadToCloudinary(
  file: File,
  folder?: string
): Promise<CloudinaryUploadResult> {
  const sig = await getSignature(folder)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sig.apiKey)
  formData.append('timestamp', sig.timestamp.toString())
  formData.append('signature', sig.signature)
  if (sig.folder) {
    formData.append('folder', sig.folder)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || 'Upload failed')
  }

  const data = await response.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

export async function uploadMultipleToCloudinary(
  files: File[],
  folder?: string,
  onProgress?: (index: number, percent: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToCloudinary(files[i], folder)
    onProgress?.(i, 100)
    results.push(result)
  }
  return results
}
