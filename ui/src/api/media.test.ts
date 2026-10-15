import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { uploadMedia } from '@/api/media'

vi.mock('axios')

describe('uploadMedia', () => {
  it('posts formData and returns uploaded media metadata', async () => {
    const mockFile = new File(['dummy-content'], 'test.png', { type: 'image/png' })
    const mockResult = {
      file_path: 'statics/media/uploads/test.png',
      file_url: 'http://localhost:3000/statics/media/uploads/test.png',
      file_name: 'test.png',
      file_size: 13,
      mime_type: 'image/png',
    }

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        code: 'SUCCESS',
        message: 'file uploaded successfully',
        results: mockResult,
      },
    })

    const result = await uploadMedia(mockFile)
    expect(result).toEqual(mockResult)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/app/media/upload'),
      expect.any(FormData),
      expect.any(Object),
    )
  })

  it('throws an error if backend returns error code', async () => {
    const mockFile = new File(['dummy-content'], 'test.png', { type: 'image/png' })
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        code: 'ERROR',
        message: 'File too large',
      },
    })

    await expect(uploadMedia(mockFile)).rejects.toThrow('File too large')
  })
})
