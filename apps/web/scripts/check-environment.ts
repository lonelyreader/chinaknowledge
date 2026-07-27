import "dotenv/config";

import { validateServerEnvironment } from "../src/config/environment";

const environment = validateServerEnvironment();

console.log(
  `Environment check PASS: ${environment.environment}; read=${environment.cmsReadMode}; media=${environment.blobStorageEnabled ? "blob" : "local"}; indexable=${environment.indexable}.`,
);
