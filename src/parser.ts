import { Video } from './types'

const INLINE_WORKER_FLAG = '#PARSER_V2_INLINE_WROKER#'
function dataURLtoArraybuffer (dataurl: string): ArrayBuffer {
  const arr = dataurl.split(',')
  const bstr = window.atob(arr[1])
  let mime = ((arr[0].match(/:(.*?);/)?.[1]) != null) || ''
  if (mime === 'null') {
    mime = ''
  }
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while ((n--) !== 0) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return u8arr.buffer
}
/**
 * SVGA 下载解析器
 */
export class Parser {
  public worker: Worker
  constructor () {
    this.worker = new Worker(window.URL.createObjectURL(new Blob([INLINE_WORKER_FLAG])))
  }

  /**
   * 通过 url 下载并解析 SVGA 文件
   * @param url SVGA 文件的下载链接
   * @returns Promise<SVGA 数据源>
   */
  async load (url: string): Promise<Video> {
    if (url === undefined) throw new Error('url undefined')
    if (this.worker === undefined) throw new Error('Parser Worker not found')
    return await new Promise((resolve, reject) => {
      this.worker.onmessage = ({ data }: { data: Video | Error }) => {
        data instanceof Error ? reject(data) : resolve(data)
      }
      const buffer = dataURLtoArraybuffer(url)
      this.worker.postMessage(buffer, [buffer])
    })
  }

  /**
   * 销毁实例
   */
  public destroy (): void {
    if (this.worker instanceof Worker) this.worker.terminate()
  }
}
