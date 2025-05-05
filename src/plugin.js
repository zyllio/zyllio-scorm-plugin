(async function () {

  console.log('SCORM Plugin started 16')

  const ScormMapping = {
    'Lesson location': 'cmi.core.lesson_location',
    'Lesson status': 'cmi.core.lesson_status',
    'Exit': 'cmi.core.exit',
    'Score raw': 'cmi.core.score.raw',
    'Score min': 'cmi.core.score.min',
    'Student data mastery score': 'cmi.student_data.mastery_score',
    'Score max': 'cmi.core.score.max',
    'Suspend data': 'cmi.suspend_data',
    'Student data max time allowed': 'cmi.student_data.max_time_allowed',
    'Student data time limit action': 'cmi.student_data.time_limit_action',
    'Comments': 'cmi.comments'
  }

  const ScormMappingReverse = {
    'cmi.core.lesson_location': 'Lesson location',
    'cmi.core.lesson_status': 'Lesson status',
    'cmi.core.exit': 'Exit',
    'cmi.core.score.raw': 'Score raw',
    'cmi.core.score.min': 'Score min',
    'cmi.student_data.mastery_score': 'Student data mastery score',
    'cmi.core.score.max': 'Score max',
    'cmi.suspend_data': 'Suspend data',
    'cmi.student_data.max_time_allowed': 'Student data max time allowed',
    'cmi.student_data.time_limit_action': 'Student data time limit action',
    'cmi.comments': 'Comments'
  }

  class StorageService {

    async updateProgression(newListItem) {

      const module = 'Exemple'

      const application = zySdk.services.runtime.getApplication()

      const user = await zySdk.services.authentication.getCurrentUser()

      const email = user['Email']

      const table = application.tables.find(t => t.name === 'Progressions')

      const tablePropertyValue = {
        type: 'table',
        tableId: table.id
      }

      const foundItems = await zySdk.services.list.retrieveData(application, tablePropertyValue)
      console.log("foundItems ", foundItems);

      const foundUser = foundItems.items.find(item => item['User'] === email)
 console.log("foundUser ", foundUser);

      const listItem = {
        'Module': module,
        'User': email,
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
        'Date': new Date().toISOString().slice(0, 19)
      }

      if (foundUser === undefined) {

        const result = await zySdk.services.list.createData(table.id, listItem)

      } else {

        const rowId = foundUser['_id']
        console.log("rowId ", rowId);

        const result = await zySdk.services.list.updateData(table.id, listItem)

      }





    }
  }

  const zyStorageService = new StorageService()

  class MockScormAPI {

    currentListItem = {}

    LMSInitialize(param = "") {
      console.log("[Mock SCORM] LMSInitialize")
      return "true";
    }

    LMSFinish(param = "") {
      console.log("[Mock SCORM] LMSFinish");
      return "true";
    }

    LMSGetValue(key) {
      console.log("[Mock SCORM] LMSGetValue called for:", key);
      return this.currentListItem[key] || ''
    }

    LMSSetValue(key, value) {
      console.log("[Mock SCORM] LMSSetValue called for:", key, "=", value);

      const mappedKey = ScormMappingReverse[key]

      if (mappedKey) {
        this.currentListItem[mappedKey] = value
      } else {
        console.warn("[Mock SCORM] Unknown SCORM key:", key, "-> value ignored");
      }

      return "true";
    }

    LMSCommit(param = "") {
      console.log("[Mock SCORM] LMSCommit called with param:", param);

      zyStorageService.updateProgression(this.currentListItem)

      this.currentListItem = {}

      return "true";
    }

    LMSGetLastError() {
      console.log("[Mock SCORM] LMSGetLastError called");
      return "0"; // "0" = no error according to SCORM 1.2
    }

    LMSGetErrorString(errorCode) {
      console.log("[Mock SCORM] LMSGetErrorString called for:", errorCode);
      return "No error";
    }

    LMSGetDiagnostic(errorCode) {
      console.log("[Mock SCORM] LMSGetDiagnostic called for:", errorCode);
      return `Diagnostic info for error code ${errorCode}`;
    }
  }

  // Instantiate the mock only if the real SCORM API is not already available
  if (typeof window.API === 'undefined') {
    window.API = new MockScormAPI();
  }


})();