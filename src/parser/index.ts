import {
  Movie,
  ParserPostMessageArgs,
  RawImages
} from '../types'
import { Root } from 'protobufjs'
import Zlib from 'zlibjs/bin/inflate.min.js'
import SVGA_PROTO from './svga-proto'
import { VideoEntity } from './video-entity'
import { Utils } from '../utils'

const proto = Root.fromJSON(SVGA_PROTO)
const message = proto.lookupType('com.opensource.svga.MovieEntity')

function onmessage (event: { data: ParserPostMessageArgs }): void {
  console.log('新的parser')
  try {
    const buffer = event.data as unknown as ArrayBuffer
    const dataHeader = new Uint8Array(buffer, 0, 4)
    if (Utils.getVersion(dataHeader) !== 2) throw new Error('this parser only support version@2 of SVGA.')
    const inflateData: Uint8Array = new Zlib.Inflate(new Uint8Array(buffer)).decompress()
    const movie = message.decode(inflateData) as unknown as Movie
    const images: RawImages = {}
    const imageBitmaps: ImageBitmap[] = []
    const promises: Array<Promise<boolean>> = []
    for (const key in movie.images) {
      const image = movie.images[key]
      const promise = new Promise<boolean>((resolve, reject) => {
        self.createImageBitmap(new Blob([image])).then(imageBitmap => {
          imageBitmaps.push(imageBitmap)
          images[key] = imageBitmap
          resolve(true)
        }).catch(err => {
          reject(err)
        })
      })
      promises.push(promise)
    }
    Promise.all(promises).then(() => {
      self.postMessage(new VideoEntity(movie, images), [...imageBitmaps])
    }).catch(err => {
      throw err
    })
  } catch (err) {
    self.postMessage(
      new Error(`[SVGA Parser Error] ${(err as Error)?.message}`)
    )
  }
}
self.onmessage = onmessage
