import { createContext, useContext, useState } from "react";
import uuid from "react-native-uuid";

export const USER_TOKEN = uuid.v4() as string;

const USER_DATA = {
  phone: "+380990000000",
  email: "test@mail.com",
  timeZone: "Europe/Kyiv",
  languageCode: "en-UA",
  firstName: "Barney",
  lastName: "Stinson",
  address: {
    region: "Ukraine",
    town: "Kyiv",
    address: "25 Random st.",
    postcode: "01001",
  },
  fields: [{ key: "PERSONAL.COUNTRYCODE", value: "UA" }],
};

export type UserData = typeof USER_DATA;

type UserContextType = {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>(USER_DATA);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
