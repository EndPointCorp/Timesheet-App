import crypto from "crypto";

const hashList = (list: string[] | undefined): string | undefined => {
  if (!list) {
    return undefined;
  }

  let hash = crypto.createHash("sha256");

  for (let i = 0; i < list.length; i++) {
    hash = hash.update(list[i]);
  }

  return hash.digest("hex");
};

export default hashList;
