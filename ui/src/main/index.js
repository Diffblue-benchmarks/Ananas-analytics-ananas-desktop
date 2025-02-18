// @flow

const { 
	app, 
	dialog, 
  ipcMain,
  shell } = require('electron')
const path  = require('path')
const os = require('os')

const LocalDB        = require('./LocalDB.js')
const log            = require('../common/log')
const Workspace      = require('../common/model/Workspace')
const Project        = require('../common/model/Project')
const User           = require('../common/model/User')

const { checkUpdate } = require('../common/util/update') 

import type { PlainNodeMetadata } from '../common/model/flowtypes'


const home = app.getPath('userData')
const dbPath = path.join(home, 'db')

function init(metadata :{[string]:PlainNodeMetadata}, editors: {[string]: any}) {
  // init localDB
  const localDB = new LocalDB(dbPath)
  log.debug('local db path', dbPath)

  ipcMain.on('get-local-user', event => {
    event.sender.send('get-local-user-result', { code: 200, data: os.userInfo().username })
  })

  ipcMain.on('login', (event, url, email, password) => {
    User.Login(url, email, password)
      .then(user => {
        event.sender.send('login-result', { code: 200, data: user.toPlainObject() })
      })
      .catch(err => {
        event.sender.send('login-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('get-variable-dict', (event, projectId) => {
    localDB.getProjectVariableDict(projectId)
      .then(dict => {
        log.info(dict)
        event.sender.send('get-variable-dict-result', { code: 200, data: dict })
      })
      .catch(err => {
        event.sender.send('get-variable-dict-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('save-variable-dict', (event, projectId, dict) => {
    localDB.saveProjectVariableDict(projectId, dict)
      .then(() => {
        event.sender.send('save-variable-dict-result', { code: 200, data: 'OK' })
      })
      .catch(err => {
        event.sender.send('save-variable-dict-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('load-global-settings', (event) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        event.sender.send('load-global-settings-result', { code: 200, data: workspace })
      })
      .catch(err => {
        event.sender.send('load-global-settings-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('save-global-settings', (event, settings) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        workspace.settings = settings
        return workspace.save()
      })
      .then(() => {
        event.sender.send('save-global-settings-result', { code: 200, data: 'OK' })
      })
      .catch(err => {
        event.sender.send('save-global-settings-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('load-projects', (event) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        return workspace.loadProjects(metadata)
      })
      .then(projects => {
        log.debug('load projects', projects)
        let plainProjects = projects.map(project => project.toPlainObject())
        event.sender.send('load-projects-result', { code: 200, data: plainProjects })
      })
      .catch(err => {
        log.debug('failed to load projects', err.stack)
        event.sender.send('load-projects-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('load-project', (event, projectId) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        return workspace.loadProject(projectId, metadata)
      })
      .then(project => {
        event.sender.send('load-project-result', { code: 200, data: project.toPlainObject() })
      })
      .catch(err => {
        event.sender.send('load-project-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('import-project', (event) => {
    dialog.showOpenDialog({
      title: 'Import Ananas Project',
      defaultPath: app.getPath('home'),
      buttonLabel: 'Import',
      properties: ['openDirectory'],
      message: 'Select Ananas Project'
    }, (filePaths) => {
      log.debug('import project', filePaths)
      if (!filePaths || filePaths.length === 0) {
        return event.sender.send('import-project-result', { code: 500, message: 'cancelled' })
      } 		

      let wks
      let tmpProject
      Project.VerifyProject(filePaths[0])
        .then(() => {
          return Workspace.Load(path.join(home, 'workspace.yml'))
        }) 
        .then(workspace => {
          wks = workspace
          return workspace.importProject(filePaths[0], metadata)
        })
        .then(project => {
          tmpProject = project	
          return wks.save()
        })
        .then(() => {
          event.sender.send('import-project-result', { code: 200, data: tmpProject.toPlainObject() })
        })
        .catch(err => {
          event.sender.send('import-project-result', { code: 500, message: err.message })
        })
    })
  })

  ipcMain.on('save-project', (event, project) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        if (!project.path) {
          project.path = path.join(home, project.id)
        }
        workspace.insertOrUpdateProject({
          id: project.id,
          path: project.path,
        })
        return workspace.save()
      })
      .then(() => {
        let projectObject = new Project(project.path, project)
        return projectObject.save()
      })
      .then(() => {
        event.sender.send('save-project-result', { code: 200, data: 'OK' })
      })
      .catch(err => {
        event.sender.send('save-project-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('delete-project', (event, projectId) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        workspace.removeProject(projectId)
        return workspace.save()
      })
      .then(() => {
        event.sender.send('delete-project-result', { code: 200, data: 'OK' })
      })
      .catch(err => {
        event.sender.send('delete-project-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('load-execution-engines', event => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        return workspace.loadExecutionEngines(path.join(home, 'engine.yml'))
      })
      .then(engines => {
        event.sender.send('load-execution-engines-result', { code: 200, data: engines })
      })
      .catch(err => {
        event.sender.send('load-execution-engines-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('save-execution-engines', (event, engines) => {
    Workspace.Load(path.join(home, 'workspace.yml'))
      .then(workspace => {
        return workspace.saveExecutionEngines(path.join(home, 'engine.yml'), engines)
      })
      .then(() => {
        event.sender.send('save-execution-engines-result', { code: 200, data: 'OK' })
      })
      .catch(err => {
        event.sender.send('save-execution-engines-result', { code: 500, message: err.message })
      })
  })

  ipcMain.on('get-node-metadata', event => {
    log.debug('get node metadata')
    event.sender.send('get-node-metadata-result', {
      code: 200,
      data: Object.values(metadata)
    })
  })

  ipcMain.on('get-editor-metadata', event => {
    log.debug('get editor metadata') 
    event.sender.send('get-editor-metadata-result', {
      code: 200,
      data: editors
    })
  })

  ipcMain.on('check-update', (event, notifyUpdated) => {
    log.debug('check update')
    checkUpdateWrapper(notifyUpdated)
      .then(version => {
        event.sender.send('check-update-result', {
          code: 200,
          data: version,
        })  
      })
      .catch(err => {
        event.sender.send('check-update-result', { code: 500, message: err.message })
      })
  })
}

function loadWorkspace() :Promise<Workspace> {
  return Workspace.Load(path.join(home, 'workspace.yml'))
}

function checkUpdateWrapper(notifyUpdated ?:boolean) {
  return checkUpdate()
    .then(version => {
      if (version) {
        log.info(`a new version ${version.version} is ready to download: ${version.downloadPage}`)
        dialog.showMessageBox({
          title: 'Update',
          message: `A new version ${version.version} is ready for you to download. See: ${version.downloadPage}`
        })
        shell.openExternal(version.downloadPage)
      } else {
        log.info('no update')
        if (notifyUpdated) {
          dialog.showMessageBox({
            title: 'Update',
            message: 'You are running the latest version.'
          })
        }
      }
      return version
    })
}


module.exports = {
  init,
  loadWorkspace,
  checkUpdateWrapper
}
