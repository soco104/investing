// The app version comes from package.json, so bumping "version" there is the
// only change needed. Named JSON import: only this field ends up in the bundle.
import { version } from "../package.json";

export const APP_VERSION = version;
