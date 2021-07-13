import fs from 'fs';

// eslint-disable-next-line security/detect-non-literal-fs-filename
export const userlist = process.env.USERLIST_PATH ? JSON.parse(fs.readFileSync(process.env.USERLIST_PATH)) : false;

export default userlist;
