(async function () {

  console.log('SCORM Plugin started 22')

  const ScormMappingReverse = {
    // Champs communs ou repris de SCORM 1.2
    'cmi.core.lesson_location': 'Lesson location',
    'cmi.core.lesson_status': 'Lesson status',
    'cmi.core.exit': 'Exit',
    'cmi.core.score.raw': 'Score raw',
    'cmi.core.score.min': 'Score min',
    'cmi.core.score.max': 'Score max',
    'cmi.student_data.mastery_score': 'Student data mastery score',
    'cmi.student_data.max_time_allowed': 'Student data max time allowed',
    'cmi.student_data.time_limit_action': 'Student data time limit action',
    'cmi.suspend_data': 'Suspend data',
    'cmi.comments': 'Comments',
    'cmi.mode': 'Mode',
    'cmi.launch_data': 'Launch data',

    // Champs SCORM 2004 réutilisant les libellés existants
    'cmi.location': 'Lesson location',
    'cmi.completion_status': 'Lesson status',
    'cmi.success_status': 'Success status',
    'cmi.score.raw': 'Score raw',
    'cmi.score.min': 'Score min',
    'cmi.score.max': 'Score max',
    'cmi.exit': 'Exit',
    'cmi.max_time_allowed': 'Student data max time allowed',
    'cmi.time_limit_action': 'Student data time limit action',
    'cmi.suspend_data': 'Suspend data',

    // Nouveaux champs SCORM 2004 uniquement
    'cmi.score.scaled': 'Score scaled',
    'cmi.progress_measure': 'Progress measure',
    'cmi.comments_from_learner': 'Comments from learner',
    'cmi.comments_from_lms': 'Comments from LMS',
    'cmi.total_time': 'Total time',
    'cmi.session_time': 'Session time',
    'cmi.learner_name': 'Learner name',
    'cmi.learner_id': 'Learner ID'
  }

  class StorageService {

    async getProgression() {

      const value = {
        type: 'row-variable',
        variableName: 'Progression',
        tableId: '',
      }

      const progression = await zySdk.services.dictionary.getValue(value)

      console.log("Get Progression ", progression)

      return progression
    }

    async updateProgression(newListItem) {

      console.log("New progressionto update", newListItem);

      const module = 'Exemple'

      const application = zySdk.services.runtime.getApplication()

      const user = await zySdk.services.authentication.getCurrentUser()

      if (user === undefined) {
        console.warn('User not found !')
        return
      }

      const email = user.Email

      const name = user.Name

      const table = application.tables.find(t => t.name === 'Progressions')

      const tablePropertyValue = {
        type: 'table',
        tableId: table.id
      }

      const progressions = await zySdk.services.list.retrieveData(application, tablePropertyValue)

      const foundProgression = progressions.items.find(item => item['Learner Id'] === email)

      const listItem = {
        'Module Id': module,
        'Learner Id': email,
        'Learner name': name,
        'Lesson location': newListItem['Lesson location'] ?? '',
        'Lesson status': newListItem['Lesson status'] ?? '',
        'Exit': newListItem['Exit'] ?? '',
        'Score raw': newListItem['Score raw'] ?? '',
        'Score min': newListItem['Score min'] ?? '',
        'Student data mastery score': newListItem['Student data mastery score'] ?? '',
        'Score max': newListItem['Score max'] ?? '',
        'Suspend data': newListItem['Suspend data'] ?? '',
        'Student data max time allowed': newListItem['Student data max time allowed'] ?? '',
        'Student data time limit action': newListItem['Student data time limit action'] ?? '',
        'Comments': newListItem['Comments'] ?? '',
        'Success status': newListItem['Success status'] ?? '',
        'Score scaled': newListItem['Score scaled'] ?? '',
        'Progress measure': newListItem['Progress measure'] ?? '',
        'Comments from learner': newListItem['Comments from learner'] ?? '',
        'Comments from LMS': newListItem['Comments from LMS'] ?? '',
        'Total time': newListItem['Total time'] ?? '',
        'Session time': newListItem['Session time'] ?? '',
        'Mode': newListItem['Mode'] ?? '',
        'Launch data': newListItem['Launch data'] ?? '',        
        'Date': new Date().toISOString().slice(0, 16).replace('T', ' ')
      }

      console.log("Updating progression", listItem);

      if (foundProgression === undefined) {

        const result = await zySdk.services.list.createData(table.id, listItem)

      } else {

        const rowId = foundProgression['_id']

        listItem['_id'] = rowId

        const result = await zySdk.services.list.updateData(table.id, listItem)
      }
    }
  }

  const zyStorageService = new StorageService()

  class MockScormAPI {

    currentListItem = {}

    LMSInitialize(param = "") {
      console.log("SCORM LMSInitialize")

      zyStorageService.getProgression().then((progression) => {
        console.log("init progression ", progression);

        if (progression !== undefined) {
          this.currentListItem = progression
        }

      })

      return "true";
    }

    LMSFinish(param = "") {
      console.log("SCORM LMSFinish");
      return "true";
    }

    LMSGetValue(key) {

      const mappedKey = ScormMappingReverse[key]

      if (mappedKey) {

        const value = this.currentListItem[mappedKey] || ''

        console.log("SCORM LMSGetValue", key, value);

        return value

      } else {
        console.warn("SCORM Unknown SCORM key:", key, "-> value ignored");
      }
    }

    LMSSetValue(key, value) {

      console.log("SCORM LMSSetValue", key, "=", value);

      const mappedKey = ScormMappingReverse[key]

      if (mappedKey) {
        this.currentListItem[mappedKey] = value
      } else {
        console.warn("SCORM Unknown SCORM key:", key, "-> value ignored");
      }

      return "true";
    }

    LMSCommit(param = "") {
      console.log("SCORM LMSCommit called with param:", param);

      zyStorageService.updateProgression(this.currentListItem).then(() => {        
      })

      return "true";
    }

    LMSGetLastError() {
      console.log("SCORM LMSGetLastError");
      return "0"; // "0" = no error according to SCORM 1.2
    }

    LMSGetErrorString(errorCode) {
      console.log("SCORM LMSGetErrorString", errorCode);
      return "No error";
    }

    LMSGetDiagnostic(errorCode) {
      console.log("SCORM LMSGetDiagnostic", errorCode);
      return `Diagnostic info for error code ${errorCode}`;
    }
  }

  // Instantiate the mock only if the real SCORM API is not already available
  if (typeof window.API === 'undefined') {
    window.API = new MockScormAPI();
  }

  class MockScorm2004API {
    Initialize(param = "") {
      return window.API.LMSInitialize(param);
    }

    Terminate(param = "") {
      return window.API.LMSFinish(param);
    }

    GetValue(key) {
      return window.API.LMSGetValue(key);
    }

    SetValue(key, value) {
      return window.API.LMSSetValue(key, value);
    }

    Commit(param = "") {
      return window.API.LMSCommit(param);
    }

    GetLastError() {
      return window.API.LMSGetLastError();
    }

    GetErrorString(errorCode) {
      return window.API.LMSGetErrorString(errorCode);
    }

    GetDiagnostic(errorCode) {
      return window.API.LMSGetDiagnostic(errorCode);
    }
  }

  // Injecter leSCORM2004 dans l'environnement global
  if (typeof window.API_1484_11 === 'undefined') {
    window.API_1484_11 = new MockScorm2004API();
  }

})();