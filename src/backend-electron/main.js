import {app, BrowserWindow, shell, dialog, ipcMain} from 'electron'
import squirrelStartup from 'electron-squirrel-startup'
import {isMac, getAssetPath, isDev} from './utils'
import {autoUpdater} from 'electron-updater'
import settings from 'electron-settings'
import MenuBuilder from './utils/menu'
import AutoLaunch from 'auto-launch'
import {fileURLToPath} from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (squirrelStartup)
	app.quit()

let mainWindow;

const createMainWindow = () => {

	if (mainWindow) {

		if (mainWindow.isMinimized())
			mainWindow.restore()

		mainWindow.focus()

		return

	}

	mainWindow = new BrowserWindow({
		width: 900,
		height: 600,
		frame: false,
		autoHideMenuBar: true,
		icon: getAssetPath('icon.png'),
		title: import.meta.env.VITE_APP_TITLE,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	mainWindow.on('close', event => {

		if (!app.isQuitting) {

			event.preventDefault()
			mainWindow?.hide()

			if (isMac)
				app.dock.hide()

		}

	})

	mainWindow.on('closed', () => {
		mainWindow = null
		// server?.close()
	})

	mainWindow.webContents.setWindowOpenHandler(edata => {
		shell.openExternal(edata.url)
		return {action: 'deny'}
	})

	// and load the index.html of the app.
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
	} else {
		mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
	}

}

const buildMenus = () => {

	// initialize menu builder
	const menu = new MenuBuilder(mainWindow)

	menu.buildMenu()
	menu.buildTray([
		{label: 'Show', click: () => {mainWindow?.show(); if (isMac) app.dock.show()}},
		{label: 'Quit', click: () => {app.isQuitting = true; app.quit()}}
	])

}

app.whenReady().then(() => {

	createMainWindow()
	buildMenus()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow()
		} else {
			mainWindow.show()
		}
	})

	if (!isDev) {
		const launcher = new AutoLaunch({name: import.meta.env.VITE_APP_TITLE})
		launcher.isEnabled().then(async (enabled) => {
			if (!enabled) launcher.enable()
		}).catch((err) => {
			console.log('auto_launcher_error', err.message)
		})
	}

})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('before-quit', () => {
	app.isQuitting = true
})

ipcMain.handle('get-token', async () => {
	// fetch token from storage
	return await settings.get('accessToken') || ''
})

ipcMain.handle('save-token', async (_, token) => {
	// save token to file
	await settings.set('accessToken', token)
})

ipcMain.handle('get-preferences', async () => {

	let autoStartup = true

	if (!isDev) {
		const launcher = new AutoLaunch({name: import.meta.env.VITE_APP_TITLE})
		autoStartup = await launcher.isEnabled()
	}

	return {
		autoStartup,
		autoUpdate: true,
		appVersion: app.getVersion()
	}

})

ipcMain.handle('open-folder', async () => {
	return dialog.showOpenDialog({
		properties: ['openDirectory', 'dontAddToRecent']
	})
})

ipcMain.handle('check-for-updates', () => {
	autoUpdater.checkForUpdates()
})