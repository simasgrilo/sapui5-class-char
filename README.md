
## SAPUI5 Object Classification

Enhanced experience for class/classification in SAP S4 HANA. This application is loosely based on the idea of the Migration Cockpit's object classification app, which allows multiple objects to have a classification with characteristics valuation assigned to them at once. The main objective of this application is to provide grounds for having an enhanced user experience in the classification system usage, an important but often neglected functionality due to the current S4 transaction-based experience being a bit clunky.

Therefore, using SAPUI5 to develop a new, custom and fresh application following Fiori guidelines is interesting to keep those users engaged in using the standard applcation, rather than requesting new screen enhancements (a real world, business-case pain that I've noted).

This application provides the modelled data in terms of client-side JSON models. In a real world implementation, the calls need to be replaced by the corresponding oData services for the objects used (classes, characteristics, their link with objects like equipment, materials, etc.)

### Features
- General object classification (one at a time) - create, change or delete classification assignments
- Class/characteristic validation based on the models' data
- Allows displaying classes of objects and their corresponding characteristics in a tabular, immediate format

### Starting the app

-   The floorplan for this app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite (namely, the blank app).  In order to launch the generated app, simply run the following from the generated app root folder:

```
    npm start
```

- note that this is valid for running in your local development environment. to host this app in a S4/BTP instance, please follow the corresponding instructions in https://help.sap.com

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)
2. UI5 CLI [tools](https://www.npmjs.com/package/@ui5/cli)
