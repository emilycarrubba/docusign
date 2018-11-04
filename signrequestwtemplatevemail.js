/* signrequestwtemplatevemail.js
 *
 * Script that demonstrates use-cases of DocuSign REST API.*/

var docusign = require("docusign-esign");

// NOTE: Values are class members for readability/testing
// TODO: Enter DocuSign credentials
const UserName = "[EMAIL]";
const Password = "[PASSWORD]";

// TODO: Enter Integrator Key (API key), created through developer sandbox see "Helpful Links" for details.
const IntegratorKey = "da04b099-4588-42d7-b5cd-5620f9baf819";

// for production environment update to 'www.docusign.net/restapi'
const BaseUrl = "https://demo.docusign.net/restapi";

/*****************************************************************************************************************
 * RequestSignatureOnDocument()
 *
 * This script demonstrates requesting a signature on a document making the Login API call then the Create Envelope API call.
 ******************************************************************************************************************/
var RequestSignatureOnDocument = function() {
  // TODO: Enter signer information and path to test file
  const signerName = "[SIGNER_NAME]";
  const signerEmail = "[SIGNER_EMAIL]";

  // point to a local document for testing
  const SignTest1File = "[PATH/TO/Desktop/SampleDocument.pdf]";

  // initialize the API client
  var apiClient = new docusign.ApiClient();
  apiClient.setBasePath(BaseUrl);

  // create JSON formatted auth header
  const creds =
    '{"Username":"' +
    UserName +
    '","Password":"' +
    Password +
    '","IntegratorKey":"' +
    IntegratorKey +
    '"}';
  apiClient.addDefaultHeader("X-DocuSign-Authentication", creds);

  // assign api client to the Configuration Object
  docusign.Configuration.default.setDefaultApiClient(apiClient);

  // ===============================================================================
  // Step 1:  Login() API
  // ===============================================================================
  // login call available from the AuthenticationApi
  var authApi = new docusign.AuthenticationApi();

  // optional login parameters to be set
  var loginOps = new authApi.LoginOptions();
  loginOps.setApiPassword("true");
  loginOps.setIncludeAccountIdGuid("true");
  authApi.login(loginOps, function(error, loginInfo, response) {
    if (error) {
      console.log("Error: " + error);
      return;
    }

    if (loginInfo) {
      // list of user account(s)
      // NOTE: any user may be a member of multiple accounts
      var loginAccounts = loginInfo.getLoginAccounts();
      console.log("LoginInformation: " + JSON.stringify(loginAccounts));

      // ===============================================================================
      // Step 2:  Create Envelope API (Signature Request)
      // ===============================================================================

      // create an array that will hold document bytes
      var fileBytes = null;
      try {
        var fs = require("fs");
        var path = require("path");
        // read file from a local directory
        fileBytes = fs.readFileSync(
          path.resolve(__filename + "/.." + SignTest1File)
        );
      } catch (ex) {
        // handle error
        console.log("Exception: " + ex);
      }

      // create an envelope that will store the document(s), field(s), and recipient(s)
      var envDef = new docusign.EnvelopeDefinition();
      envDef.setEmailSubject("Please Sign This Document)");

      // add a document to the envelope
      var doc = new docusign.Document();
      var base64Doc = new Buffer(fileBytes).toString("base64");
      doc.setDocumentBase64(base64Doc);
      doc.setName("SampleDocument.pdf"); // can be different from actual file name
      doc.setDocumentId("1");

      var docs = [];
      docs.push(doc);
      envDef.setDocuments(docs);

      // add a recipient to sign the document, identified by name and email -- (details above)
      var signer = new docusign.Signer();
      signer.setEmail(signerEmail);
      signer.setName(signerName);
      signer.setRecipientId("1");

      // create a signHere tab on the document for the signer to sign
      // default unit of measurement is pixels -- can also be mms, cms, inches.
      var signHere = new docusign.SignHere();
      signHere.setDocumentId("1");
      signHere.setPageNumber("1");
      signHere.setRecipientId("1");
      signHere.setXPosition("100");
      signHere.setYPosition("100");

      // can have multiple tabs -- envelope will need to be added as a single element list
      var signHereTabs = [];
      signHereTabs.push(signHere);
      var tabs = new docusign.Tabs();
      tabs.setSignHereTabs(signHereTabs);
      signer.setTabs(tabs);

      // add recipients (in this case a single signer) to the envelope
      envDef.setRecipients(new docusign.Recipients());
      envDef.getRecipients().setSigners([]);
      envDef
        .getRecipients()
        .getSigners()
        .push(signer);

      // send the envelope by setting |status| to "sent". To save as a draft set to "created"
      envDef.setStatus("sent");

      // use the |accountId| retrieved through the Login API to create the Envelope
      var loginAccount = new docusign.LoginAccount();
      loginAccount = loginAccounts[0];
      var accountId = loginAccount.accountId;

      // initantiate a new EnvelopesApi object
      var envelopesApi = new docusign.EnvelopesApi();

      // call the createEnvelope() API
      envelopesApi.createEnvelope(accountId, envDef, null, function(
        error,
        envelopeSummary,
        response
      ) {
        if (error) {
          console.log("Error: " + error);
          return;
        }

        if (envelopeSummary) {
          console.log("EnvelopeSummary: " + JSON.stringify(envelopeSummary));
        }
      });
    }
  });
}; // end RequestSignatureOnDocument()
