import config from "./config";
import main from "./src/main";

main(config).catch(e => {
  console.error(e);
  process.exit(1);
});
