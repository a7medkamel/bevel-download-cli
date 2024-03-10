import Bluebird from "bluebird";
import fs from "fs/promises";
import { Version3Client } from "jira.js";
import config from "config";
import _ from "lodash";
import path from "path";
import mkdir from "make-dir";

const client = new Version3Client({
  host: process.env.JIRA_HOST as string,
  authentication: {
    basic: {
      email: process.env.JIRA_EMAIL as string,
      apiToken: process.env.JIRA_TOKEN as string,
    },
  },
});

const MAX_TOTAL = 100_000;
const MAX_BATCH_SIZE = 100;

async function write(org: string, name: string, json: unknown) {
  const filename = path.join('./.organization', org, name);

  await mkdir(path.dirname(filename));
  await fs.writeFile(filename, JSON.stringify(json, null, 2), 'utf8');
}

async function getFields() {
  return client.issueFields.getFields();
}

async function getProjects() {
  return client.projects.searchProjects({
    maxResults: 100
  });
}

async function searchForIssues(projects: string[], startAt: number, max: number) {
  const list = projects.map(p => `"${p}"` ).join(',');

  return client.issueSearch.searchForIssuesUsingJqlPost({
    "fields": [
      "*all"
    ],
    // "jql": `project = "${PROJECT}" AND statusCategory in ("To Do", "In Progress") ORDER BY updated DESC`,
    // "jql": `project = "${project}"`,
    "jql": `project in (${list})`,
    "expand": [`changelog`],
    "maxResults": max,
    "startAt": startAt
  });
}

export async function download(org: string) {
  let at = Number(config.get<number | string>("sync.from"));
  let total = Number(config.get<number | string>("sync.to"));


  const projects = await ( async () => {
    const pconfig = config.get<string[]>('ticket.projects');
    if (pconfig[0] === "*") {
      // call Jira and get all the projects
      const res = await getProjects();
      return _.chain(res.values).map(p => p.key).value();
    }

    return pconfig;
  })();

  console.log(`downloading projects: [${projects}])}`);

  try {
    const fields = await getFields();
    await write(org, './jira/__fields.json', fields);

    while (at < MAX_TOTAL) {
      // todo save total out of this scope and use it in logging.
      console.log(`fetching: ${at} #${MAX_BATCH_SIZE}`);
      const result = await searchForIssues(projects, at, MAX_BATCH_SIZE);

      const { startAt, total: end } = result;
      total = end;

      // apply masks
      const masks = config.get<string[]>('ticket.masks');
      _.each(result.issues, i => {
        _.each(masks, m => {
          _.unset(i, m);
        });
      })

      await write(org, `./jira/issues/${at}.json`, result);

      at = startAt + result.issues.length;

      if (at >= end) {
        break;
      }
    }

    await Bluebird.delay(1_000);
  } catch (e) {
    console.error(e);
  }
}
