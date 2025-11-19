import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Создаем S3 клиент для Supabase Storage
const s3Client = new S3Client({
  forcePathStyle: true,
  region: import.meta.env.VITE_SUPABASE_REGION,
  endpoint: import.meta.env.VITE_SUPABASE_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_SUPABASE_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_SUPABASE_SECRET_ACCESS_KEY,
  }
})

const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME

/**
 * Загружает файл в Supabase Storage
 * @param file - Файл для загрузки
 * @param folder - Папка в storage (опционально)
 * @returns URL загруженного файла
 */
export async function uploadFile(file: File, folder: string = 'courses'): Promise<string> {
  try {
    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Определяем Content-Type на основе расширения файла
    const contentType = getContentType(file.name)

    // Читаем файл как ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // Создаем команду для загрузки
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: new Uint8Array(fileBuffer),
      ContentType: contentType,
      CacheControl: '3600',
    })

    // Отправляем файл
    await s3Client.send(uploadCommand)

    // Формируем публичный URL файла
    const publicUrl = getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading file to Supabase:', error)
    throw new Error('Не удалось загрузить файл. Попробуйте еще раз.')
  }
}

/**
 * Определяет Content-Type на основе расширения файла
 */
function getContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
}

/**
 * Формирует публичный URL для файла
 */
function getPublicUrl(filePath: string): string {
  // Извлекаем project_ref из endpoint
  const endpoint = import.meta.env.VITE_SUPABASE_ENDPOINT
  const projectRef = endpoint.match(/https:\/\/([^.]+)/)?.[1] || 'project_ref'

  return `https://${projectRef}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${filePath}`
}

/**
 * Удаляет файл из Supabase Storage (для будущего использования)
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Извлекаем путь файла из URL
    const urlParts = fileUrl.split(`/public/${BUCKET_NAME}/`)
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL')
    }

    const filePath = urlParts[1]

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    await s3Client.send(deleteCommand)
  } catch (error) {
    console.error('Error deleting file from Supabase:', error)
    throw new Error('Не удалось удалить файл.')
  }
}
