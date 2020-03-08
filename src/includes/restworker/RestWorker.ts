import axios, { AxiosInstance } from 'axios'

export default class RestWorker {
  target: string
  request: AxiosInstance

  constructor(target: string) {
    this.target = target
    this.request = axios.create({
      baseURL: this.target
    })
  }
}
