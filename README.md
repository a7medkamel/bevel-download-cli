# bevel-download-cli

## .env file

You will need a .env file in the root of this repo with the following fields

```
JIRA_HOST="https://your_jira_host"
JIRA_EMAIL="your_jira_email_address"
JIRA_TOKEN="your_jira_token"
```

## install

You will need nodejs installed on your machine

Then run `npm i` in this root folder to download all the dependencies (listed in `package.json`).

## Build

Run `npm run build` to build the project.

## Start download

To start the download process run:
```
npm run start -- --org YOU_ORG_NAME -c --no-obfuscate
```

## Mask fields

You can mask any fields deemed sensative by adding the json path of the field to the `./config-ts/default.ts` file under the `ticket.masks` config.

For example you can blank out all Jira Issue descriptions by settings a mask for `"fields.description"`
