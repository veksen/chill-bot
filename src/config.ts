export const TOKEN: string | void = process.env.TOKEN;

export const PREFIX: string = "/";

const { ATLAS_USERNAME, ATLAS_PASSWORD, ATLAS_DB } = process.env;

// TODO: possibly extract to env
export const MONGO_PATH: string = `mongodb+srv://${ATLAS_USERNAME}:${ATLAS_PASSWORD}@${ATLAS_DB}?retryWrites=true`;
