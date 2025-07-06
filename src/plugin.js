// Executed in Application window (not IFRAME's)

(async function () {

  console.log('SCORM Plugin started 28')

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
    'cmi.core.lesson_mode': 'Mode',
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

    queue = Promise.resolve();

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

    extractModuleId() {

      // Étape 1 : trouver le composant zyllio-embed
      const component = document.querySelector('zyllio-embed');
      if (!component || !component.shadowRoot) {
        console.warn("zyllio-embed or its shadowRoot not found.");
        return "Unknown";
      }

      // Étape 2 : chercher l'iframe dans le shadow DOM du composant
      const iframe = component.shadowRoot.querySelector('iframe');
      if (!iframe || !iframe.src) {
        console.warn("No iframe with a valid src found inside shadow DOM.");
        return "Unknown";
      }

      // Étape 3 : extraire le chemin de l'iframe
      const iframeUrl = new URL(iframe.src, window.location.origin);
      const path = iframeUrl.pathname;

      const segments = path.split('/').filter(segment => segment !== '');

      if (segments.length >= 2) {
        return segments[segments.length - 2];
      }

      return "Unknown";

    }

    async updateProgression(newListItem) {

      this.queue = this.queue.then(() => this.subUpdateProgression(newListItem));

      return this.queue;
    }

    async subUpdateProgression(newListItem) {

      console.log("New progression to update", newListItem);

      const moduleId = this.extractModuleId()

      const application = zySdk.services.runtime.getApplication()

      const user = await zySdk.services.authentication.getCurrentUser()

      if (user === undefined) {
        console.warn('User not found !')
        return
      }

      const email = user.Email

      const name = user.Name

      const table = application.tables.find(t => t.name === 'Progressions')

      if (table === undefined) {
        throw Error('Table progressions not found')
      }

      const tablePropertyValue = {
        type: 'table',
        tableId: table.id
      }

      const progressions = await zySdk.services.list.retrieveData(application, tablePropertyValue)

      const foundProgression = progressions.items.find(item => item['Learner Id'] === email && item['Module Id'] === moduleId)

      const listItem = {
        'Module Id': moduleId,
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
        'Session time': this.iso8601ToMinutes(newListItem['Session time']) ?? '',
        'Mode': newListItem['Mode'] ?? '',
        'Launch data': newListItem['Launch data'] ?? '',
        'Date': new Date().toISOString().slice(0, 16).replace('T', ' ')
      }

      console.log("Updating progression", listItem);

      if (foundProgression === undefined) {

        return zySdk.services.list.createData(table.id, listItem)

      } else {

        const rowId = foundProgression['_id']

        listItem['_id'] = rowId

        return await zySdk.services.list.updateData(table.id, listItem)
      }
    }

    // Exemple d'entrée : 'PT1H30M', 'PT45M', 'PT2H'
    iso8601ToMinutes(duration) {

      const regex = /P(?:T)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      
      const match = duration.match(regex);

      if (!match) {
        throw new Error('Format ISO 8601 non reconnu');
      }

      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const seconds = match[3] ? parseInt(match[3], 10) : 0;

      return hours * 60 + minutes + (seconds >= 30 ? 1 : 0); // Arrondi à la minute supérieure si >= 30 sec
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