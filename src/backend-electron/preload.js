import {ipcRenderer, contextBridge} from 'electron'

contextBridge.exposeInMainWorld('api', {
	checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
	getPreferences: () => ipcRenderer.invoke('get-preferences'),
	saveToken: data => ipcRenderer.invoke('save-token', data),
	openFolder: () => ipcRenderer.invoke('open-folder'),
	getToken: () => ipcRenderer.invoke('get-token')
})