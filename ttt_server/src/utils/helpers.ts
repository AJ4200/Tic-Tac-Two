import fs from 'fs';

// Read the JSON file and parse its contents
const aliasNames = JSON.parse(fs.readFileSync("alias_names.json", "utf8"));

// Function to generate a random alias from the list
export const generateAlias = () => {
  const randomIndex = Math.floor(Math.random() * aliasNames.length);
  return aliasNames[randomIndex];
};

// Function to get the avatar URL for a given alias
export const generateAvatar = (email) => {
  return `https://robohash.org/${email}`;
};
