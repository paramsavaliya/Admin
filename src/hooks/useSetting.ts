import { useContext } from "react";
import { SettingsContext, SettingsContextValue } from '../context/SettingContext'

export const useSetting = () : SettingsContextValue => useContext(SettingsContext);