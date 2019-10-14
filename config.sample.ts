export type Config = {
  puppeteer: {
    executablePath?: string;
    headless?: boolean;
  };
  scrapboxProject: string;
  jsonDirPath: string;
  startDate?: string;
  endDate?: string;
};

const config: Config = {
  puppeteer: {
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false,
  },
  scrapboxProject: "projectname",
  jsonDirPath: "/path/to/dir/where/has/20XX-XX-XX.json",
  startDate: "2019-01-01",
  endDate: "2019-10-01",
};

export default config;
