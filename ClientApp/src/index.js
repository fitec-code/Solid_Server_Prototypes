import {
    getSolidDataset,
    getThing,
    setThing,
    getStringNoLocale,
    setStringNoLocale,
    saveSolidDatasetAt,
    createSolidDataset,
    addStringNoLocale,
    addInteger,
    createThing,
    getThingAll,
    removeThing,
    addUrl,
    getInteger,
    setAgentResourceAccess,
    getResourceInfoWithAcl,
    getResourceAcl,
    hasResourceAcl,
    hasAccessibleAcl,
    hasFallbackAcl,
    saveAclFor,
    createAclFromFallbackAcl

  } from "@inrupt/solid-client";
  import { Session } from "@inrupt/solid-client-authn-browser";
  import { VCARD, SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";
 
  // If your Pod is *not* on `solidcommunity.net`, change this to your identity provider.
  const SOLID_IDENTITY_PROVIDER = "http://localhost:3000";
  document.getElementById(
    "solid_identity_provider"
  ).innerHTML = `[<a target="_blank" href="${SOLID_IDENTITY_PROVIDER}">${SOLID_IDENTITY_PROVIDER}</a>]`;
 
  const NOT_ENTERED_WEBID =
    "...not logged in yet - but enter any WebID to read from its profile...";
 
  const session = new Session();
 
  const buttonLogin = document.getElementById("btnLogin");
  const writeForm = document.getElementById("writeForm");
  const readForm = document.getElementById("readForm");
 
  // 1a. Start Login Process. Call session.login() function.
  async function login() {
    if (!session.info.isLoggedIn) {
      await session.login({
        oidcIssuer: SOLID_IDENTITY_PROVIDER,
        clientName: "Inrupt tutorial client app",
        redirectUrl: window.location.href
      });
    }
  }
 
  // 1b. Login Redirect. Call session.handleIncomingRedirect() function.
  // When redirected after login, finish the process by retrieving session information.
  async function handleRedirectAfterLogin() {
    await session.handleIncomingRedirect(window.location.href);
    if (session.info.isLoggedIn) {
      // Update the page with the status.
      document.getElementById(
        "labelStatus"
      ).innerHTML = `Your session is logged in with the WebID [<a target="_blank" href="${session.info.webId}">${session.info.webId}</a>].`;
      document.getElementById("labelStatus").setAttribute("role", "alert");
      document.getElementById("webID").value = session.info.webId;
    }
  }
 
  // The example has the login redirect back to the index.html.
  // This calls the function to process login information.
  // If the function is called when not part of the login redirect, the function is a no-op.
  handleRedirectAfterLogin();
 
  // 2. Write to profile
  async function writeProfile(dat, range, min, prov) {
    const name = document.getElementById("input_name").value;
 
    if (!session.info.isLoggedIn) {
      document.getElementById(
        "labelWriteStatus"
      ).textContent = `...you can't write [${name}] until you first login!`;
      document.getElementById("labelWriteStatus").setAttribute("role", "alert");
      return;
    }
    const webID = session.info.webId;
    const UN = webID.split('/')[3]
    const POD = 'http://localhost:3000/' + UN
    const profileDocumentUrl = new URL(webID);
    const HeatingUrl = POD + '/' + dat
    profileDocumentUrl.hash = "";
    let myProfileDataset = await getSolidDataset(profileDocumentUrl.href, {
      fetch: session.fetch
    });
    let profile = getThing(myProfileDataset, webID);
    profile = setStringNoLocale(profile, VCARD.fn, name);
    myProfileDataset = setThing(myProfileDataset, profile);
    await saveSolidDatasetAt(profileDocumentUrl.href, myProfileDataset, {
      fetch: session.fetch
    });
    document.getElementById(
      "labelWriteStatus"
    ).textContent = `Wrote [${name}] as name successfully!`;
    document.getElementById("labelWriteStatus").setAttribute("role", "alert");
    document.getElementById(
      "labelFN"
    ).textContent = `...click the 'Read Profile' button to to see what the name might be now...?!`;
    let HeatingDataset
    try {
        HeatingDataset = await getSolidDataset(
            HeatingUrl,
            { fetch: session.fetch }
            );
        let items = getThingAll(HeatingDataset);
        items.forEach((item) => {
            HeatingDataset = removeThing(HeatingDataset, item);
        });
      } catch (error) {
        if (typeof error.statusCode === "number" && error.statusCode === 404) {
            HeatingDataset = createSolidDataset();
        } else {
          console.error(error.message);
        }
      }
    for (let i = 1; i < 32; i++) {
        let name = prov
        let date = i + '_01_2022'
        let value = Math.random() * range + min
        let item = createThing({ name: date });
        item = addUrl(item, RDF.type, AS.Article);
        item = addStringNoLocale(item, SCHEMA_INRUPT.name, name);
        item = addStringNoLocale(item, 'https://schema.org/date', date);
        item = addInteger(item, 'https://schema.org/value', value);
        HeatingDataset = setThing(HeatingDataset, item);
    };
    let savedHeatingData = await saveSolidDatasetAt(
        HeatingUrl,
        HeatingDataset,
        { fetch: session.fetch }
      );

    const myDatasetWithAcl = await getResourceInfoWithAcl(HeatingUrl, {fetch: session.fetch});
    let resourceAcl;
    if (!hasResourceAcl(myDatasetWithAcl)) {
        if (!hasAccessibleAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to change access rights to this Resource."
            );
        }
        if (!hasFallbackAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to see who currently has access to this Resource."
            );
        }
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }
    const updatedAcl = setAgentResourceAccess(
        resourceAcl,
        'http://localhost:3000/HeatingCollector/profile/card#me',
        { read: true, append: false, write: false, control: false }
    );
    console.log('acl created')
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch })
    console.log('acl saved')
}


  async function readProfile(dat) {
    const webID = document.getElementById("webID").value;
    const UN = webID.split('/')[3]
    const POD = 'http://localhost:3000/' + UN
    const HeatingUrl = POD + '/' + dat
    'http://localhost:3000/HeatingCollector/Heating#01_01_2022'


    if (webID === NOT_ENTERED_WEBID) {
      document.getElementById(
        "labelFN"
      ).textContent = `Login first, or enter a WebID (any WebID!) to read from its profile`;
      return false;
    }
    try {
      new URL(webID);
    } catch (_) {
      document.getElementById(
        "labelFN"
      ).textContent = `Provided WebID [${webID}] is not a valid URL - please try again`;
      return false;
    }
    const profileDocumentUrl = new URL(webID);
    profileDocumentUrl.hash = "";
    let myDataset;
    try {
      if (session.info.isLoggedIn) {
        myDataset = await getSolidDataset(profileDocumentUrl.href, { fetch: session.fetch });
      } else {
        myDataset = await getSolidDataset(profileDocumentUrl.href);
      }
    } catch (error) {
      document.getElementById(
        "labelFN"
      ).textContent = `Entered value [${webID}] does not appear to be a WebID. Error: [${error}]`;
      return false;
    }
    const profile = getThing(myDataset, webID);
    let labelFN = getStringNoLocale(profile, VCARD.fn) + '\n';
    let listcontent = ''
    let savedHeatingData = await getSolidDataset(HeatingUrl, { fetch: session.fetch });
    let items = getThingAll(savedHeatingData)
    for (let i = 0; i < items.length; i++) {
        let name = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
        let date = getStringNoLocale(items[i], 'https://schema.org/date');
        let value = getInteger(items[i], 'https://schema.org/value');
        if (name !== null) {
          listcontent += 'On ' + date + ', £' + value + ' on heating from ' + name + "\n";
        }
    }


    document.getElementById('labelFN').textContent = labelFN
    document.getElementById("saveddata").textContent = `[${listcontent}]`;
  }
 
  buttonLogin.onclick = function () {
    login();
  };
 
  writeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    writeProfile('Heating', 10, 0, 'British Gas');
    writeProfile('Wifi', 5, 15, 'BT Internet')
  });
 
  readForm.addEventListener("submit", (event) => {
    event.preventDefault();
    readProfile('Heating');
  });