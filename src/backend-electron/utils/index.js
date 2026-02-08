import {app} from 'electron'
import crypto from 'crypto'
import path from 'path'
import os from 'os'

export const isDev = app.isPackaged === false
export const isMac = process.platform === 'darwin'

export const getAssetPath = (...paths) => {
	return isDev
		? path.join(process.cwd(), 'public', ...paths)
		: path.join(process.resourcesPath, ...paths)
}

export const generateDeviceId = () => {

  const {hostname, platform, release} = os
  const appPath = app.getPath('userData')
  const cpuModel = os.cpus()[0].model

  const hash = crypto.createHash('sha256')
  hash.update(`${hostname()}|${platform()}|${release()}|${cpuModel}|${appPath}`)

  return hash.digest('hex').slice(0, 12)

}