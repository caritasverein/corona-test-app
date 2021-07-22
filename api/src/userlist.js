import fs from 'fs';

// eslint-disable-next-line security/detect-non-literal-fs-filename
export const userlist = process.env.USERLIST_PATH ? JSON.parse(fs.readFileSync(process.env.USERLIST_PATH)) : false;

export default userlist;

// eslint-disable-next-line security/detect-non-literal-fs-filename
export const grouplist = process.env.USERLIST_PATH ? JSON.parse(fs.readFileSync(process.env.GROUPLIST_PATH)) : false;

export const groupedUserlist = Object.fromEntries(Object.entries(grouplist).map(([name, userids])=>{
  return [
    name,
    userids.map((id)=>userlist.find((u)=>u.id===id)),
  ];
}));
