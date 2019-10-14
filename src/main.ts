import puppeteer from "puppeteer";
import { promises as fsPromises } from "fs";
import path from "path";
import { Config } from "../config";
import getTitleAndBodyForScrapbox, { SlackMessage } from "./slack";

export default async function main(config: Config) {
  const files = await fsPromises.readdir(config.jsonDirPath);
  const browser = await puppeteer.launch(config.puppeteer);
  const page = await browser.newPage();

  const { startDate: startDateString, endDate: endDateString } = config;
  const startDate = startDateString != null ? new Date(startDateString) : null;
  const endDate = endDateString != null ? new Date(endDateString) : null;

  let json: SlackMessage[] = [];
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const filenameDateString = file.split(".")[0];
    const filenameDate = new Date(filenameDateString);
    if (
      (startDate && filenameDate < startDate) ||
      (endDate && endDate < filenameDate)
    )
      continue;

    const data = await fsPromises.readFile(
      path.resolve(config.jsonDirPath, file),
      "utf-8"
    );
    const jsonData: SlackMessage[] = JSON.parse(data);
    json.push(...jsonData);
  }

  await login(page, config.scrapboxProject);

  for (let jsonIndex = 0; jsonIndex < json.length; jsonIndex++) {
    const message = json[jsonIndex];

    const obj = getTitleAndBodyForScrapbox(message, json);
    if (obj == null) continue;
    const { title, body } = obj;

    await page.goto(getScrapboxPageURL(config.scrapboxProject, title, body), {
      waitUntil: "load",
    });
    await new Promise(r => setTimeout(r, 4000));
  }

  await page.close();
  await browser.close();
}

async function login(page: puppeteer.Page, project: string) {
  const projectURL = `https://scrapbox.io/${project}`;
  await page.goto(projectURL, {
    waitUntil: "domcontentloaded",
  });
  const loginWithGoogleButtonSelector =
    "#app-container > div > div > div > div > div > p:nth-child(3) > a";
  const button = await page.waitForSelector(loginWithGoogleButtonSelector);
  button.click();
  await page.waitForResponse(projectURL, { timeout: 60000 });
}

function getScrapboxPageURL(project: string, title: string, body: string) {
  return `https://scrapbox.io/${project}/${title}?body=${body}`;
}
