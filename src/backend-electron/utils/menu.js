import {app, Menu, Tray, nativeImage} from 'electron'
import {isMac, getAssetPath, isDev} from '../utils'
import fs from 'fs'

// prevent default menu from being created
Menu.setApplicationMenu(null)

export default class MenuBuilder {

	mainWindow

	constructor(mainWindow) {
		this.mainWindow = mainWindow
	}

	buildMenu() {

		const template = isMac
			? this.buildDarwinTemplate()
			: this.buildDefaultTemplate()

		const menu = Menu.buildFromTemplate(template)
		Menu.setApplicationMenu(menu)

		return menu

	}

	buildTray(template) {

		// get icon path
		const trayIconPath = getAssetPath('tray', isMac ? 'icon-template.png' : 'icon.png')

		if (!fs.existsSync(trayIconPath))
			return console.error('Tray icon not found:', trayIconPath)

		const trayIcon = nativeImage.createFromPath(trayIconPath)

		if (isMac)
			trayIcon.setTemplateImage(true)

		if (trayIcon.isEmpty())
			return console.error('Failed to load tray icon')

		const tray = new Tray(trayIcon)

		const contextMenu = Menu.buildFromTemplate(template)

		tray.setToolTip(import.meta.env.VITE_APP_TITLE)
		tray.setContextMenu(contextMenu)

		// On Windows, left click should open the app
		if (process.platform === 'win32')
			tray.on('click', () => mainWindow?.show())

		return tray

	}

	buildDarwinTemplate() {

		const subMenuAbout = {
			label: 'MusicOne',
			submenu: [
				{
					label: 'About',
					selector: 'orderFrontStandardAboutPanel:',
				},
				{ type: 'separator' },
				{
					label: 'Hide',
					accelerator: 'Command+H',
					selector: 'hide:',
				},
				{
					label: 'Hide Others',
					accelerator: 'Command+Shift+H',
					selector: 'hideOtherApplications:',
				},
				{ label: 'Show All', selector: 'unhideAllApplications:' },
				{ type: 'separator' },
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click: () => {
						app.isQuitting = true
						app.quit()
					}
				}
			]
		}

		const subMenuWindow = {
			label: 'Window',
			submenu: [
				{
					label: 'Minimize',
					accelerator: 'Command+M',
					selector: 'performMiniaturize:',
				},
				{ label: 'Close', accelerator: 'Command+W', click: () => {
					this.mainWindow?.hide()
					app.dock.hide()
				}},
				{ type: 'separator' },
				{ label: 'Bring All to Front', selector: 'arrangeInFront:' },
			],
		}

		const subMenuDev = {
			label: 'Development',
			submenu: [
				{
					label: 'Force Reload',
					accelerator: isMac ? 'Command+R' : 'Control+R',
					click: () => {

						if (!this.mainWindow)
							return false

						this.mainWindow.webContents.reloadIgnoringCache()
					}
				},
				{
				label: 'Toggle DevTools',
				accelerator: isMac ? 'Command+Shift+C' : 'Control+Shift+C',
				click: () => {

						if (!this.mainWindow)
							return false

						const {webContents} = this.mainWindow
						const isOpened = webContents.isDevToolsOpened()

						webContents[isOpened ? 'closeDevTools' : 'openDevTools']({mode: 'undocked'})

					}
				}
			]
		}

		const list = [subMenuAbout, subMenuWindow]

		if (isDev)
			list.push(subMenuDev)

		return list

	}

	buildDefaultTemplate() {
		const templateDefault = [
			{
				label: '&File',
				submenu: [
					{
						label: '&Open',
						accelerator: 'Ctrl+O',
					},
					{
						label: '&Close',
						accelerator: 'Ctrl+W',
						click: () => {
							this.mainWindow.close()
						}
					}
				]
			}
		]

		return templateDefault

	}
}
