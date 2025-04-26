(function () {

  console.log('SCORM Plugin started 2')
 
  class MockScormAPI {
    constructor() {
      console.warn("[Mock SCORM] No SCORM API found, activating mock.");
      this.dataStore = {}; // Simulated internal data storage
    }
  
    LMSInitialize(param = "") {
      console.log("[Mock SCORM] LMSInitialize called with param:", param);
      return "true";
    }
  
    LMSFinish(param = "") {
      console.log("[Mock SCORM] LMSFinish called with param:", param);
      return "true";
    }
  
    LMSGetValue(key) {
      console.log("[Mock SCORM] LMSGetValue called for:", key);
      return this.dataStore[key] || "";
    }
  
    LMSSetValue(key, value) {
      console.log("[Mock SCORM] LMSSetValue called for:", key, "=", value);
      this.dataStore[key] = value;
      return "true";
    }
  
    LMSCommit(param = "") {
      console.log("[Mock SCORM] LMSCommit called with param:", param);
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


  const zySdk = window.parent.zySdk

  const application = zySdk.services.runtime.getApplication()


 console.log("application ", application.name);


  


})();