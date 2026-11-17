import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  buildIndex: () => ipcRenderer.invoke('index:build'),
  search: (term) => ipcRenderer.invoke('files:search', term),
  openFile: (path) => ipcRenderer.invoke('files:open', path),
  showInFolder: (path) => ipcRenderer.invoke('files:showInFolder', path),
  onIndexProgress: (callback) => {
    const listener = (_event, count) => callback(count)
    ipcRenderer.on('index:progress', listener)
    return () => ipcRenderer.removeListener('index:progress', listener)
  },
  getIndexInfo: () => ipcRenderer.invoke('index:info')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
