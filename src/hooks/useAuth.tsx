import { useContext } from "react";
import {AuthCotext} from "../context/AuthCotext"

export const useAuth = () => useContext(AuthCotext)